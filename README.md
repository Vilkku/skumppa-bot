# skumppa-bot

**Skumppa:**
> From Swedish *skumvin*‎ (“sparkling wine”). [[1](https://en.wiktionary.org/wiki/skumppa)]

They are serving up some of that sweet skumppa, but you missed it again? Never again! Invite skumppa-bot to your Slack channels and get notified whenever skumppa, or whatever other word you want to get notified of, is mentioned.

## What it actually does
Monitors Slack channels the bot has been invited to. Whenever someone sends a message with one of the specified keywords is one of the channel it notifies of this in a specified announce channel. So, everyone who wants to be notified can be in that channel, and everyone else won't be bothered by the bot.

## Installing and running

### Clone and install skumppa-bot
    git clone https://github.com/Vilkku/skumppa-bot.git
    cd skumppa-bot
    npm install

### Create the configuration file
    cp config.sample.json config.json

### Run the bot
    node app.js

## Configuration

Configuration is read from the file config.json, which should be created in the skumppa-bot directory (same directory as the app.js file). A sample config.sample.json file is provided as a starting point.

### Values

#### token
String. Provided by Slack. Get it by creating a bot integration for your community (<community>.slack.com/services/new/bot)

#### announceChannel
String. Name of the channel where notifications will be sent.

#### keywords
Array of strings. The words skumppa-bot will trigger on.

#### ignoreSelf
Boolean. If true the bot will not react to messages when the name of the bot contains the keyword and the message contains the bot's name.

#### ignoreBots
Boolean. If true the bot will not react to messages from bots (bot users or Slackbot).

#### response
String. The message skumppa-bot will respond with. Template words can be written within {braces}. See [the message formatting documentation](https://api.slack.com/docs/formatting) for details on how Slack creates clickable links for channels and users. There are probably many useful template words missing, suggestions are welcome.

##### {archiveUrl}
Archive URL for received message.

##### {channelId}
Channel ID for received message. Can be used like `<#{channelId}>` to create clickable #channel link. 

##### {channelName}
Channel name for received message, prefixed with #.

##### {keyword}
Keyword skumppa-bot triggered on. If the message contains multiple keywords, this will be the first keyword.

##### {keywordUcfirst}
Same as `{keyword}`, but with the first letter in upper case.

##### {messageText}
The message text that contained the keyword.

##### {realName}
Real name of the user for received message. Defaults to username if real name is not available (for example if the message was sent by another bot).
