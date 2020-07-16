const Discord = require('discord.js');
const client = new Discord.Client();
const {token} = require("./auth.json");
const {prefix} = require("./config.json")
const ytdl = require("ytdl-core");
const config = require("./config.json")
let gameList = [];
const mysql = require('mysql')

const queue = new Map();


let con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    port: "3306",
    database: "discord",
    connectionLimit: 10
})


con.connect(function (err) {
    if (err) throw err;
    console.log("Database connected!");
});


client.once("ready", () => {
    console.log('Bot ready!');
    client.user.setActivity('Keylegends.com | &help', {type: 'PLAYING'})
        .then(presence => console.log(`Activity set to ${presence.activities[0].name}`))
        .catch(console.error);

});

client.once("reconnecting", () => {
    console.log("Reconnecting!");
});

client.once("disconnect", () => {
    console.log("Disconnect!");
});

client.on("message", async message => {
    if (message.author.bot) return;
    if (message.guild === null) return;
    levelMessage(message);
    if (!message.content.startsWith(prefix)) return;

    const serverQueue = queue.get(message.guild.id);

    if (message.content.startsWith(`${prefix}play`)) {
        execute(message, serverQueue);
    } else if (message.content.startsWith(`${prefix}skip`)) {
        skip(message, serverQueue);
    } else if (message.content.startsWith(`${prefix}stop`)) {
        stop(message, serverQueue);
    } else if (message.content.startsWith(`${prefix}steamgifts`)) {
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
    }
    if (primaryCommand == "voting") {
        voting(receivedMessage, arguments[0])
    } else if (primaryCommand == "endvoting") {
        endVoteCommand(receivedMessage, arguments)
    } else if (primaryCommand == "giveaway") {
        giveAway(receivedMessage)
    } else if (primaryCommand == "check") {
        checkCommand(receivedMessage)
    } else if (primaryCommand == "rank") {
        rankCommand(receivedMessage)
    } else if (primaryCommand == "claim") {
        claimCommand(receivedMessage)
    } else {
        receivedMessage.channel.send("I don't recognize the command. Try `&help` ")
    }
}


async function execute(message, serverQueue) {
    message.delete()
    const args = message.content.split(" ");

    const voiceChannel = message.member.voice.channel;
    if (!voiceChannel)
        return message.channel.send(
            "You need to be in a voice channel to play music!"
        );
    const permissions = voiceChannel.permissionsFor(message.client.user);
    if (!permissions.has("CONNECT") || !permissions.has("SPEAK")) {
        return message.channel.send(
            "I need the permissions to join and speak in your voice channel!"
        );
    }

    const songInfo = await ytdl.getInfo(args[1]);
    const songId = await ytdl.getVideoID(args[1]);
    const song = {
        title: songInfo.title,
        url: songInfo.video_url,
        thumbnail: songId,
        requested: message.author.username
    };

    if (!serverQueue) {
        const queueContruct = {
            textChannel: message.channel,
            voiceChannel: voiceChannel,
            connection: null,
            songs: [],
            volume: 5,
            playing: true
        };

        queue.set(message.guild.id, queueContruct);

        queueContruct.songs.push(song);

        try {
            var connection = await voiceChannel.join();
            queueContruct.connection = connection;
            play(message.guild, queueContruct.songs[0]);
        } catch (err) {
            console.log(err);
            queue.delete(message.guild.id);
            return message.channel.send(err);
        }
    } else {
        serverQueue.songs.push(song);
        return message.channel.send(`Added to queue: **${song.title}**`);
    }
}

function skip(message, serverQueue) {
    message.delete()
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    if (!serverQueue)
        return message.channel.send("There is no song that I could skip!");
    serverQueue.connection.dispatcher.end();
    return message.channel.send(`Skipped by: **${message.member}**`);
}

function stop(message, serverQueue) {
    message.delete()
    if (!message.member.voice.channel)
        return message.channel.send(
            "You have to be in a voice channel to stop the music!"
        );
    serverQueue.songs = [];
    serverQueue.connection.dispatcher.end();
}

function play(guild, song) {
    const serverQueue = queue.get(guild.id);
    if (!song) {
        serverQueue.voiceChannel.leave();
        queue.delete(guild.id);
        return;
    }

    const dispatcher = serverQueue.connection
        .play(ytdl(song.url))
        .on("finish", () => {
            serverQueue.songs.shift();
            play(guild, serverQueue.songs[0]);
        })
        .on("error", error => console.error(error));
    dispatcher.setVolumeLogarithmic(serverQueue.volume / 5);
    serverQueue.textChannel.send({
        "embed": {
            "title": "**Now Playing**",
            "description": "[" + song.title + "]" + "(" + song.url + ")",
            "color": 4385012,
            "footer": {
                "text": "Requested by " + song.requested
            },
            "thumbnail": {
                "url": "https://img.youtube.com/vi/" + song.thumbnail + "/maxresdefault.jpg"
            }
        }
    });

}

function helpCommand(arguments, receivedMessage) {
    receivedMessage.delete()
    let botembed = new Discord.MessageEmbed()

        .setDescription("Commands")
        .setColor("#42e8f4")
        .addField("Music", "&play, &skip, &stop")
        .setFooter("requested by " + receivedMessage.author.username)
        .setTimestamp();

    receivedMessage.channel.send(botembed)
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

function sendVoting(message, gameList, messageID) {

    const giveawayChannel = message.guild.channels.cache.find(channel => channel.id === messageID);


    giveawayChannel.send("@everyone\n", {
        "embed": {
            "title": "***Voting***",

            "description": ":heart: [" + gameList[0] + "]" + "(" + gameList[1] + ")\n" +
                ":orange_heart: [" + gameList[2] + "]" + "(" + gameList[3] + ")\n" +
                ":green_heart: [" + gameList[4] + "]" + "(" + gameList[5] + ")\n" +
                ":yellow_heart: [" + gameList[6] + "]" + "(" + gameList[7] + ")",
            "color": 4385012,
            "footer": {
                "text": "Voting added by " + message.author.username
            }
        }
    }).then(sentEmbed => {
        sentEmbed.react("❤️")
        sentEmbed.react("🧡")
        sentEmbed.react("💚")
        sentEmbed.react("💛")
    })

}

function voting(message, messageID) {
    gameList = [];

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

function endVoteCommand(message, messageID) {
    console.log("endvoting")

    console.log(messageID[0])
    console.log(messageID[1])
    const channelMessage = message.guild.channels.cache.find(channel => channel.id === messageID[0])
    console.log(channelMessage)

    channelMessage.messages.fetch(messageID[1]).then(element => countVotes(channelMessage, element.reactions.cache.toJSON(), messageID[1], message))
}

function countVotes(message, element, messageID, messageOwner) {
    const hearts = [":heart:", ":orange_heart:", ":green_heart:", ":yellow_heart:"]
    console.log(element)
    let highest = [0, 0]
    for (let i = 0; i < element.length; i++) {
        if (element[i].count > highest[1]) {
            highest[0] = i;
            highest[1] = element[i].count
        }

    }
    message.messages.fetch(messageID)
        .then(msg => {
            msg.edit({
                "embed": {
                    "title": "***Voting Ended***",

                    "description": ":heart: [" + gameList[0] + "]" + "(" + gameList[1] + ")\n" +
                        ":orange_heart: [" + gameList[2] + "]" + "(" + gameList[3] + ")\n" +
                        ":green_heart: [" + gameList[4] + "]" + "(" + gameList[5] + ")\n" +
                        ":yellow_heart: [" + gameList[6] + "]" + "(" + gameList[7] + ")\n\n" +
                        "Won: " + hearts[highest[0]] + " " + gameList[highest[0] * 2],
                    "color": 4385012,
                    "footer": {
                        "text": "Added by " + messageOwner.author.username
                    }
                }
            });
        });

    messageOwner.channel.send("Alright all set!")
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
                                                    startGiveaway(message, channelId, totalTime, totalWinners, giveawayName);
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

function startGiveaway(message, channelId, totalTime, totalWinners, giveawayName) {
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
    sendGiveaway(message, channelId, deadline, giveawayName, totalWinners);

}

function addToDatabase(message, message_id, channelId, deadline, giveawayName, totalWinners) { //will be used later
    let sql = "INSERT INTO giveaways (channel, winners, name, time, message_id, ended) VALUES ('" + channelId + "', '" + totalWinners + "', '" + giveawayName + "', '" + deadline + "', '" + message_id + "', '" + 0 + "')";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log("GiveAway id Added:" + result.insertId);
        updateGiveaway(message, result.insertId, message_id, channelId, giveawayName, totalWinners)
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

    con.query("SELECT * FROM users WHERE giveaway_id = " + giveaway_id, function (err, result) {
        if (err) throw console.error(err);

        for (let enteredUsers of result) {
            if (!databaseUsers.includes(enteredUsers.userid)) {
                databaseUsers.push(enteredUsers.userid)
            }
        }

        if (!(users.length === 0))
            users = users[0].users
        for (let user of users) {
            if (!databaseUsers.includes(user)) {
                let sql = "INSERT INTO users (userid, giveaway_id) VALUES ('" + user + "', '" + giveaway_id + "')";
                con.query(sql, function (err, result) {
                    if (err) throw err;
                    console.log("person added:" + user + "in: " + giveaway_id)
                })


            }

        }
    })

}


function updateGiveaway(message, database_id, message_id, channel_id, name, totalWinners) {


    let deadline = null;
    con.query("SELECT * FROM giveaways WHERE id = " + database_id, function (err, result) {
        if (err) throw err;
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

function checkCommand(message) {
    con.query("SELECT * FROM giveaways", function (err, result, fields) {
        if (err) throw err;

        for (let giveaway of result) {
            if (giveaway.ended !== 1) {
                console.log("giveaway id:" + giveaway.id)
                console.log("message id:" + giveaway.message_id)
                console.log("channel id:" + giveaway.channel)
                console.log("giveaway name:" + giveaway.name)
                console.log("total winners:" + giveaway.winners)

                updateGiveaway(message, giveaway.id, giveaway.message_id, giveaway.channel, giveaway.name, giveaway.winners)

            }

        }
    });
}

function levelMessage(message) {
    let user = [];
    let userExists = false;
    con.query("SELECT * FROM levels", function (err, result) {
        if (err) throw console.error(err);

        for (let enteredUsers of result) {
            if (message.author.id === enteredUsers.user_id) {
                userExists = true;
                user.push(enteredUsers.user_id)
                user.push(enteredUsers.level)
                user.push(enteredUsers.totalMessages)
                user.push(enteredUsers.totalXp)
                user.push(enteredUsers.lastMessage)
                addLevels(user)

            }
        }
        if (!userExists) {
            addNewLevelUser(message.author.id);
        }
    })

}

function addLevels(user) {
    let lastMessage = new Date(user[4])
    let now = new Date().getTime();
    let t = lastMessage - now;
    let randomXP;
    let newTotalXp = user[3];
    let totalMessages = (parseInt(user[2]) + 1).toString()
    let level = user[1]
    let date = user[4]
    if (t < -60000) {
        randomXP = Math.floor(Math.random() * Math.floor(config.maxXP)) + 1;
        newTotalXp = (parseInt(user[3]) + randomXP).toString()
        if (newTotalXp > calculatingLevel(parseInt(user[1]) + 1)) {
            level = (parseInt(level) + 1).toString()
        }
        date = new Date()
    }
    con.query("UPDATE levels SET level = " + level + ", totalMessages = " + totalMessages + ", totalXp = " + newTotalXp + ", lastMessage = '" + date + "'  WHERE user_id = " + user[0], function (err, result) {
        if (err) throw err;

    });
}

function calculatingLevel(x) {
    let pow = Math.pow(2, (x - 1) / 7)
    let res = ((x - 1) * 300 * pow) / 4;
    return res;
}

function addNewLevelUser(userId) {
    let date = new Date()
    let sql = "INSERT INTO levels (user_id, level, totalMessages, totalXp, lastMessage) VALUES ('" + userId + "', '" + "1" + "', '" + "1" + "', '" + "2" + "', '" + date + "')";
    con.query(sql, function (err, result) {
        if (err) throw err;
    })

}

function rankCommand(message) {
    let user = [];
    let name;
    let userExists = false;
    con.query("SELECT * FROM levels", function (err, result) {
        if (err) throw console.error(err);

        for (let enteredUsers of result) {
            if (message.author.id === enteredUsers.user_id) {
                userExists = true;
                name = message.author.username
                let xpToGo = Math.round(calculatingLevel(parseInt(enteredUsers.level) + 1))
                message.channel.send({
                    "embed": {
                        "title": "" + name,
                        "description": "Level " + enteredUsers.level + "\n " + enteredUsers.totalXp + " / " + xpToGo + " XP \n " + enteredUsers.totalMessages + " total messages",
                        "color": 4385012,
                        "footer": {
                            "text": "rank for " + message.author.username
                        }
                    }
                })
            }
        }
        if (!userExists) {
            message.channel.send("<:DropZone:723120954468990996> You aren't ranked yet. Send some messages first, then try again.")
        }

    })

}


function claimCommand(message) {
    let steamKey = ""
    let userId = message.author.id
    let date = new Date();
    con.query("SELECT * FROM levels WHERE user_id = " + userId, function (err, result) {
        if (err) throw console.error(err);
        if (config.claimLevels[result[0].claimed] <= result[0].level) {
            con.query("SELECT * FROM games WHERE claimed = 0", function (err, result1) {
                if (err) throw console.error(err);
                if (result1.length >= 3) {

                    let newClaimedNumber = result[0].claimed + 1;
                    con.query("UPDATE levels SET claimed = " + newClaimedNumber + " WHERE user_id = " + userId, function (err, result) {
                        if (err) throw err;

                    });

                    for (let i = 0; i < 3; i++) {
                        steamKey += "\n" + result1[i].gameName + " | " + result1[i].gameKey
                        con.query("UPDATE games SET claimed = 1 WHERE id = " + result1[i].id, function (err, result) {
                            if (err) throw err;

                        });
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
                    message.author.send("It looks like we are out of stuck. Please contact ```@Silentz420#9436```")
                }
            })
        }
    })
}

client.login(token);



