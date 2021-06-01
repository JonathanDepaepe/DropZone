const database = require("./database/MySqlConnection");
const fs = require("fs");
const fetch = require('node-fetch');



function updateUser(newUser){
    database.getProfiles((err, profiles) => {
        fs.truncate("./profiles.txt", 0, function (){})
        for (let i = 0; i < profiles.length; i++) {
            if (newUser.id === profiles[i].userID){
                profiles[i].username = newUser.username;
                profiles[i].avatar = newUser.avatar;
            }
            database.addProfile(profiles[i].userID, profiles[i].username, profiles[i].avatar)

        }
    })

}

function addUser(message){
    database.addProfile(message.author.id, message.author.username, message.author.avatar);

}

function users() {
    let x = setInterval( function (){let profilesListed = [];

        database.getProfiles((err, profiles) => {
            for (let i = 0; i < profiles.length; i++) {
                profilesListed.push(profiles[i].userID);
            }
            database.getLevels((err, users) => {
                users.forEach(user => {
                    if (!profilesListed.includes(user.user_id)) {
                        console.log(profilesListed.includes(user.user_id))
                        console.log(user.user_id)
                        fetch('https://discord.com/api/v8/users/' + user.user_id, {
                            method: 'get',
                            headers: {
                                'Authorization': 'Bot ODM3OTkyODQ5MzAzMTQyNDQw.YI0nqA.C4OLqbApRieRBu9cUPF-A57pmOo',
                                'Content-Type': 'application/json'
                            }
                        }).then(response => response.json()).then(json => {
                            console.log(json)
                            if (json.id !== undefined && !json.username.includes('Deleted User')) {

                                database.addProfile(json.id, json.username, json.avatar)
                                console.log("adding user: " + json.username)
                            }
                        });
                    }
                })
            })
        }) },5000)
}

module.exports = {
    updateUser,
    addUser
}