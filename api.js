const http = require('http');
const express = require('express');
const fetch = require('node-fetch');
const app = express();
const server = http.createServer(app);
const database = require("./database/MySqlConnection")

const logs = [];

app.get("/logs", (req, res) => {
    res.json(logs);
});

app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use("/api/*", (req, res, next) => {
    logs.push({"method": req.method, "url": req.url});
    next();
})

server.listen(8080, () => {
    console.log("SERVER IS RUNNING");
});

app.get("/api/leaderboard", (req, res) => {
    let result = []
    database.getTopXP((err, users) => {
        database.getProfiles((err, profiles) => {
            for (let i = 0; i < profiles.length; i++){
                for (let j = 0; j < users.length; j++){
                    if (users[j].userID === profiles[i].userID){
                        const user = {
                            userID: users[j].userID,
                            level: users[j].level,
                            messages: users[j].messages,
                            xp: users[j].xp,
                            username: profiles[i].username,
                            avatar: profiles[i].avatar,
                        };

                        result.push(user)
                    }
                }
            }
            res.json(result);
        })
    })
});
