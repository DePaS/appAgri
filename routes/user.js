const express = require('express')
const router = express.Router()
const mysql = require('mysql')

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/user', (req, res) => {
    if (req.session.authenticated) {
        con.query("SELECT user FROM login WHERE email = ?", [req.session.user.email], function(err, result_user){
            if (err) throw err
            success = result_user[0].user
            res.render('user.ejs', { success: success });
          })
    } else {
        success = 'Pagina non disponibile, effettuare la registrazione o il login'
        res.render('welcome.ejs', { success: success })
    }
})

module.exports = router