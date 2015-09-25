var Slack = require('slack-client');
var token = '';
var autoReconnect = true;
var autoMark = true;

var slack = new Slack(token, autoReconnect, autoMark);

var skumppaChannel;

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
            if (channel.name == "random") {
                skumppaChannel = channel;
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
    var channel, channels, channelError, channelName, errors, response, text, textError, ts, type, typeError, user, userName;
    channel = slack.getChannelGroupOrDMByID(message.channel);
    user = slack.getUserByID(message.user);
    response = '';
    type = message.type, ts = message.ts, text = message.text;
    channelName = (channel != null ? channel.is_channel : void 0) ? '#' : '';
    channelName = channelName + (channel ? channel.name : 'UNKNOWN_CHANNEL');
    userName = (user != null ? user.name : "UNKNOWN_USER");

    if (type === 'message' && (text != null) && (channel != null)) {
        if (text.indexOf("skumppa") > -1) {
            response = "<!channel> Skumppa mainittu kanavassa <#" + channel.id + ">! " + userName + ": \"" + text + "\"";
            skumppaChannel.send(response);
            console.log("Received: " + type + " " + channelName + " " + userName + " " + ts + " \"" + text + "\"");
        }
    } else {
        typeError = type !== 'message' ? "unexpected type " + type + "." : null;
        textError = text == null ? 'text was undefined.' : null;
        channelError = channel == null ? 'channel was undefined.' : null;
        errors = [typeError, textError, channelError].filter(function(element) {
            return element !== null;
        }).join(' ');
        return console.log("@" + slack.self.name + " could not respond. " + errors);
    }
});

slack.on('error', function(error) {
    return console.error("Error: " + error);
});

slack.login();
