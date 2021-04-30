const config = require("./config.json");
const Discord = require('discord.js');
const database = require("./database/MySqlConnection");
const clientExport = require("./index.js");
const client = clientExport.client;


function voting(message) {
    const messageUserID = message.author.id
    let channelID, body;
    const filterChannel = (response) => {
        if (response.author.id === messageUserID && response.content.length > 2) {
            channelID = response.content.slice(2, 20);
            return true;
        }
        return false;
    };
    const filterBody = (response) => {
        if (response.author.id === messageUserID && response.content.length > 2) {
            body = response.content;
            return true;
        }
        return false;
    };

    message.channel.send("In what channel would you like the voting to be in? :ok_hand:").then(() => {
        message.channel.awaitMessages(filterChannel, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("What will be the voting options? (Max 5 Voting options)\nexample:\n`Vote Option | url(Not Needed)\nVote Option | url(Not Needed)\nVote Option | url(Not Needed)`").then(() => {
                    message.channel.awaitMessages(filterBody, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("Lets start the voting!! :tada: :partying_face:");
                            processBody(message, channelID, body)
                        })
                        .catch(collected => {
                            message.channel.send("Something went wrong with out database, or you waited longer then 2 minutes to respond!");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    });
}


function processBody(message, channelID, body) {
    let hasLink = false;
    let splitByLine = body.split("\n");
    if (splitByLine[0].includes("|")) {
        let bodyWithLinks = [];
        splitByLine.forEach(line => bodyWithLinks.push(line.split("|")))
        splitByLine = bodyWithLinks;
        hasLink = true;
    }
    sendVoting(message, splitByLine, channelID,hasLink)
}


function sendVoting(message, gameList, channelId, hasLink) {
    let date;
    date = new Date(Date.now() + config.lengthOfDaysVoting   * 1000)
    const giveawayChannel = message.guild.channels.cache.find(channel => channel.id === channelId);
    let body = "";
    const hearts = [":heart:", ":orange_heart:", ":green_heart:", ":yellow_heart:", ":white_heart:"]
    const heartsEmbed = ["❤️", "🧡", "💚", "💛", "🤍"]
    if (hasLink) {
        for (let i = 0; i < gameList.length; i++) {
            body += "" + hearts[i] + " [" + gameList[i][0] + "](" + gameList[i][1] + ")\n";
        }

    } else {
        for (let i = 0; i < gameList.length; i++) {
            body += "" + " " + hearts[i] + gameList[i] + "\n";
        }
    }
    giveawayChannel.send("\n", {
        "embed": {
            "title": "***Voting***",
            "timestamp": "" + date,
            "description":  "" + body,
            "color": 4385012,
            "footer": {
                "text": "voting ends"
            }
        }
    }).then(sentEmbed => {
        for (let i = 0; i < gameList.length; i++) {
            sentEmbed.react(heartsEmbed[i])
        }
        addVotingToDatabase(message, channelId, sentEmbed.id, body, gameList.length, date)

    })

}

function addVotingToDatabase(message, channelId, message_id, body, totalOptions, endDate) {
    waitingEndVoting(message, channelId, message_id, totalOptions, body, endDate)

    database.addVoting(channelId, message_id, body, totalOptions,endDate)
}


function getTheMessage(message, channelId, messageID, gameList, totalOptions, endDate) {
    const channelMessage = message.guild.channels.cache.find(channel => channel.id === channelId)
    channelMessage.messages.fetch(messageID).then(element => countVotes(channelMessage, messageID, gameList, endDate, totalOptions,element.reactions.cache.toJSON()))
}

function waitingEndVoting(message, channelId, messageID ,totalOptions, body, endDate) {
    let x = setInterval(function () {
        let now = new Date().getTime();
        let t = endDate - now;
        if (t < 0) {
            clearInterval(x);
            getTheMessage(message, channelId, messageID, body, totalOptions,endDate)
        }
    }, 100000);
}

function countVotes(message, messageID, body, date, totalOptions,element) {
    const hearts = [":heart:", ":orange_heart:", ":green_heart:", ":yellow_heart:", ":white_heart:"];
    let highest = [0, 0]
    for (let i = 0; i < element.length; i++) {
        if (element[i].count > highest[1]) {
            highest[0] = i;
            highest[1] = element[i].count
        }

    }

    database.updateVotingByMessageID(messageID)

    message.messages.fetch(messageID)
        .then(msg => {
            msg.edit({
                "embed": {
                    "title": "***Voting Ended***",
                    "timestamp": "" + date,
                    "description": "" + body +
                        "\nWon: " + hearts[highest[0]],
                    "color": 4385012,
                    "footer": {
                        "text": "voting ends"
                    }
                }
            });
        });
}

function checkVoting(message){
    database.getVoting((err, result) => {
        for (let voting of result) {
            let date = new Date(voting.time)
            waitingEndVoting(message, voting.channel_id, voting.message_id, voting.totalOptions, voting.body, date)
        }
    });
}


module.exports = {
    voting,
    checkVoting
}