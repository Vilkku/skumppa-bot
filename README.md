# skumppa-bot

**Skumppa:** *From Swedish skumvin ‎(“sparkling wine”).* [[1](https://en.wiktionary.org/wiki/skumppa)]

They are serving up some of that sweet skumppa, but you missed it again? Never again! Invite skumppa-bot to your Slack channels and get notified whenever someone as much as whispers the word.

## Instructions

### Clone and install skumppa-bot
    git clone https://github.com/Vilkku/skumppa-bot.git
    cd skumppa-bot
    npm install

### Create the configuration file
    cp config.sample.json config.json

### Configure the bot
The configuration values are

#### token
String. Provided by Slack. Get it by creating a bot integration for your community (<community>.slack.com/services/new/bot)

#### announceChannel
String. Name of the channel where notifications will be sent.

#### keywords
Array of strings. The words skumppa-bot will trigger on.

### Run the bot
    node app.js

