const mysql = require("mysql");
fs = require('fs');

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
        username: row.user,
        date: row.dayStarted,
        messageID: row.messageID,
        approvalID: row.approvalID,
        winnerID: row.winnerID
    }
}

function row2userData(row) {
    return {
        userID: row.user_id,
        level: row.level,
        messages: row.totalMessages,
        xp: row.totalXp

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
                connection.end();
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
            let sql = "SELECT * from `dailygames` where used = 0 and dayStarted is null;"
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

function getDailyUsers(id, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailyuser` where dailygamesID = ?;"
            connection.query(sql, [id], (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows.map(row2dailyUserData));
                }
            });

        }
    });
}

function getStartedDailyGames(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailygames` where used = 0 and dayStarted IS NOT NULL;"
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

function getNotApprovedDaily(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailygames` where approvalUsed = 0 and approvalID IS NOT NULL;"
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

function addUserDaily(userId, dailyId) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `dailyuser`(userID, dailygamesID) VALUES(?, ?);";
            connection.query(sql, [userId, dailyId], (err, result) => {
                connection.end();
                if (err) console.log(err);
                else console.log("User with the id: " + userId + " has been added to: " + dailyId);
            });
        }
    });
}

function setDailyDate(date, messageID, id) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE `dailygames` SET dayStarted = ?, messageID = ? WHERE id = ?;";
            connection.query(sql, [date, messageID, id], (err, result) => {
                connection.end();
                if (err) console.log(err);
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
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function setDailyApprovalMessage(id, messageID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE `dailygames` SET approvalID = ? WHERE id = ?;";
            connection.query(sql, [messageID,id], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function setDailyApprovalUsed(id) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE `dailygames` SET approvalUsed = 1 WHERE id = ?;";
            connection.query(sql, [id], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function setDailyWinner(id, userID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE `dailygames` SET winnerID = ? WHERE id = ?;";
            connection.query(sql, [userID,id], (err, result) => {
                connection.end();
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

function getGiveaways(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `giveaways`;"
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

function getGiveawayById(id, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `giveaways` WHERE id = ?;"
            connection.query(sql, [id], (err, rows) => {
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

function getVoting(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `votings` WHERE ended = 0;"
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

function addVoting(channelID, messageID, body, totalOptions, time) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO `votings` (channel_id, message_id, time, body, totalOptions) VALUES(?, ?, ?, ?, ?);";
            connection.query(sql, [channelID, messageID, time, body, totalOptions], (err, result) => {
                connection.end();
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
                connection.end();
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
                connection.end();
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


function addUser(userID, giveawayID, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO users (userid, giveaway_id) VALUES (?, ?);";
            connection.query(sql, [userID, giveawayID], (err, result) => {
                connection.end();
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
                connection.end();
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

function getLevels(cb) {
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

function updateLevel(level, totalMessages, totalXp, lastMessage, userID, monthlyMessages) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET level = ?, totalMessages = ?, totalXp = ?, lastMessage = ?,  monthlyMessages = ? WHERE user_id = ?;";
            connection.query(sql, [level, totalMessages, totalXp, lastMessage, monthlyMessages, userID], (err, result) => {
                if (err) console.log(err);
                connection.end();
            });
        }
    });
}


function getLevelsTopMonthly(top, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levels where monthlyMessages IS NOT NULL order by monthlyMessages limit ?;"
            connection.query(sql, [top], (err, rows) => {
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


function addLevelUser(userID, lastMessage) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levels (user_id, level, totalMessages, totalXp, lastMessage) VALUES (?,1,1,2,?);";
            connection.query(sql, [userID, lastMessage], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function getLevelUserByUserID(userID, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM levels WHERE user_id = ?;"
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

function updateLevelUserClaimed(claimedNumber, userID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET claimed = ? WHERE user_id = ?;";
            connection.query(sql, [claimedNumber, userID], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function updateLevelUserLevelClaimed(claimedInvites, userID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET claimedInvites = ? WHERE user_id = ?;";
            connection.query(sql, [claimedInvites, userID], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function getGames(cb) {
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
                    return cb(err, rows);
                }
            });

        }
    });
}

function updateGamesToClaimed(gamesID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE games SET claimed = 1 WHERE id = ?;";
            connection.query(sql, [gamesID], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function addClaimKey(gameName, gameKey) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO games (gameName, gameKey) VALUES (?, ?);";
            connection.query(sql, [gameName, gameKey], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function updateLevelGiveawayToEnded(messageID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levelgiveaways SET ended = 1 WHERE message_id = ?;";
            connection.query(sql, [messageID], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function getLevelUserByID(ID, cb) {
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

function addGiveawayLevelUser(userID, giveawayID) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levelusers (userid, giveaway_id) VALUES (?, ?);";
            connection.query(sql, [userID, giveawayID], (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });

}

function getLevelGiveawaysByID(ID, cb) {
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

function getTopXP(cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * FROM `levels` ORDER BY CAST(totalXp AS INT) DESC LIMIT 50;"
            connection.query(sql, (err, rows) => {
                connection.end();
                if (err) {
                    return cb(err);
                } else {
                    return cb(err, rows.map(row2userData));
                }
            });

        }
    });
}

function addLevelGiveaway(channelID, totalWinners, name, date, messageID, level, cb) {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "INSERT INTO levelgiveaways (channel, winners, name, time, message_id,level, ended) VALUES (?,?,?,?,?,?,0);";
            connection.query(sql, [channelID, totalWinners, name, date, messageID, level], (err, result) => {
                connection.end();
                if (err) cb(err);
                else cb(err, result);
            });
        }
    });

}

function resetMonthlyMessages() {
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            console.log(err);
        } else {
            let sql = "UPDATE levels SET monthlyMessages = null WHERE monthlyMessages is not null;";
            connection.query(sql, (err, result) => {
                connection.end();
                if (err) console.log(err);
            });
        }
    });
}

function addProfile(userid, username, pictures) {
    const str = "\n" + userid + "," + username + "," + pictures
    fs.appendFile('./profiles.txt', str, function (err) {
        if (err) return console.log(err);
    });

}

function getProfiles(cb) {
    fs.readFile("./profiles.txt", "utf-8", (err, str) => {
        if (err) return cb(err, false); // return is used just to stop the computation
        let pets = str.split("\n") // array of strings
            .map(line => line.split(","))
            .map(array2profiles);
        cb(false, pets);
    });
}

function array2profiles(parts) {
    return {
        userID: parts[0],
        username: parts[1],
        avatar: parts[2]
    }
}




module.exports = {
    addDailyKey,
    getDailyGames,
    getDailyUsers,
    addUserDaily,
    setDailyDate,
    setDailyEnded,
    setDailyApprovalMessage,
    setDailyApprovalUsed,
    setDailyWinner,
    getStartedDailyGames,
    getNotApprovedDaily,
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
    addLevelGiveaway,
    getLevelsTopMonthly,
    resetMonthlyMessages,
    getTopXP,
    addProfile,
    getProfiles
};
