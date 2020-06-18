const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require("./auth.json");
const { prefix } = require("./config.json")
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


    con.connect(function(err) {
        if (err) throw err;
        console.log("Database connected!");
    });


client.once("ready", () => {
    console.log('Bot ready!');
    client.user.setActivity('Keylegends.com | &help', { type: 'PLAYING' })
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
    }
    else if(primaryCommand == "endvoting") {
        endVoteCommand(receivedMessage, arguments)
    }
    else if(primaryCommand == "giveaway") {
        giveAway(receivedMessage)
    }

    else {
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
    serverQueue.textChannel.send({"embed": {
            "title": "**Now Playing**",
            "description": "["+song.title+"]"+"("+song.url+")",
            "color": 4385012,
            "footer": {
                "text": "Requested by "+ song.requested
            },
            "thumbnail": {
                "url": "https://img.youtube.com/vi/"+song.thumbnail+"/maxresdefault.jpg"
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
        .setFooter("requested by "+ receivedMessage.author.username)
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
            if (response.author.id === giveawayUserIdRequester && response.content.length > 2 ) {
                itemLink = response.content;
                return true;
            }
            return false;
        };

    const filterPictureLink = (response) => {
                if (response.author.id === giveawayUserIdRequester) {
                    console.log(response.content)
                    if (response.content === "no"){
                        pictureLink =  'https://i.imgur.com/TIDrbVI.png'
                    }else{
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

    const steamGiftsChannel = message.guild.channels.cache.find(channel =>  channel.id === config.steamGifts);


    steamGiftsChannel.send({"embed": {
            "title": "***SteamGifts***",

            "description": "New GiveAway hosted by " + message.author.username + " on SteamGifts! \n Lets go all together in the commands and type DISCORD SQUAD!!",
            "color": 4385012,
            "footer": {
                "text": "Added by "+ message.author.username
            },
            "thumbnail": {
                "url": "" + pictureURL
            },
            "fields":[
                {
                    "name": "Game:",
                    "value" : "" + gameName,
                },
                {
                    "name": "Url:",
                    "value" : "" + steamGiftsURL,
                }]
        }})
}

function sendVoting(message, gameList, messageID){

    const giveawayChannel = message.guild.channels.cache.find(channel =>  channel.id === messageID);



        giveawayChannel.send("@everyone\n", {"embed": {
            "title": "***Voting***",

            "description": ":heart: ["+gameList[0]+"]"+"("+gameList[1]+")\n" +
                ":orange_heart: ["+gameList[2]+"]"+"("+gameList[3]+")\n" +
                ":green_heart: ["+gameList[4]+"]"+"("+gameList[5]+")\n" +
                ":yellow_heart: ["+gameList[6]+"]"+"("+gameList[7]+")",
            "color": 4385012,
            "footer": {
                "text": "Voting added by "+ message.author.username
            }
        }}).then(sentEmbed => {
        sentEmbed.react("❤️")
        sentEmbed.react("🧡")
        sentEmbed.react("💚")
        sentEmbed.react("💛")
    })

}

function voting(message, messageID){
    gameList = [];

    const filterItemName = (response) => {
        if (response.author.id === config.admin && response.content.length > 2 ) {
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
                                            message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                                                .then(collected => {
                                                    message.channel.send("third game").then(() => {
                                                        message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                                                            .then(collected => {
                                                                message.channel.send("URL:").then(() => {
                                                                    message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                                                                        .then(collected => {
                                                                            message.channel.send("Last game:").then(() => {
                                                                                message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
                                                                                    .then(collected => {
                                                                                        message.channel.send("URL:").then(() => {
                                                                                            message.channel.awaitMessages(filterItemName, {max: 1, time: 120000, errors: ['time']})
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

function endVoteCommand(message, messageID){
    console.log("endvoting")

    console.log(messageID[0])
    console.log(messageID[1])
    const channelMessage = message.guild.channels.cache.find(channel =>  channel.id === messageID[0])
    console.log(channelMessage)

    channelMessage.messages.fetch(messageID[1]).then(element=> countVotes(channelMessage, element.reactions.cache.toJSON(),messageID[1], message))
}
function countVotes(message, element, messageID, messageOwner){
    const hearts = [":heart:",":orange_heart:", ":green_heart:", ":yellow_heart:" ]
    console.log(element)
    let highest = [0,0]
    for (let i = 0; i < element.length; i++) {
        if (element[i].count > highest[1]){
            highest[0] = i;
            highest[1] = element[i].count
        }

    }
    message.messages.fetch(messageID)
        .then(msg => {
            msg.edit({"embed": {
                    "title": "***Voting Ended***",

                    "description": ":heart: ["+gameList[0]+"]"+"("+gameList[1]+")\n" +
                        ":orange_heart: ["+gameList[2]+"]"+"("+gameList[3]+")\n" +
                        ":green_heart: ["+gameList[4]+"]"+"("+gameList[5]+")\n" +
                        ":yellow_heart: ["+gameList[6]+"]"+"("+gameList[7]+")\n\n" +
                        "Won: "+ hearts[highest[0]] + " " + gameList[highest[0]*2],
                    "color": 4385012,
                    "footer": {
                        "text": "Added by "+ messageOwner.author.username
                    }}});
        });

    messageOwner.channel.send("Alright all set!")
}

function giveAway(message){
    const giveawayUserIdRequester = message.author.id
    let channelId;
    let totalTime= [];
    let totalWinners;
    let giveawayName;


    const filterSetChannel = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("channel: " + response.content.slice(2,20))
            channelId = response.content.slice(2,20);
            return true;
        }
        return false;
    };
    const filterSetTime = (response) => {
        if (response.author.id === giveawayUserIdRequester) {
            console.log("time: " + response.content.slice(0,-1) +" "+ response.content.slice(-1))
            totalTime.push(response.content.slice(0,-1))
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
                                message.channel.awaitMessages(filterSetWinners, {max: 1, time: 120000, errors: ['time']})
                                    .then(collected => {
                                        message.channel.send("Finally,`What do you want to giveaway` ?").then(() => {
                                            message.channel.awaitMessages(filterSetName, {max: 1, time: 120000, errors: ['time']})

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

function startGiveaway(message, channelId, totalTime, totalWinners, giveawayName){
    let deadline;
    if(totalTime[1].toLowerCase() === "d"){
        deadline = new Date(Date.now() + totalTime[0]* 24*3600*1000)
    }else if (totalTime[1].toLowerCase() === "h"){
        deadline = new Date(Date.now() + totalTime[0]* 3600*1000)

    }else if (totalTime[1].toLowerCase() === "m") {
        deadline = new Date(Date.now() + totalTime[0]* 60*1000)

    }else if (totalTime[1].toLowerCase() === "s"){
        deadline = new Date(Date.now() + totalTime[0]* 1000)
    }
    sendGiveaway(message, channelId, deadline, giveawayName, totalWinners);

}

function addToDatabase(message, message_id, channelId, deadline, giveawayName, totalWinners) { //will be used later
    let sql = "INSERT INTO giveaways (channel, winners, name, time, message_id) VALUES ('" + channelId + "', '" + totalWinners + "', '" + giveawayName +  "', '" + deadline.getTime() + "', '" + message_id +  "')";
    con.query(sql, function (err, result) {
        if (err) throw err;
        console.log(result)
        console.log("1 record inserted");
    });
    updateGiveaway(message, deadline, message_id, channelId, giveawayName, totalWinners)


}

function sendGiveaway(message, channelId, deadline, name, totalWinners){
    const channelMessage = message.guild.channels.cache.find(channel =>  channel.id === channelId)

    let now = new Date().getTime();
    let t = deadline - now;
    let days = Math.floor(t / (1000 * 60 * 60 * 24));
    let hours = Math.floor((t%(1000 * 60 * 60 * 24))/(1000 * 60 * 60));
    let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
    let seconds = Math.floor((t % (1000 * 60)) / 1000);


    channelMessage.send({"embed": {
            "title": "" + name,
            "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days "+ hours + " hours " + minutes + " minutes "  + seconds + " seconds",
            "color": 4385012,
            "footer": {
                "text": "Created by " + message.author.username
            }}}).then(sentEmbed => {
                addToDatabase(message, sentEmbed.id, channelId, deadline, name, totalWinners);
        sentEmbed.react("723120954468990996")})

}


function getReactions(message, channelMessage, message_id, name, totalWinners){
    channelMessage.messages.fetch(message_id).then(element=> endGiveaway(message, channelMessage, message_id, name, totalWinners, element.reactions.cache.toJSON()))

}


function updateGiveaway(message, deadline, message_id, channel_id, name, totalWinners){
    const giveawayChannel = message.guild.channels.cache.find(channel =>  channel.id === channel_id)

    let x = setInterval(function() {
        let now = new Date().getTime();
        let t = deadline - now;
        let days = Math.floor(t / (1000 * 60 * 60 * 24));
        let hours = Math.floor((t%(1000 * 60 * 60 * 24))/(1000 * 60 * 60));
        let minutes = Math.floor((t % (1000 * 60 * 60)) / (1000 * 60));
        let seconds = Math.floor((t % (1000 * 60)) / 1000);

        giveawayChannel.messages.fetch(message_id)
            .then(msg => {
                msg.edit({"embed": {
                "title": "" + name,
                "description": "React with <:DropZone:723120954468990996> to enter!\n Time remaining: " + days + " days "+ hours + " hours " + minutes + " minutes "  + seconds + " seconds",
                "color": 4385012,
                "footer": {
                    "text": "Created by " + message.author.username
                }}})})
        if (t < 0) {
            clearInterval(x);
            getReactions(message, giveawayChannel, message_id, name, totalWinners)
        }

    }, 5000);

}

function endGiveaway(message, giveawayChannel, message_id, name, totalWinners, element){
    let winner;
    console.log(element)
    for (let i = 0; i < element.length; i++) {
        console.log(element[i])
        console.log(element[i].users)
        console.log(element[i].emojiID.toString())


        if (element[i].emojiID.toString() === "723120954468990996"){
            console.log("was here")
            let randomNumber = Math.floor(Math.random() * (element[i].count - 2 + 1)) + 1;
            console.log(randomNumber)
            winner = element[i].users[randomNumber]
        }

        message.channel.send("<@" +winner+">")
        }



    giveawayChannel.messages.fetch(message_id)
        .then(msg => {
            msg.edit({"embed": {
                    "title": "" + name,
                    "description": "React with <:DropZone:723120954468990996> to enter!\n ENDED",
                    "color": 4385012,
                    "footer": {
                        "text": "Created by " +message.author.username
                    }}})})

    giveawayChannel.send("congrats "+ "<@" +winner+">"+ ", You won : " + name)

}







client.login(token);
