const mysql = require("mysql");

const config ={
    host: "localhost",
    user: "root",
    password: "",
    port: "3305",
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
        link : row.steamLink,
        username : row.user
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
                else console.log(err, "Daily Game key added by " + username);
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

function getDailyUsers(id, cb){
    let connection = mysql.createConnection(config);
    connection.connect((err) => {
        if (err) {
            cb(err);
        } else {
            let sql = "SELECT * from `dailyuser` where dailygamesID = ?;"
            connection.query(sql,[id] ,(err, rows) => {
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
                else console.log(err, "Used with the id: " + userId + " has been added to: " + dailyId);
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
                else console.log(err);
            });
        }
    });
}

function getClaimKeys (cb){
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

module.exports = {
    addDailyKey,
    getDailyGames,
    getDailyUsers,
    addUserDaily,
    setDailyEnded,
    getClaimKeys
};
