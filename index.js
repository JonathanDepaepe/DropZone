const Discord = require('discord.js');
const client = new Discord.Client();
const {token} = require("./auth.json");
const {prefix} = require("./config.json")
const config = require("./config.json")
const authSolutions = require('./auth.js');
const guildInvites = new Map();
exports.client = client;
const database = require("./database/MySqlConnection")
const dailyGiveaway = require("./dailygiveaway")

client.once("ready", () => {
    console.log('Bot ready!');
    client.user.setActivity('Drop Zone | &help', {type: 'WATCHING'})
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);
    client.guilds.cache.forEach(guild => {
        guild.fetchInvites()
            .then(invites => guildInvites.set(guild.id, invites))
            .catch(err => console.log(err));
    });

});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (message.content.startsWith(`${prefix}sendKey`)) {
        sendGiveawayKey(message);
    }
    if (message.content.startsWith(`${prefix}addClaim`)) {
        addClaimKey(message);
    }

    if (message.content.startsWith(`${prefix}addDaily`)) {
        dailyGiveaway.addKeyDailyDatabase(message);
    }

    if (message.content.startsWith(`${prefix}keyDrop`)) {
        keyDropCommand(message);
    }

    if (message.content.startsWith(`${prefix}stockClaim`)) {
        stockClaimCommand(message);
    }

    if (message.content.startsWith(`${prefix}adminHelp`)) {
        adminHelpCommand(message);
    }

    if (message.content.startsWith(`${prefix}stockDaily`)) {
        dailyGiveaway.stockDailyCommand(message);
    }

    if (message.guild === null) return;
    levelMessage(message);
    if (!message.content.startsWith(prefix)) return;
    if (message.content.startsWith(`${prefix}steamgifts`)) {
        steamGiftsCommand(message);
    } else {
        processCommand(message)
    }
});


function processCommand(receivedMessage) {
    let fullCommand = receivedMessage.content.substr(1) // Remove the leading exclamation mark
    let splitCommand = fullCommand.split(" ") // Split the message up in to pieces for each space
    let primaryCommand = splitCommand[0] // The first word directly after the exclamation is the command
    let arguments = splitCommand.slice(1) // All other words are arguments/parameters/options for the command

    console.log("Command received: " + primaryCommand)
    console.log("Arguments: " + arguments) // There may not be any arguments

    if (primaryCommand == "help") {
        helpCommand(arguments, receivedMessage)
    } else if (primaryCommand == "voting") {
        voting(receivedMessage, arguments[0])
    } else if (primaryCommand == "giveaway") {
        giveAway(receivedMessage)
    } else if (primaryCommand == "keydrop") {
        keyDropCommand(receivedMessage)
    } else if (primaryCommand == "levelgiveaway") {
        levelGiveAway(receivedMessage)
    } else if (primaryCommand == "check") {
        checkCommand(receivedMessage)
    } else if (primaryCommand == "rank") {
        rankCommand(receivedMessage, arguments)
    } else if (primaryCommand == "claim") {
        claimCommand(receivedMessage)
    } else if (primaryCommand == "about") {
        aboutUsCommand(receivedMessage)
    } else if (primaryCommand == "banReward") {
        banRewardCommand(receivedMessage, arguments)
    } else if (primaryCommand == "giveawayPing") {
        giveawayPingCommand(receivedMessage, arguments)
    } else if (primaryCommand == "auth") {
        authCommand(receivedMessage, arguments)
    } else if (primaryCommand == "startDaily") {
        dailyGiveaway.startDailyCommand(receivedMessage)
    } else if (primaryCommand == "disableDaily") {
        dailyGiveaway.disableDailyCommand(receivedMessage)
    } else if (primaryCommand == "enableDaily") {
        dailyGiveaway.enableDailyCommand(receivedMessage)
    } else {
        receivedMessage.channel.send("I don't recognize the command. Try `&help` ")
    }
}


function helpCommand(arguments, receivedMessage) {
    receivedMessage.delete()
    receivedMessage.channel.send({

        "embed": {

            "description": "\n`&claim`\n Claim your game keys, check #rules for checken when you can\n\n`&rank`\n Check your level, how much xp you got and need\n\n`&giveaway`\n Create a giveaways, Only for members with role Giveaway creator. Ask an admin or creator for this rank!\n\n`&levelGiveaway`\n Create a level giveaways, Only for members with role Giveaway creator. Ask an admin or creator for this rank!\n\n More commands will be added soon...",
            "url": "https://discordapp.com",
            "color": 2385569,
            "timestamp": "2021-03-23T23:12:03.874Z",
            "footer": {

                "text": "" + receivedMessage.author.username
            },
            "thumbnail": {
                "url": "https://i.imgur.com/TIDrbVI.png"
            },

            "author": {
                "name": "Drop Zone Commands"
            }
        }
    })
}


