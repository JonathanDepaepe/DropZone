const mysql = require("mysql");

const config ={
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
        id: row.insertId,
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
            console.log("Connected for creation");
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
            console.log("Connected");
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
            console.log("Connected");
            let sql = "SELECT * from `dailyuser` where dailygames_id = ?;"
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
            console.log("Connected for creation");
            let sql = "INSERT INTO `dailygames`(userid, dailygames_id) VALUES(?, ?);";
            connection.query(sql, [userId, dailyId], (err, result) => {
                if (err) console.log(err);
                else console.log(err, "Used with the id: " + userId + "has been added to: " + dailyId);
            });
        }
    });
}


module.exports = {
    addDailyKey,
    getDailyGames,
    getDailyUsers,
    addUserDaily
};
