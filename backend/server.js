require('dotenv').config();
const express = require('express');
const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(express.json());
app.use(cors( { origin: 'http://localhost:3000'}))

const dbConfig = {
    host: 'localhost',  // atau '127.0.0.1'
    port: 3306,         // port default MySQL
    user: 'root',
    password: '',       // default Laragon kosong
    database: 'react_auth'
};







const JWT_SECRET = process.env.JWT_SECRET || 'secret123';

// helper get connection
async function getConn() {
    return await mysql.createConnection(dbConfig);
}

// register
app.post('/api/register', async (req, res) => {
    const { name, email, password} = req.body;
    if (!name || !email || !password) return res.status(400).json({ message : 'Lengkapi semua field'});

    try {
        const conn = await getConn();
        const [rows] = await conn.execute('SELECT id FROM users WHERE email = ?', [email]);
        if (rows.length) {
            await conn.end();
            return res.status(409).json({ message : 'Email sudah terdaftar'});
        }

        const hashed = await bcrypt.hash(password, 10);
await conn.execute('INSERT INTO users (name, email, password) VALUES (?, ?, ?)', [name, email, hashed]);
        await conn.end();

        return res.json({ message: 'Registrasi berhasil' });
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message : 'Server error' });
    }

});

// login
app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ message: 'Lengkapi semua field'});


    try {
        const conn = await getConn();
        const [rows] = await conn.execute('SELECT id, name, email, password FROM users WHERE email = ?', [email])
        await conn.end();

        if (!rows.length) return res.status(401).json({ message : 'Email belum terdaftar'});

        const user = rows[0];
        const ok = await bcrypt.compare(password, user.password);
        if (!ok) return res.status(401).json({ message: 'Password salah'})

       // buat token
       const token = jwt.sign({ id : user.id, email : user.email, name : user.name}, JWT_SECRET, { expiresIn : '19h'});
    
       return res.json({ message : 'Login berhasil', token, user: { id: user.id, name : user.name, email: user.email } });
}catch (err) {
        console.error(err);
        return res.status(500).json({ message : 'Server error'})
       }
    }
);


// contoh route protected
app.get('/api/profile', async (req, res) => {
    const auth = req.headers.authorization;
    if (!auth) return res.status(401).json({ message : 'Unauthorized'})
    const token = auth.split(' ')[1];
    try {
        const data = jwt.verify(token, JWT_SECRET);
        return res.json({ user : data });
    } catch ( err) {
        return res.status(401)({message : "Token tidak valid"} )
    }
})

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`))
