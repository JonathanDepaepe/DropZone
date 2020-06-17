const Discord = require('discord.js');
const client = new Discord.Client();
const { token } = require("./auth.json");
const { prefix } = require("./config.json")
const ytdl = require("ytdl-core");
const config = require("./config.json")


const queue = new Map();

client.once("ready", () => {
    console.log('Ready!');
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
                                        message.channel.send(":question: Uh! You took longer then 2 minutes to respond, <@" + server.serverGiveawaysInformation.makingAlreadyGiveawayUserId + ">! \n\n`Canceled creating the giveaway!`");
                                    });
                            });
                        })
                        .catch(collected => {
                            message.channel.send("Uh! You took longer then 2 minutes to respond, <@" + server.serverGiveawaysInformation.makingAlreadyGiveawayUserId + ">! \n\n`Canceled creating the giveaway!`");
                        });
                });
            })
            .catch(collected => {
                message.channel.send("Uh! You took longer then 2 minutes to respond, <@" + server.serverGiveawaysInformation.makingAlreadyGiveawayUserId + ">! \n\n`Canceled creating the giveaway!`");
            });
    });



}

function sendToSteamGiftsChannel(message, gameName, steamGiftsURL, pictureURL) {

    const channelToStartGiveaway = message.guild.channels.cache.find(channel =>  channel.id === config.steamGifts);


    channelToStartGiveaway.send({"embed": {
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








client.login(token);
