var changeCase = require('change-case');
var config = require('./config.json');
var format = require('string-template');

var RtmClient = require('@slack/client').RtmClient;
var MemoryDataStore = require('@slack/client').MemoryDataStore;
var CLIENT_EVENTS = require('@slack/client').CLIENT_EVENTS;
var RTM_EVENTS = require('@slack/client').RTM_EVENTS;

if (typeof config.ignoreSelf === 'undefined') {
    config.ignoreSelf = false;
}

var jira = false;
if (typeof config.jira !== 'undefined') {
    var Jira = require('jira').JiraApi;
    jira = new Jira(config.jira.protocol, config.jira.host, config.jira.port, config.jira.user, config.jira.password, '2');
}

var rtm = new RtmClient(config.token, {
    logLevel: 'error',
    dataStore: new MemoryDataStore(),
    autoReconnect: true,
    autoMark: true
});
rtm.start();

rtm.on(CLIENT_EVENTS.RTM.AUTHENTICATED, function (rtmStartData) {
    console.log(`Logged in as ${rtmStartData.self.name} of team ${rtmStartData.team.name}.`);
});

rtm.on(RTM_EVENTS.MESSAGE, function handleRtmMessage (message) {
    var channel = rtm.dataStore.getChannelGroupOrDMById(message.channel);
    var user = rtm.dataStore.getUserById(message.user);
    var response = config.response;
    var subtype = message.subtype;
    var type = message.type;
    var ts = message.ts;
    var text = message.text;
    var userName = (user != null ? user.real_name : message.username);
    var team = rtm.dataStore.getTeamById(rtm.activeTeamId);
    var announceChannel = rtm.dataStore.getChannelByName(config.announceChannel);
    var selfUser = rtm.dataStore.getUserById(rtm.activeUserId);

    var channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
    channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');

    // By trial and error this seems to be the archive URL of Slack messages. When included in a message Slack formats
    // it nicely.
    var archiveUrl = 'https://' + team.domain + '.slack.com/archives/' + channel.name + '/p' +
        ts.split('.').join('');

    if (message.hidden) {
        return;
    }

    if (
        type === 'message' && text != null && channel != null &&
        subtype !== 'channel_join' && subtype !== 'channel_leave' && channel.id !== announceChannel.id
    ) {
        if (jira) {
            // http://stackoverflow.com/a/6969486
            // https:\/\/lyytidev\.atlassian\.net\/browse\/([A-Za-z0-9-]+)
            var re = new RegExp(config.jira.protocol + ":\/\/" + config.jira.host.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&") + "\/browse\/([A-Za-z0-9-]+)", "g");
            var match = re.exec(text);
            var matches = [];
            while (match != null) {
                if (matches.indexOf(match[1]) === -1) {
                    matches.push(match[1]);
                }
                match = re.exec(text);
            }

            matches.forEach(function (value) {
                jira.findIssue(value, function (error, issue) {
                    if (!error) {
                        rtm.sendMessage('[' + issue.key + '] ' + issue.fields.summary, message.channel);
                    }
                });
            });
        }

        if (channel.id !== announceChannel.id) {
            var keyword;
            // Using for instead of forEach() so that we can break the loop by returning. Prevents multiple announcements if
            // there are more than one keyword in a message.
            for (i = 0; i < config.keywords.length; i++) {
                keyword = config.keywords[i];
                if (changeCase.lowerCase(text).indexOf(changeCase.lowerCase(keyword)) > -1) {
                    // Check if the bot name contains the keyword and if the message contains the bot name. If both of these
                    // conditions are true it seems like the bot triggered on the bot name, which is a behavior that is mostly
                    // unwanted.
                    if (
                        config.ignoreSelf &&
                        changeCase.lowerCase(selfUser.name).indexOf(changeCase.lowerCase(keyword)) > -1 &&
                        changeCase.lowerCase(text).indexOf(changeCase.lowerCase(selfUser.name)) > -1
                    ) {
                        console.log('Received ' + type + ' in ' + channelName + ' from ' + userName + ' at ' + ts +
                            ' on keyword "' + keyword + '", triggered on bot name, didn\'t respond: "' + text + '"');
                    } else {
                        // Could include a bunch more of these, but currently only the ones I personally need or have needed are
                        // listed. Might be a good idea to add some validation for some of these. Pull requests welcome!
                        response = format(response, {
                            archiveUrl: archiveUrl,
                            channelId: channel.id,
                            channelName: channelName,
                            keyword: keyword,
                            keywordUcfirst: changeCase.upperCaseFirst(keyword),
                            messageText: text,
                            realName: userName
                        });

                        rtm.sendMessage(response, announceChannel.id);
                        return console.log('Received ' + type + ' in ' + channelName + ' from ' + userName + ' at ' + ts +
                            ' on keyword "' + keyword + '": "' + text + '"');
                    }
                }
            }
        }
    } else {
        var typeError = type !== 'message' ? 'unexpected type ' + type + '.' : null;
        var textError = text == null ? 'text was undefined.' : null;
        var channelError = channel == null ? 'channel was undefined.' : null;
        var joinError = subtype === 'channel_join' ? 'channel join message.' : null;
        var leaveError = subtype === 'channel_leave' ? 'channel leave message.' : null;
        var errors = [typeError, textError, channelError, joinError, leaveError].filter(function (element) {
            return element !== null;
        }).join(' ');
        return console.log('@' + selfUser.name + ' could not respond. ' + errors);
    }
});
