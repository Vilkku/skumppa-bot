var Slack = require('slack-client');
var changeCase = require('change-case');
var format = require("string-template");
var config = require('./config.json');

var token = config.token;
var autoReconnect = true;
var autoMark = true;

var slack = new Slack(token, autoReconnect, autoMark);

var announceChannel;

slack.on('open', function() {
    var channel, channels, group, groups, id, messages, unreads;
    channels = [];
    groups = [];
    unreads = slack.getUnreadCount();

    channels = (function() {
        var ref, results;
        ref = slack.channels;
        results = [];
        for (id in ref) {
            channel = ref[id];
            if (channel.is_member) {
                results.push("#" + channel.name);
            }
            if (channel.name == config.announceChannel) {
                announceChannel = channel;
            }
        }
        return results;
    })();

    groups = (function() {
        var ref, results;
        ref = slack.groups;
        results = [];
        for (id in ref) {
          group = ref[id];
          if (group.is_open && !group.is_archived) {
            results.push(group.name);
          }
        }
        return results;
    })();

    console.log("Welcome to Slack. You are @" + slack.self.name + " of " + slack.team.name);
    console.log('You are in: ' + channels.join(', '));
    console.log('As well as: ' + groups.join(', '));
    messages = unreads === 1 ? 'message' : 'messages';
    return console.log("You have " + unreads + " unread " + messages);
});

slack.on('message', function(message) {
    // All code is based on compiling the node-slack-client coffeescript example and using the resulting javascript as
    // base. All events contain a bit of strange code because of this, but message is affected the most as it is the one
    // most modified.
    var channel = slack.getChannelGroupOrDMByID(message.channel);
    var user = slack.getUserByID(message.user);
    var response = config.response;
    var subtype = message.subtype;
    var type = message.type
    var ts = message.ts
    var text = message.text;
    var userName = (user != null ? user.real_name : message.username);

    var channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
    channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');

    // By trial and error this seems to be the archive URL of Slack messages. When included in a message Slack formats
    // it nicely.
    var archiveUrl = "https://" + slack.team.domain + ".slack.com/archives/" + channel.name + "/p" +
                        ts.split('.').join("");

    if (message.hidden) {
        return;
    }

    if (
        (type === 'message')
        && (text != null)
        && (channel != null)
        && (subtype != "channel_join")
        && (subtype != "channel_leave")
    ) {
        var keyword;
        // Using for instead of forEach() so that we can break the loop by returning. Prevents multiple announcements if
        // there are more than one keyword in a message.
        for (i = 0; i < config.keywords.length; i++) {
            keyword = config.keywords[i];
            if (changeCase.lowerCase(text).indexOf(changeCase.lowerCase(keyword)) > -1) {
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

                announceChannel.send(response);
                return console.log("Received " + type + " in " + channelName + " from " + userName + " at " + ts +
                                    " on keyword \"" + keyword + "\": \"" + text + "\"");
            }
        }
    } else {
        console.log(message);
        var typeError = type !== 'message' ? "unexpected type " + type + "." : null;
        var textError = text == null ? 'text was undefined.' : null;
        var channelError = channel == null ? 'channel was undefined.' : null;
        var joinError = subtype == "channel_join" ? 'channel join message.' : null;
        var leaveError = subtype == "channel_leave" ? 'channel leave message.' : null;
        var errors = [typeError, textError, channelError, joinError, leaveError].filter(function(element) {
            return element !== null;
        }).join(' ');
        return console.log("@" + slack.self.name + " could not respond. " + errors);
    }
});

slack.on('error', function(error) {
    return console.error("Error: " + error);
});

slack.login();
