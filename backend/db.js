const mysql = require('mysql2');

const db = mysql.createConnection({
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: 'react_auth'
});

db.connect(err => {
    if (err) throw err;
    console.log('Database connected!');
});

module.exports = db;
