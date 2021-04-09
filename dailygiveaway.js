const config = require("./config.json");
const Discord = require('discord.js');
const database = require("./database/MySqlConnection")
const fetch = require("node-fetch");
const SteamAPI = require('steamapi');
const steam = new SteamAPI('75BD7BC81C6A6AC657375A9517353A8F');
const clientExport = require("./index.js")
const client = clientExport.client

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


function startDaily(){
    database.getDailyGames((err, keys) => {
        if (keys.length > 0){
            let steamAppId = keys[0].link.split("/")
            console.log(steamAppId[4])
            steam.getGameDetails(steamAppId[4]).then(result => {
                const dailyChannel = client.channels.cache.find(channel => channel.id === config.dailyGiveawayChannel);
                let date = new Date;
                console.log(result)
                dailyChannel.send({
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
                    update(message, sentEmbed.id, channelId, deadline, name, totalWinners);
                    sentEmbed.react("723120954468990996")
                })
            })
        }
    })

}


function updateDaily(date, channel, keys, steamInfo, messageId){

    let x = setInterval(function () {
        let now = new Date().getTime();
        let t = date - now;
        let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((t % (1000 * 60)) / 1000);

        channel.messages.fetch(messageId)
            .then(msg => {
                msg.edit({
                    "embed": {
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
            .then(msg => getDailyUsers(msg, keys))
        if (t < 0) {
            clearInterval(x);
            endGiveaway(message, giveawayChannel, message_id, name, totalWinners, database_id)
        }

    }, 10000);

}

function getDailyUsers(msg, keys) {
    const filter = (reaction, user) => reaction.emoji.id === '723120954468990996'
    msg.awaitReactions(filter, {time: 15000})
        .then(collected => addUsersToDatabase(collected.toJSON(), keys))
        .catch(console.error);
}

function addUsersToDatabase(users, keys) {
    let databaseUsers = [];

    database.getDailyUsers(keys[0].id,(err, users) => {
        if (err) throw console.error(err);

        for (let enteredUsers of users) {
            if (!databaseUsers.includes(enteredUsers.userID)) {
                databaseUsers.push(enteredUsers.userID)
            }
        }
        if (!(users.length === 0))
            users = users[0].users
        for (let user of users) {
            if (!databaseUsers.includes(user)) {
                database.addUserDaily(keys[0].id, user);
            }

        }
    })
}


function endGiveaway(message, giveawayChannel, message_id, name, totalWinners, giveaway_id) {
    let databaseUsers = [];
    let winners = "";
    let winnerNumbers = [];

    con.query("UPDATE giveaways SET ended = 1 WHERE message_id = " + message_id, function (err, result) {
        if (err) throw err;

    });

    con.query("SELECT * FROM users WHERE giveaway_id = " + giveaway_id, function (err, result) {
        if (err) throw console.error(err);

        for (let enteredUsers of result) {
            if (!databaseUsers.includes(enteredUsers.userid)) {
                databaseUsers.push(enteredUsers.userid)
            }
        }


        for (let i = 0; i < totalWinners; i++) {
            let randomNumber = Math.floor(Math.random() * (databaseUsers.length - 2 + 1)) + 1;
            if (!winnerNumbers.includes(randomNumber) && databaseUsers[randomNumber] !== "720631628501876799") {
                winnerNumbers.push(randomNumber)
                winners += " <@" + databaseUsers[randomNumber] + ">,"
            } else {
                i--
            }
        }


        giveawayChannel.messages.fetch(message_id)
            .then(msg => {
                msg.edit({
                    "embed": {
                        "title": "" + name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\n ENDED",
                        "color": 4385012,
                        "footer": {
                            "text": "Created by " + message.author.username
                        }
                    }
                })
            })

        giveawayChannel.send("congrats " + winners + " You won : " + name)
        console.log("giveaways had ended id: " + giveaway_id)
    })
}




module.exports = {
    addKeyDailyDatabase,
    startDailyCommand
}