function steamGiftsCommand(message) {
    const giveawayUserIdRequester = message.author.id;
    let giveawayItem;
    let itemLink;
    let pictureLink;


    const filterItemName = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            giveawayItem = response.content;
            return true;
        }
        return false;
    };

    const filterItemLink = (response) => {
        if (response.author.id === giveawayUserIdRequester && response.content.length > 2) {
            itemLink = response.content;
            return true;
        }
        return false;
    };

    const filterPictureLink = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log(response.content)
            if (response.content === "no") {
                pictureLink = 'https://i.imgur.com/TIDrbVI.png'
            } else {
                pictureLink = response.content.split(" ")[1];
            }
            return true;
        }
        return false;
    };


    message.channel.send(" let's set up your steamGifts giveaway! \nWhat will be the `name of the game?`").then(() => {
        message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("What will be the `SteamGifts url?`").then(() => {
                    message.channel.awaitMessages(filterItemLink, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("You want to add a picture of the game? \n`no` or `yes [URL]`").then(() => {
                                message.channel.awaitMessages(filterPictureLink, {
                                    max: 1,
                                    time: 120000,
                                    errors: ['time']
                                })
                                    .then(collected => {
                                        message.channel.send("Alright all set!");
                                        sendToSteamGiftsChannel(message, giveawayItem, itemLink, pictureLink);
                                    })
                                    .catch(collected => {
                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    });


}

function sendToSteamGiftsChannel(message, gameName, steamGiftsURL, pictureURL) {

    const steamGiftsChannel = message.guild.channels.cache.find(channel => channel.id === config.steamGifts);


    steamGiftsChannel.send({
        "embed": {
            "title": "***SteamGifts***",

            "description": "New GiveAway hosted by " + message.author.username + " on SteamGifts! \n Lets go all together in the commands and type DISCORD SQUAD!!",
            "color": 4385012,
            "footer": {
                "text": "Added by " + message.author.username
            },
            "thumbnail": {
                "url": "" + pictureURL
            },
            "fields": [
                {
                    "name": "Game:",
                    "value": "" + gameName,
                },
                {
                    "name": "Url:",
                    "value": "" + steamGiftsURL,
                }]
        }
    })
}

function voting(message, messageID) {
    let gameList = [];

    const filterItemName = (response) => {
        if (response.author.id === config.admin && response.content.length > 2) {
            gameList.push(response.content);
            return true;
        }
        return false;
    };

    message.channel.send("First game").then(() => {
        message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("URL:").then(() => {
                    message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("second game:").then(() => {
                                message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                                    .then(collected => {
                                        message.channel.send("URL:").then(() => {
                                            message.channel.awaitMessages(filterItemName, {
                                                max: 1,
                                                time: 120000,
                                                errors: ['time']
                                            })
                                                .then(collected => {
                                                    message.channel.send("third game").then(() => {
                                                        message.channel.awaitMessages(filterItemName, {
                                                            max: 1,
                                                            time: 120000,
                                                            errors: ['time']
                                                        })
                                                            .then(collected => {
                                                                message.channel.send("URL:").then(() => {
                                                                    message.channel.awaitMessages(filterItemName, {
                                                                        max: 1,
                                                                        time: 120000,
                                                                        errors: ['time']
                                                                    })
                                                                        .then(collected => {
                                                                            message.channel.send("Last game:").then(() => {
                                                                                message.channel.awaitMessages(filterItemName, {
                                                                                    max: 1,
                                                                                    time: 120000,
                                                                                    errors: ['time']
                                                                                })
                                                                                    .then(collected => {
                                                                                        message.channel.send("URL:").then(() => {
                                                                                            message.channel.awaitMessages(filterItemName, {
                                                                                                max: 1,
                                                                                                time: 120000,
                                                                                                errors: ['time']
                                                                                            })
                                                                                                .then(collected => {
                                                                                                    message.channel.send("Alright all set!");
                                                                                                    sendVoting(message, gameList, messageID);
                                                                                                })
                                                                                                .catch(collected => {
                                                                                                    message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                                                                });
                                                                                        });
                                                                                    })
                                                                                    .catch(collected => {
                                                                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                                                    });
                                                                            });
                                                                        })
                                                                        .catch(collected => {
                                                                            message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                                        });
                                                                });
                                                            })
                                                            .catch(collected => {
                                                                message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                            });
                                                    });
                                                })
                                                .catch(collected => {
                                                    message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                });
                                        });
                                    })
                                    .catch(collected => {
                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    });


}


function sendVoting(message, gameList, channelId) {

    let date;
    date = new Date(Date.now() + config.lengthOfDaysVoting * 24 * 3600 * 1000)


    const giveawayChannel = message.guild.channels.cache.find(channel => channel.id === channelId);

    giveawayChannel.send("@everyone\n", {
        "embed": {
            "title": "***Voting***",
            "timestamp": "" + date,
            "description": ":heart: [" + gameList[0] + "]" + "(" + gameList[1] + ")\n" +
                ":orange_heart: [" + gameList[2] + "]" + "(" + gameList[3] + ")\n" +
                ":green_heart: [" + gameList[4] + "]" + "(" + gameList[5] + ")\n" +
                ":yellow_heart: [" + gameList[6] + "]" + "(" + gameList[7] + ")",
            "color": 4385012,
            "footer": {
                "text": "voting ends"
            }
        }
    }).then(sentEmbed => {
        sentEmbed.react("❤️")
        sentEmbed.react("🧡")
        sentEmbed.react("💚")
        sentEmbed.react("💛")
        addVotingToDatabase(message, channelId, sentEmbed.id, gameList, date)

    })

}

function addVotingToDatabase(message, channelId, message_id, gameList, endDate) {
    database.addVoting(channelId, message_id, gameList[0], gameList[1], gameList[2], gameList[3], gameList[4], gameList[5], gameList[6], gameList[7], endDate).then(result => {
        waitingEndVoting(message, channelId, message_id, gameList, endDate)
    })
}


function getTheMessage(message, channelId, messageID, gameList, endDate) {
    const channelMessage = message.guild.channels.cache.find(channel => channel.id === channelId)
    channelMessage.messages.fetch(messageID).then(element => countVotes(channelMessage, messageID, gameList, endDate, element.reactions.cache.toJSON()))
}

function waitingEndVoting(message, channelId, messageID, gameList, endDate) {


    let x = setInterval(function () {
        let now = new Date().getTime();
        let t = endDate - now;
        if (t < 0) {
            clearInterval(x);
            getTheMessage(message, channelId, messageID, gameList, endDate)
        }


    }, 10000);
}

function countVotes(message, messageID, gameList, date, element) {
    const hearts = [":heart:", ":orange_heart:", ":green_heart:", ":yellow_heart:"]
    console.log(element)
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
                    "description": ":heart: [" + gameList[0] + "]" + "(" + gameList[1] + ")\n" +
                        ":orange_heart: [" + gameList[2] + "]" + "(" + gameList[3] + ")\n" +
                        ":green_heart: [" + gameList[4] + "]" + "(" + gameList[5] + ")\n" +
                        ":yellow_heart: [" + gameList[6] + "]" + "(" + gameList[7] + ")\n\n" +
                        "Won: " + hearts[highest[0]] + " " + gameList[highest[0] * 2],
                    "color": 4385012,
                    "footer": {
                        "text": "voting ends"
                    }
                }
            });
        });
}

function giveAway(message) {
    const giveawayUserIdRequester = message.author.id
    let channelId;
    let totalTime = [];
    let totalWinners;
    let giveawayName;


    const filterSetChannel = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("channel: " + response.content.slice(2, 20))
            channelId = response.content.slice(2, 20);
            return true;
        }
        return false;
    };
    const filterSetTime = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("time: " + response.content.slice(0, -1) + " " + response.content.slice(-1))
            totalTime.push(response.content.slice(0, -1))
            totalTime.push(response.content.slice(-1))
            return true;
        }
        return false;
    };

    const filterSetWinners = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("winners: " + response.content)
            totalWinners = response.content;
            return true;
        }
        return false;
    };
    const filterSetName = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("name giveaway: " + response.content)
            giveawayName = response.content;
            return true;
        }
        return false;
    };


    message.channel.send(" let's set up an giveaway! \n`Please type the name of a channel in this server.`").then(() => {
        message.channel.awaitMessages(filterSetChannel, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("What will be the `The total time of the giveaway`\nEnter a duration in `S,M,H,D`").then(() => {
                    message.channel.awaitMessages(filterSetTime, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("`Please enter a number of winners between 1 and 10.`").then(() => {
                                message.channel.awaitMessages(filterSetWinners, {
                                    max: 1,
                                    time: 120000,
                                    errors: ['time']
                                })
                                    .then(collected => {
                                        message.channel.send("Finally,`What do you want to giveaway` ?").then(() => {
                                            message.channel.awaitMessages(filterSetName, {
                                                max: 1,
                                                time: 120000,
                                                errors: ['time']
                                            })

                                                .then(collected => {
                                                    message.channel.send("Alright all set!");
                                                    startGiveaway(message, channelId, totalTime, totalWinners, giveawayName, false);
                                                })
                                                .catch(collected => {
                                                    message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                });
                                        });
                                    })
                                    .catch(collected => {
                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    });


}

function startGiveaway(message, channelId, totalTime, totalWinners, giveawayName, level, levelInt) {
    let deadline;
    if (totalTime[1].toLowerCase() === "d") {
        deadline = new Date(Date.now() + totalTime[0] * 24 * 3600 * 1000)
    } else if (totalTime[1].toLowerCase() === "h") {
        deadline = new Date(Date.now() + totalTime[0] * 3600 * 1000)

    } else if (totalTime[1].toLowerCase() === "m") {
        deadline = new Date(Date.now() + totalTime[0] * 60 * 1000)

    } else if (totalTime[1].toLowerCase() === "s") {
        deadline = new Date(Date.now() + totalTime[0] * 1000)
    }
    if (!level) {
        sendGiveaway(message, channelId, deadline, giveawayName, totalWinners);
    } else {
        sendLevelGiveaway(message, channelId, deadline, giveawayName, totalWinners, levelInt);

    }


}

function addToDatabase(message, message_id, channelId, deadline, giveawayName, totalWinners) {
    database.addGiveaway(channelId, totalWinners, giveawayName, deadline, message_id, 0, (err, result) => {
        updateGiveaway(message, result.insertId, message_id, channelId, giveawayName, totalWinners);
    });
}

function sendGiveaway(message, channelId, deadline, name, totalWinners) {
    const channelMessage = message.guild.channels.cache.find(channel => channel.id === channelId)

    let now = new Date().getTime();
    let t = deadline - now;
    let days = Math.floor(t / (1000 * 60 * 60 * 24));
    let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((t % (1000 * 60)) / 1000);


    channelMessage.send({
        "embed": {
            "title": "" + name,
            "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds",
            "color": 4385012,
            "footer": {
                "text": "Created by " + message.author.username
            }
        }
    }).then(sentEmbed => {
        addToDatabase(message, sentEmbed.id, channelId, deadline, name, totalWinners);
        sentEmbed.react("723120954468990996")
    })

}


function getUsers(msg, giveaway_id) {
    const filter = (reaction, user) => reaction.emoji.id === '723120954468990996'
    msg.awaitReactions(filter, {time: 15000})
        .then(collected => addUsersToDatabase(collected.toJSON(), giveaway_id))
        .catch(console.error);
}

function addUsersToDatabase(users, giveaway_id) {
    let databaseUsers = [];

    database.getUsersByGiveawayID(giveaway_id, (err, result) => {

        for (let enteredUsers of result) {
            if (!databaseUsers.includes(enteredUsers.userid)) {
                databaseUsers.push(enteredUsers.userid)
            }
        }

        if (!(users.length === 0))
            users = users[0].users
        for (let user of users) {
            if (!databaseUsers.includes(user)) {
                database.addUser(user, giveaway_id, (err, result) => {
                    console.log("person added:" + user + "in: " + giveaway_id)
                })
            }

        }
    })

}


function updateGiveaway(message, database_id, message_id, channel_id, name, totalWinners) {

    let deadline = null;
    database.getGiveawayById(database_id, (err, result) => {
        deadline = new Date(result[0].time)
        console.log("deadline: " + deadline)

        const giveawayChannel = message.guild.channels.cache.find(channel => channel.id === channel_id)

        let x = setInterval(function () {
            let now = new Date().getTime();
            let t = deadline - now;
            let days = Math.floor(t / (1000 * 60 * 60 * 24));
            let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
            let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
            let seconds = Math.floor((t % (1000 * 60)) / 1000);

            giveawayChannel.messages.fetch(message_id)
                .then(msg => {
                    msg.edit({
                        "embed": {
                            "title": "" + name,
                            "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds",
                            "color": 4385012,
                            "footer": {
                                "text": "Created by " + message.author.username + " total winners " + totalWinners
                            }
                        }
                    })
                })
            giveawayChannel.messages.fetch(message_id)
                .then(msg => getUsers(msg, database_id))
            if (t < 0) {
                clearInterval(x);
                endGiveaway(message, giveawayChannel, message_id, name, totalWinners, database_id)
            }

        }, 10000);
    });
}


function endGiveaway(message, giveawayChannel, message_id, name, totalWinners, giveaway_id) {
    let databaseUsers = [];
    let winners = "";
    let winnerNumbers = [];
    database.updateGiveawayToEnded(message_id);
    database.getUsersByGiveawayID(giveaway_id, (err, result) => {

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

function checkCommand(message) {
    database.getVoting((err, result) => {
        for (let voting of result) {
            let gameList = [];
            gameList.push(voting.gameName1)
            gameList.push(voting.url1)
            gameList.push(voting.gameName2)
            gameList.push(voting.url2)
            gameList.push(voting.gameName3)
            gameList.push(voting.url3)
            gameList.push(voting.gameName4)
            gameList.push(voting.url4)
            let date = new Date(voting.time)
            waitingEndVoting(message, voting.channel_id, voting.message_id, gameList, date)
        }
    });

    database.getLevelGiveaways((err, result) => {
        for (let giveaway of result) {
            updateLevelGiveaway(message, giveaway.id, giveaway.message_id, giveaway.channel, giveaway.name, giveaway.winners, giveaway.level)
        }
    });

    database.getGiveaways((err, result) => {
        for (let giveaway of result) {
            if (giveaway.ended !== 1) {
                updateGiveaway(message, giveaway.id, giveaway.message_id, giveaway.channel, giveaway.name, giveaway.winners)
            }

        }
    });
}

function levelMessage(message) {
    let user = [];
    let userExists = false;
    let content = message.content
    if (!content.includes("&rank") && !content.includes("&claim")) {
        database.getLevels((err, result) => {
            for (let enteredUsers of result) {
                if (message.author.id === enteredUsers.user_id) {
                    userExists = true;
                    user.push(enteredUsers.user_id)
                    user.push(enteredUsers.level)
                    user.push(enteredUsers.totalMessages)
                    user.push(enteredUsers.totalXp)
                    user.push(enteredUsers.lastMessage)
                    addLevels(user, message)

                }
            }
            if (!userExists) {
                let date = new Date()
                database.addLevelUser(message.author.id, date);
            }
        })
    }
}

function addLevels(user, message) {
    let lastMessage = new Date(user[4])
    let now = new Date().getTime();
    let t = lastMessage - now;
    let randomXP;
    let newTotalXp = user[3];
    let totalMessages = (parseInt(user[2]) + 1).toString()
    let level = user[1]
    let date = user[4]
    if (t < -60000) {
        if (config.doubleXP === true) {
            randomXP = (Math.floor(Math.random() * Math.floor(config.maxXP)) + 1) * 2;
        } else {
            randomXP = Math.floor(Math.random() * Math.floor(config.maxXP)) + 1;
        }

        newTotalXp = (parseInt(user[3]) + randomXP).toString()
        if (newTotalXp > calculatingLevel(parseInt(user[1]) + 1)) {
            level = (parseInt(level) + 1).toString()
            const levelChannel = message.guild.channels.cache.find(channel => channel.id === config.levelMessageChannel);
            levelChannel.send("<@" + user[0] + ">, You are now level " + level + "!")

        }
        checkLevel(user[0], level, message)
        date = new Date()
    }
    database.updateLevel(level, totalMessages, newTotalXp, date, user[0]);
}

function checkLevel(userId, level, message) {
    const bronze = message.guild.roles.cache.find(role => role.name === "Bronze")
    const silver = message.guild.roles.cache.find(role => role.name === "Silver")
    if (level === "5" && !message.member.roles.cache.find(r => r.name === "Bronze")) {
        message.member.roles.add(bronze)
    } else if (level === "10" && !message.member.roles.cache.find(r => r.name === "Silver")) {
        if (message.member.roles.cache.find(r => r.name === "Bronze")) {
            message.member.roles.remove(bronze)
        }
        message.member.roles.add(silver)
    }

}

function calculatingLevel(x) {
    let pow = Math.pow(2, (x - 1) / 7)
    let res = ((x - 1) * 300 * pow) / 4;
    return res;
}

function rankCommand(message) {
    let name;
    let userId;
    let argument = message.content.slice(6)
    let usedArgument = false;
    if (argument.length !== 0) {
        console.log('here1')
        usedArgument = true;
        if (argument.includes("<@")) {
            console.log('here12')
            userId = argument.slice(3, 21)
            name = message.mentions.users.first().username
        } else if (argument.includes("#")) {
            console.log('here13')
            let slitted = argument.split('#')
            let discordUser = client.users.cache.find(user => user.username === slitted[0])
            userId = discordUser.id
            name = discordUser.username
        } else if (typeof argument.slice(0, 17) === 'number') {
            userId = argument
            let discordUser = client.users.cache.find(user => user.id === userId)
            name = discordUser.username
            console.log('here')
        }

    } else {
        name = message.author.username
        userId = message.author.id
    }

    let date = new Date();
    let userExists = false;
    database.getLevels((err,result) => {
        for (let enteredUsers of result) {
            if (userId === enteredUsers.user_id) {
                userExists = true;
                let xpToGo = Math.round(calculatingLevel(parseInt(enteredUsers.level) + 1))
                message.channel.send({
                    "embed": {
                        "title": "" + name,
                        "timestamp": date,
                        "description": "Level " + enteredUsers.level + "\n " + enteredUsers.totalXp + " / " + xpToGo + " XP \n " + enteredUsers.totalMessages + " total messages",
                        "color": 4385012,
                        "footer": {
                            "text": "" + message.author.username
                        }
                    }
                })
            }
        }
        if (usedArgument && !userExists) {
            message.channel.send("<:DropZone:723120954468990996> Did not find the user. Use @tag, There user ID or like Silentz420#9436")
        } else if (!userExists) {
            message.channel.send("<:DropZone:723120954468990996> You aren't ranked yet. Send some messages first, then try again.")
        }

    })

}


function claimCommand(message) {
    let steamKey = ""
    let userId = message.author.id;
    let date = new Date();
    let winnerNumbers = [];
    let winnerGames = []
    let claimEnabled = false;

    if (claimEnabled) {

        database.getLevelUserByUserID(userId, (err, result) => {
            if (result[0] !== undefined) {
                if (config.claimLevels[result[0].claimed] <= result[0].level) {
                    database.getGames((err, result1) => {
                        if (result1.length >= 3) {
                            let newClaimedNumber = result[0].claimed + 1;
                            database.updateLevelUserClaimed(newClaimedNumber, userId)
                            for (let i = 0; i < 3; i++) {
                                let randomNumber = Math.floor(Math.random() * (result1.length));
                                if (!winnerNumbers.includes(randomNumber) && !winnerGames.includes(result1[randomNumber].gameName)) {
                                    winnerGames.push(result1[randomNumber].gameName)
                                    winnerNumbers.push(randomNumber);
                                } else {
                                    i--
                                }
                            }

                            for (let i = 0; i < 3; i++) {
                                steamKey += "\n" + result1[winnerNumbers[i]].gameName + " | " + result1[winnerNumbers[i]].gameKey;
                                database.updateGamesToClaimed(result1[winnerNumbers[i]].id);
                            }

                            message.author.send({
                                "embed": {
                                    "title": "Level Reward",
                                    "description": "Feedback is always welcome in  [#feedback](https://discord.gg/WFSV7e5) in Drop Zone. \n **Your keys:** ```" + steamKey + "```\n Visit us too on [KeyLegends.com](https://www.keylegends.com/)",
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
                        } else {
                            message.author.send("It looks like we are out of stock. Please contact **@Silentz420#9436**")
                        }
                    })
                } else if (config.claimInvites[result[0].claimedInvites] <= result[0].invites) {
                    database.getGames((err, result1) => {
                        if (result1.length >= 3) {
                            console.log(result1.length)

                            let newClaimedNumber = result[0].claimedInvites + 1;
                            database.updateLevelUserLevelClaimed(newClaimedNumber);
                            for (let i = 0; i < 3; i++) {
                                steamKey += "\n" + result1[i].gameName + " | " + result1[i].gameKey
                                database.updateGamesToClaimed(result1[winnerNumbers[i]].id);
                            }
                            console.log("user: " + message.author.id + " claimed " + steamKey)

                            message.author.send({
                                "embed": {
                                    "title": "Level Reward",
                                    "description": "Feedback is always welcome in  [#feedback](https://discord.gg/WFSV7e5) in Drop Zone. \n **Your keys:** ```" + steamKey + "```\n Visit us too on [KeyLegends.com](https://www.keylegends.com/)",
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
                        } else {
                            message.author.send("It looks like we are out of stock. Please contact **@Silentz420#9436**")
                        }
                    })

                } else {
                    message.author.send("You don't have any rewards. If this is false please contact **@Silentz420#9436**")
                }
                message.channel.send("<:DropZone:723120954468990996> A private message has been sent to you. <@" + userId + ">")
            } else {
                message.channel.send("<:DropZone:723120954468990996> A private message has been sent to you. <@" + userId + ">")
                message.author.send("You don't have any rewards. If this is false please contact **@Silentz420#9436**")
            }
        })
    } else {
        message.channel.send("Claims are temporarily disabled :pensive:")
    }
}

function sendGiveawayKey(message) {
    if (message.author.id === config.admin) {
        let splitCommand = message.content.split(" ")
        let userId = splitCommand[1]
        let key = splitCommand[2]
        let gameName = '';
        for (let i = 3; splitCommand.length > i; i++) {
            gameName += splitCommand[i] + ' '
        }
        let date = new Date()
        const userPrivateChat = client.users.cache.find(userChat => userChat.id === userId);
        userPrivateChat.send({
            "embed": {
                "title": "GiveAway",
                "description": "Feedback is always welcome in  [#feedback](https://discord.gg/WFSV7e5) in Drop Zone. \n **Your key:** ```" + key + " | " + gameName + "```\n Visit us too on [KeyLegends.com](https://www.keylegends.com/)",
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


}

function addClaimKey(message) {
    let splitCommand = message.content.split(" ");
    let gameName = '';
    let key = splitCommand[1];

    for (let i = 2; splitCommand.length > i; i++) {
        gameName += splitCommand[i] + ' '
    }
    database.addClaimKey(gameName, key);
    message.author.send('Key has been added to the database. Thanks for the submission!')
}


function banRewardCommand(message, argument) {
    if (message.author.id === "181799020207800323") {
        message.channel.send("" + argument[0] + " is now banned from claiming rewards")
    }
}

function aboutUsCommand(message) {
    if (message.author.id === "181799020207800323") {
        message.channel.send({

            "embed": {
                "title": "About Us",
                "description": "Here is some small information about our discord. Hope you know a little bit more about us :)",

                "color": 4120501,
                "footer": {
                    "icon_url": "https://i.imgur.com/TIDrbVI.png",
                    "text": "Drop Zone"
                },
                "thumbnail": {
                    "url": "https://i.imgur.com/TIDrbVI.png"
                },

                "fields": [

                    {
                        "name": "Wanne help us out ?",
                        "value": "- You can give keys away as well in our Discord (contact one of our admins) \n- Run giveaway on SteamGifts for our Steam Group only.\n- Invite your friends\n- Follow us on our social medias."
                    },
                    {
                        "name": "How are we gettings our keys?",
                        "value": "- We buy keys with out own money all around the web. \n- We get keys from donation or partnering"
                    },
                    {
                        "name": "Drop Zone Socials:",
                        "value": "[Steam Group](https://steamcommunity.com/groups/Dropzone420)\n[Our Website](https://www.keylegends.com/)",
                        "inline": true
                    },
                    {
                        "name": "SilentZ420 Socials:",
                        "value": "[Twitter](https://twitter.com/silentz420)\n[Steam](https://steamcommunity.com/id/silentz420)\n[Instagram](https://www.instagram.com/jonathan.depaepe/)\n[Twitch](https://www.twitch.tv/silentz420)",
                        "inline": true
                    }
                ]
            }
        })
    }
}

function levelGiveAway(message) {
    const giveawayUserIdRequester = message.author.id
    let giveawayLevel;
    let channelId;
    let totalTime = [];
    let totalWinners;
    let giveawayName;

    const filterSetChannel = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("channel: " + response.content.slice(2, 20))
            channelId = response.content.slice(2, 20);
            return true;
        }
        return false;
    };

    const filterSetTime = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("time: " + response.content.slice(0, -1) + " " + response.content.slice(-1))
            totalTime.push(response.content.slice(0, -1))
            totalTime.push(response.content.slice(-1))
            return true;
        }
        return false;
    };

    const filterSetWinners = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("winners: " + response.content)
            totalWinners = response.content;
            return true;
        }
        return false;
    };

    const filterSetName = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("name giveaway: " + response.content)
            giveawayName = response.content;
            return true;
        }
        return false;
    };

    const filterSetLevel = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("name giveaway: " + response.content)
            giveawayLevel = response.content;
            return true;
        }
        return false;
    };

    message.channel.send(" let's set up an giveaway! \n`Please type the name of a channel in this server.`").then(() => {
        message.channel.awaitMessages(filterSetChannel, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("What will be the `The total time of the giveaway`\nEnter a duration in `S,M,H,D`").then(() => {
                    message.channel.awaitMessages(filterSetTime, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("`Please enter a number of winners between 1 and 10.`").then(() => {
                                message.channel.awaitMessages(filterSetWinners, {
                                    max: 1,
                                    time: 120000,
                                    errors: ['time']
                                }).then(collected => {
                                    message.channel.send("`Please enter the level the member should be`").then(() => {
                                        message.channel.awaitMessages(filterSetLevel, {
                                            max: 1,
                                            time: 120000,
                                            errors: ['time']
                                        })
                                            .then(collected => {
                                                message.channel.send("Finally,`What do you want to giveaway` ?").then(() => {
                                                    message.channel.awaitMessages(filterSetName, {
                                                        max: 1,
                                                        time: 120000,
                                                        errors: ['time']
                                                    })

                                                        .then(collected => {
                                                            message.channel.send("Alright all set!");
                                                            startGiveaway(message, channelId, totalTime, totalWinners, giveawayName, true, giveawayLevel);
                                                        })
                                                        .catch(collected => {
                                                            message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                                        });
                                                });
                                            })
                                            .catch(collected => {
                                                message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                            });
                                    });
                                })
                                    .catch(collected => {
                                        message.channel.send("Uh! You took longer then 2 minutes to respond");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    });

}

function sendLevelGiveaway(message, channelId, deadline, name, totalWinners, level) {
    const channelMessage = message.guild.channels.cache.find(channel => channel.id === channelId)

    let now = new Date().getTime();
    let t = deadline - now;
    let days = Math.floor(t / (1000 * 60 * 60 * 24));
    let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((t % (1000 * 60)) / 1000);

    channelMessage.send({
        "embed": {
            "title": "" + name,
            "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds\n Only for level " + level + "+",
            "color": 4385012,
            "footer": {
                "text": "Created by " + message.author.username
            }
        }
    }).then(sentEmbed => {
        addLevelToDatabase(message, sentEmbed.id, channelId, deadline, name, totalWinners, level);
        sentEmbed.react("723120954468990996")

    })

}


function addLevelToDatabase(message, message_id, channelId, deadline, giveawayName, totalWinners, level) {

    database.addLevelGiveaway(channelId, totalWinners, giveawayName, deadline, message_id, level, (err, result) => {
        let database_id = result.insertId
        updateLevelGiveaway(message, database_id, message_id, channelId, giveawayName, totalWinners, level)
    });
}

function updateLevelGiveaway(message, database_id, message_id, channel_id, name, totalWinners, level) {
    let deadline = null;
    database.getLevelGiveawaysByID(database_id, (err, result) => {
        deadline = new Date(result[0].time)
        console.log("deadline: " + deadline)
    });

    const giveawayChannel = message.guild.channels.cache.find(channel => channel.id === channel_id)

    let x = setInterval(function () {
        let now = new Date().getTime();
        let t = deadline - now;
        let days = Math.floor(t / (1000 * 60 * 60 * 24));
        let hours = Math.floor((t % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((t % (1000 * 60)) / 1000);

        giveawayChannel.messages.fetch(message_id)
            .then(msg => {
                msg.edit({
                    "embed": {
                        "title": "" + name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days " + hours + " hours " + minutes + " minutes " + seconds + " seconds\n ***__Only for level " + level + "+__***",
                        "color": 4385012,
                        "footer": {
                            "text": "Created by " + message.author.username + " total winners " + totalWinners
                        }
                    }
                })
            })

        giveawayChannel.messages.fetch(message_id)
            .then(msg => getLevelUsers(msg, database_id, level))
        if (t < 0) {
            clearInterval(x);
            endLevelGiveaway(message, giveawayChannel, message_id, name, totalWinners, database_id, level)
        }

    }, 10000);

}

function endLevelGiveaway(message, giveawayChannel, message_id, name, totalWinners, giveaway_id, level) {
    let databaseUsers = [];
    let winners = "";
    let winnerNumbers = [];

    database.updateLevelGiveawayToEnded(message_id);
    database.getLevelGiveawaysByID(giveaway_id, (err, result)=> {

        for (let enteredUsers of result) {
            if (!databaseUsers.includes(enteredUsers.userid)) {
                databaseUsers.push(enteredUsers.userid)
            }
        }

        for (let i = 0; i < totalWinners; i++) {
            let randomNumber = Math.floor(Math.random() * (databaseUsers.length));
            if (!winnerNumbers.includes(randomNumber) && databaseUsers[randomNumber] !== "720631628501876799") {
                winnerNumbers.push(randomNumber);
                winners += " <@" + databaseUsers[randomNumber] + ">,"
            } else {
                i--
            }
            console.log(databaseUsers)
            console.log(databaseUsers.length)
        }

        giveawayChannel.messages.fetch(message_id)
            .then(msg => {
                msg.edit({
                    "embed": {
                        "title": "" + name,
                        "description": "React with <:DropZone:723120954468990996> to enter!\nWas only for level " + level + "+\n ENDED",
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


function getLevelUsers(msg, giveaway_id, level) {
    const filter = (reaction, user) => reaction.emoji.id === '723120954468990996'
    msg.awaitReactions(filter, {time: 15000})
        .then(collected => addLevelUsersToDatabase(collected.toJSON(), giveaway_id, level, msg))
        .catch(console.error);
}

function addLevelUsersToDatabase(users, giveaway_id, level, message) {
    let databaseUsers = [];

    database.getLevelUserByID(giveaway_id, (err, result) => {
        for (let enteredUsers of result) {
            if (!databaseUsers.includes(enteredUsers.userid)) {
                databaseUsers.push(enteredUsers.userid)
            }
        }

        if (!(users.length === 0))
            users = users[0].users;
        for (let user of users) {
            if (!databaseUsers.includes(user)) {
                database.getLevelUserByUserID(user, (err, result) => {
                    if (result.length !== 0 && parseInt(result[0].level) >= level) {
                        database.addGiveawayLevelUser(user, giveaway_id);
                    } else if (user !== "720631628501876799") {
                        message.reactions.resolve('723120954468990996').users.remove(user);
                    }

                })

            }

        }
    })


}


function giveawayPingCommand(message, argument) {
    if (message.author.id === config.admin) {
        message.channel.send({
            "embed": {
                "title": "Giveaway Ping",
                "description": "React with <:DropZone:723120954468990996> to receive giveaway pings!",
                "color": 4385012,
                "footer": {
                    "text": "Giveaway Ping for <#770969865015263232>"
                }
            }
        }).then(sentEmbed => {
            sentEmbed.react("723120954468990996")
        })
    }
}


/*TODO De aantal "totalkeys", line 1526 shift enter a new key
*/
function keyDropCommand(message, argument) {
    let totalKeys;
    let keys = [];
    let authentication = true;
    let channelId;
    let keyListMessage = "";
    let keyConfirmed = true;

    const filterSetChannel = (response) => {
        if (response.author.id === message.author.id) {
            channelId = response.content
            return true;
        }
        return false;
    };

    const filterKeys = (response) => {
        if (response.author.id === message.author.id) {
            let lines = response.content.split("\n")
            for (let i = 0; lines.length > i; i++) {
                let splitCommand = lines[i].split(" ")
                let gameName = '';
                for (let i = 1; splitCommand.length > i; i++) {
                    gameName += splitCommand[i] + ' '
                }
                keyListMessage += "`key: " + splitCommand[0] + " Game Name: " + gameName + "`\n"
                keys.push(splitCommand[0])
                keys.push(gameName)
            }
            return true;
        }
        return false;
    };

    const filterAuth = (response) => {
        if (response.author.id === message.author.id) {
            if (response.content === "no" || response.content === "n") {
                authentication = false
            }

            return true;

        }
        return false;
    };


    const filterKeyConfirmed = (response) => {
        if (response.author.id === message.author.id) {
            if (response.content === "no" || response.content === "n") {
                message.channel.send("Please redo the command and try to find out what went wrong, If you dont find any errors on your side contact SilentZ! ")
                keyConfirmed = false;
                return true;
            }
            return true;
        }
        return false;
    };

    message.channel.send(" let's set up an Key drops! \n`Please response with the channel id`").then(() => {
        message.channel.awaitMessages(filterSetChannel, {max: 1, time: 120000, errors: ['time']})
            .then(collected => {
                message.channel.send("Do you want authentication when they claim. \n`Please response (y)es or (n)o`").then(() => {
                    message.channel.awaitMessages(filterAuth, {max: 1, time: 120000, errors: ['time']})
                        .then(collected => {
                            message.channel.send("Please enter all the keys that you want to giveaway! \n By typing it like this: \n`1111-1111-1111-1111 Fallout 4\n2222-2222-2222-2222 Rainbow Six Siege`\n \n the key has to be completely attached to each other!").then(() => {
                                message.channel.awaitMessages(filterKeys, {
                                    max: 1,
                                    time: 120000,
                                    errors: ['time']
                                }).then(collected => {
                                    message.channel.send("Is the key list right ?. \n`Please response (y)es or (n)o`\n" + keyListMessage).then(() => {
                                        message.channel.awaitMessages(filterKeyConfirmed, {
                                            max: 1,
                                            time: 120000,
                                            errors: ['time']
                                        })

                                            .then(collected => {
                                                message.channel.send("Alright all set!");
                                                startKeyDrop(message, channelId, totalKeys, keys, authentication, keyConfirmed);
                                            })
                                            .catch(collected => {
                                                message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                            });

                                    });
                                })
                                    .catch(collected => {
                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond");
            });
    })
}

function startKeyDrop(message, channelId, keys, auth, keyConfirmed) {
    let date = new Date()
    if (keyConfirmed) {
        const channelMessage = client.channels.cache.find(channel => channel.id === channelId)
        channelMessage.send({
                "content": "<:DropZone:723120954468990996> :tada:  **KEY DROP !!** :tada: <:DropZone:723120954468990996>",
                "embed": {
                    "description": "React with <:DropZone:723120954468990996> and follow the instruction in private messages !\n Auth: Enabled\n Keys Claimed: 0/5",
                    "color": 4385012,
                    "timestamp": "" + date,
                    "footer": {
                        "icon_url": "" + message.author.avatarURL(),
                        "text": "Created by " + message.author.username
                    }
                }
            }
        ).then(sentEmbed => {
            sentEmbed.react("723120954468990996")
            sendMessage(channelMessage, sentEmbed.id)
        })
    }
}

function sendMessage(channel, message_id) {
    console.log("here")
    let x = setInterval(function () {
        channel.messages.fetch(message_id).then(msg => function () {
            console.log('herhere')
            const filter = (reaction, user) => reaction.emoji.id === '723120954468990996'
            msg.awaitReactions(filter, {time: 15000})
                .then(collect => function () {
                    console.log(collect)
                })
                .catch(console.error);
        })

        if (message_id === false) {
            clearInterval(x);
            console.log("herenot")
        }

    }, 1000);
}


function authCommand(message, argument) {
    const randomNumber = (Math.floor(Math.random() * 1500) + 1).toString();
    const solution = authSolutions[randomNumber - 1];
    let answer;

    const filterItemName = (response) => {
        if (response.author.id === config.admin && response.content.length > 2) {
            answer = response.content;
            return true;
        }
        return false;
    };

    message.channel.send('Type the auth as fast as you can', {files: ["auth/" + randomNumber + ".jpeg"]})
        .then(() => {
            message.channel.awaitMessages(filterItemName, {
                max: 1,
                time: 30000,
                errors: ['time']
            })
                .then(collected => {
                    console.log(solution)
                    console.log(answer)
                    if (solution === answer) {
                        message.channel.send("Great! Do &claim to see what you have won! <:DropZone:723120954468990996>");

                    } else {
                        message.channel.send("Nooooo, What happened? Better luck next time. If the answer was right let us know!")
                    }
                })
                .catch(collected => {
                    message.channel.send("Uh! You took longer then 30 seconds to respond <:7686_pepecross:723871890015256596>");
                });
        });
}

function stockClaimCommand(message) {
    database.getClaimKeys((err, keys) => {
        console.log(keys)
        message.channel.send("There is a total of " + keys.length + " in stock")
    })

}

function adminHelpCommand(message) {
    let date = new Date();
    message.channel.send({
        "embed": {
            "description": "\n`&sendKey`\n Send a key to a user with the bot overlay, `&sendKey DiscordUserID SteamKey Steam name`\n\n`&addClaim`\n Add a claim key to the bots database `&addClaim SteamKey Steam Name`\n\n`&stockClaim`\n Check The stock of the claims\n\n`&addDaily`\n Add a daily key to the bots database by following the instructions\n\n`&stockDaily`\n Check The stock of the daily giveaways\n\n`&keyDrop`\n Follow the instructions and start a key drop! \n\n More commands will be added soon...",
            "color": 2385569,
            "timestamp": "" + date,
            "footer": {

                "text": "" + message.author.username
            },
            "thumbnail": {
                "url": "https://i.imgur.com/TIDrbVI.png"
            },

            "author": {
                "name": "Drop Zone Commands"
            }
        }
    })

}


client.login(token);



