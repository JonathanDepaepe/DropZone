const config = require("./config.json");
const Discord = require('discord.js');
const database = require("./database/MySqlConnection")
const fetch = require("node-fetch");
const SteamAPI = require('steamapi');
const steam = new SteamAPI('75BD7BC81C6A6AC657375A9517353A8F');
const clientExport = require("./index.js")
const client = clientExport.client

let dailyGiveaway = false;

function addKeyDailyDatabase(message) {
    const giveawayUserIdRequester = message.author.id;

    let steamLink;
    let gameKey;
    const filterItemName = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            gameKey = response.content;
            return true;
        }
        return false;
    };

    const filterItemLink = (response) => {
        if (response.author.id === giveawayUserIdRequester && response.content.length > 2) {
            steamLink = response.content;
            return true;
        }
        return false;
    };

    message.channel.send("Lets add a daily giveaway key!\nPlease enter the game key :smile:").then(() => {
        message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("What will be the `Steam Game link?` :sunglasses:").then(() => {
                    message.channel.awaitMessages(filterItemLink, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("Thanks for adding a game to our daily giveaways!! :tada: :partying_face:");
                            database.addDailyKey(gameKey, steamLink, message.author.username);
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


function startDailyCommand(message) {
    if (config.creators.includes(parseInt(message.author.id))) {
        startDaily(message)
    }
}


function startDaily() {
    database.getDailyGames((err, keys) => {
        if (keys.length > 0) {
            let steamAppId = keys[0].link.split("/")
            steam.getGameDetails(steamAppId[4]).then(result => {
                const dailyChannel = client.channels.cache.find(channel => channel.id === config.dailyGiveawayChannel);
                let date = new Date(Date.now() + 86400000); //86.400.000ms --> 1D/24H
                dailyChannel.send({"content": " :tada: **Daily Giveaway!** :tada:",
                    "embed": {
                        "title": "" + result.name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + 24 + " hours " + 0 + " minutes " + 0 + " seconds",
                        "url": "" + keys[0].link,
                        "color": 10761782,
                        "timestamp": "" + date,
                        "footer": {
                            "text": "Created by " + keys[0].username
                        },
                        "image": {
                            "url": "" + result.header_image
                        }
                    }
                }).then(sentEmbed => {
                    updateDaily(date, dailyChannel,keys,result ,sentEmbed.id);
                    sentEmbed.react("723120954468990996")
                })
            })
        }
    })

}


function updateDaily(date, channel, keys, steamInfo, messageId) {

    let x = setInterval(function () {
        let now = new Date().getTime();
        let t = date - now;
        let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((t % (1000 * 60)) / 1000);

        channel.messages.fetch(messageId)
            .then(msg => {
                msg.edit({
                    "embed": {"content": " :tada: **Daily Giveaway!** :tada:",
                        "title": "" + steamInfo.name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + hours + " hours " + minutes + " minutes " + seconds + " seconds",
                        "url": "" + keys[0].link,
                        "color": 10761782,
                        "timestamp": "" + date,
                        "footer": {
                            "text": "Created by " + keys[0].username
                        },
                        "image": {
                            "url": "" + steamInfo.header_image
                        }
                    }
                })
            })
        channel.messages.fetch(messageId)
            .then(msg => getDailyReactionsUsers(msg, keys))
        if (t < 0) {
            clearInterval(x);
            endGiveaway(messageId, keys, date, steamInfo, channel)
        }

    }, 10000);

}

function getDailyReactionsUsers(msg, keys) {
    msg.awaitReactions((reaction) => reaction.emoji.id === '723120954468990996',  {time: 10000})
        .then(collected => addUsersToDatabase(collected.toJSON(), keys))
        .catch(console.error);
}

function addUsersToDatabase(messageData, keys) {
    let databaseUsers = [];
    let messageUsers = [];
    database.getDailyUsers(keys[0].id, (err, users) => {
        if (err) throw console.error(err);

        for (let enteredUsers of users) {
            if (!databaseUsers.includes(enteredUsers.userID)) {
                databaseUsers.push(enteredUsers.userID)
            }
        }
        if (!(messageData.length === 0))
            messageUsers = messageData[0].users
        for (let user of messageUsers) {
            if (!databaseUsers.includes(user)) {
                database.addUserDaily(user,keys[0].id);
            }

        }
    })
}


function endGiveaway(messageId, keys, date, steamInfo, channel) {
    let databaseUsers = [];
    let winnerId, winnerTag;


    database.setDailyEnded(keys[0].id)
    database.getDailyUsers(keys[0].id, (err, users) => {

        for (let enteredUsers of users) {
            if (!databaseUsers.includes(enteredUsers.userID)) {
                databaseUsers.push(enteredUsers.userID)
            }
        }


        for (let i = 0; i < 1; i++) {
            let randomNumber = Math.floor(Math.random() * (databaseUsers.length - 2 + 1)) + 1;
            if (databaseUsers[randomNumber] !== "720631628501876799") {
                winnerId = databaseUsers[randomNumber];
                winnerTag = " <@" + databaseUsers[randomNumber] + ">,";
            } else {
                i--
            }
        }


        channel.messages.fetch(messageId)
            .then(msg => {
                msg.edit({
                    "embed": {
                        "title": "" + steamInfo.name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\n ENDED",
                        "url": "" + keys[0].link,
                        "color": 10761782,
                        "timestamp": "ends " + date,
                        "footer": {
                            "text": "Created by " + keys[0].username
                        },
                        "image": {
                            "url": "" + steamInfo.header_image
                        }
                    }
                })
            })

        channel.send("congrats " + winnerTag + " You won : " + steamInfo.name)
        sendKeyToWinner(keys, winnerId, steamInfo, date);
        if (dailyGiveaway){
            startDaily();
        }
    })
}


function sendKeyToWinner(keys, winnerId, steamInfo, date){
    const userPrivateChat = client.users.cache.find(userChat => userChat.id === winnerId);
    userPrivateChat.send({
        "embed": {
            "title": "GiveAway",
            "description": "Feedback is always welcome in  [#feedback](https://discord.gg/WFSV7e5) in Drop Zone. \n **Your key:** ```" + keys[0].key + " | " + steamInfo.name + "```\n Visit us too on [KeyLegends.com](https://www.keylegends.com/)",
            "color": 254714,
            "timestamp": "" + date,
            "footer": {
                "icon_url": "https://i.imgur.com/A4OSs19.jpg",
                "text": "SilentZ420"
            },
            "thumbnail": {
                "url": "https://i.imgur.com/TIDrbVI.png"
            }
        }
    })
}

function disableDailyCommand(message){
    if (config.creators.includes(parseInt(message.author.id))) {
        dailyGiveaway = false;
        message.channel.send("Daily giveaways has been disabled, Use &enableDaily to activate it back!")
    }
}

function enableDailyCommand(message){
    if (config.creators.includes(parseInt(message.author.id))) {
        dailyGiveaway = true;
        message.channel.send("Daily giveaways has been enabled, Use &disableDaily to disable it!")
    }
}

function stockDailyCommand(message){
    database.getDailyGames((err, keys) => {
        console.log(keys)
        message.channel.send("There is a total of " + keys.length + " in stock")
    })
}

module.exports = {
    addKeyDailyDatabase,
    startDailyCommand,
    disableDailyCommand,
    enableDailyCommand,
    stockDailyCommand
}

