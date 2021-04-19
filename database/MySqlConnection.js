const mysql = require("mysql");

const config = {
    host: "localhost",
    user: "root",
    password: "",
    port: "3306",
    database: "discord",
    connectionLimit: 10
}

function row2dailyUserData(row) {
    return {
        userID: row.userID,
    }
}

function row2dailyData(row) {
    return {
        id: row.id,
        key: row.gameKey,
        link: row.steamLink,
        username: row.user
    }
}


function addDailyKey(key, link, username) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `dailygames`(gameKey, steamLink, user) VALUES(?, ?, ?);";
            connection.query(sql, [key, link, username], (err, result) => {
                if (err) console.log(err);
                else console.log("Daily Game key added by " + username);
            });
        }
    });
}


function getDailyGames(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailygames` where used = 0;"
            connection.query(sql, (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows.map(row2dailyData));
                }
            });

        }
    });
}

function getDailyUsers(id, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailyuser` where dailygamesID = ?;"
            connection.query(sql, [id], (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows.map(row2dailyUserData));
                }
            });

        }
    });
}

function addUserDaily(userId, dailyId) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `dailyuser`(userID, dailygamesID) VALUES(?, ?);";
            connection.query(sql, [userId, dailyId], (err, result) => {
                if (err) console.log(err);
                else console.log("Used with the id: " + userId + " has been added to: " + dailyId);
            });
        }
    });
}

function setDailyEnded(id) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE `dailygames` SET used = 1 WHERE id = ?;";
            connection.query(sql, [id], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function getClaimKeys(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM games WHERE claimed = 0;"
            connection.query(sql, (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows.map(row2dailyData));
                }
            });

        }
    });


}

function getGiveaways(cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `giveaways`;"
            connection.query(sql, (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function getGiveawayById(id, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `giveaways` WHERE id = ?;"
            connection.query(sql, [id], (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function getVoting(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `votings` WHERE ended = 0;"
            connection.query(sql, (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function addVoting(channelID, messageID, gameName1, url1, gameName2, url2, gameName3, url3, gameName4, url4, time) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `votings` (channel_id, message_id, gameName1, url1, gameName2, url2, gameName3, url3, gameName4, url4, time) VALUES(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);";
            connection.query(sql, [channelID, messageID, gameName1, url1, gameName2, url2, gameName3, url3, gameName4, url4, time], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function updateVotingByMessageID(messageID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE votings SET ended = 1 WHERE message_id = ?;";
            connection.query(sql, [messageID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}


function addGiveaway(channel, winners, name, time, message_id, ended, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `giveaways` (channel, winners, name, time, message_id, ended) VALUES(?, ?, ?, ?, ?, ?);";
            connection.query(sql, [channel, winners, name, time, message_id, ended], (err, result) => {
                if (err) cb(err);
                else cb(err, result);
            });
        }
    });
}

function getUsersByGiveawayID(giveawayId, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM users WHERE giveaway_id =  ?;"
            connection.query(sql, [giveawayId], (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}


function addUser(userID, giveawayID, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO users (userid, giveaway_id) VALUES (?, ?);";
            connection.query(sql, [userID, giveawayID], (err, result) => {
                if (err) cb(err);
            });
        }
    });
}

function updateGiveawayToEnded(messageID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE giveaways SET ended = 1 WHERE message_id = ?;";
            connection.query(sql, [messageID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function getLevelGiveaways(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levelgiveaways WHERE ended = 0;"
            connection.query(sql, (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });

}

function getLevels(cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levels;"
            connection.query(sql, (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function updateLevel(level, totalMessages, totalXp, lastMessage, userID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET level = ?, totalMessages = ?, totalXp = ?, lastMessage = ?  WHERE user_id = ?;";
            connection.query(sql, [level, totalMessages, totalXp, lastMessage, userID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function addLevelUser(userID, lastMessage){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levels (user_id, level, totalMessages, totalXp, lastMessage) VALUES (?,1,1,2,?);";
            connection.query(sql, [userID, lastMessage], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function getLevelUserByUserID(userID, cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levels WHERE user_id = ?;"
            connection.query(sql, [userID], (err, rows) => {
                connection.end(); // avoid DOS
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function updateLevelUserClaimed(claimedNumber, userID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET claimed = ? WHERE user_id = ?;";
            connection.query(sql, [claimedNumber, userID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function updateLevelUserLevelClaimed(claimedInvites, userID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET claimedInvites = ? WHERE user_id = ?;";
            connection.query(sql, [claimedInvites, userID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function getGames(cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM games WHERE claimed = 0;"
            connection.query(sql, [userID], (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function updateGamesToClaimed(gamesID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE games SET claimed = 1 WHERE id = ?;";
            connection.query(sql, [gamesID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}
function addClaimKey(gameName, gameKey){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO games (gameName, gameKey) VALUES (?, ?);";
            connection.query(sql, [gameName, gameKey], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function updateLevelGiveawayToEnded(messageID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levelgiveaways SET ended = 1 WHERE message_id = ?;";
            connection.query(sql, [messageID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });
}

function getLevelUserByID(ID, cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levelusers WHERE giveaway_id = ?;"
            connection.query(sql, [ID], (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function addGiveawayLevelUser(userID, giveawayID){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levelusers (userid, giveaway_id) VALUES (?, ?);";
            connection.query(sql, [userID, giveawayID], (err, result) => {
                if (err) console.log(err);
            });
        }
    });

}

function getLevelGiveawaysByID(ID, cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levelgiveaways WHERE id =  ?;"
            connection.query(sql, [ID], (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows);
                }
            });

        }
    });
}

function addLevelGiveaway(channelID, totalWinners, name, date, messageID, level, cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levelgiveaways (channel, winners, name, time, message_id,level, ended) VALUES (?,?,?,?,?,?,0);";
            connection.query(sql, [channelID, totalWinners, name, date, messageID, level], (err, result) => {
                if (err) cb(err);
                else cb(err, result);
            });
        }
    });

}

module.exports = {
    addDailyKey,
    getDailyGames,
    getDailyUsers,
    addUserDaily,
    setDailyEnded,
    getClaimKeys,
    getGiveaways,
    getGiveawayById,
    getVoting,
    addVoting,
    updateVotingByMessageID,
    addGiveaway,
    getUsersByGiveawayID,
    addUser,
    updateGiveawayToEnded,
    getLevelGiveaways,
    getLevels,
    updateLevel,
    addLevelUser,
    getLevelUserByUserID,
    getGames,
    updateLevelUserClaimed,
    updateGamesToClaimed,
    updateLevelUserLevelClaimed,
    addClaimKey,
    updateLevelGiveawayToEnded,
    getLevelUserByID,
    addGiveawayLevelUser,
    getLevelGiveawaysByID,
    addLevelGiveaway
};
