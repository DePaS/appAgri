const express = require('express')
const router = express.Router()
const speakeasy = require('speakeasy')
const secret = speakeasy.generateSecret(20);
const qrcode = require('qrcode')
const mysql = require('mysql');

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})


router.get('/doublefa', (req, res) => {
    if (req.session.authenticated) {
        const email = req.session.user.email
        con.query("SELECT dfa_enabled FROM login WHERE email = ?", [email], function (err, enabled) {
            if (enabled[0].dfa_enabled != 'true') {
                //else res.render('doublefa.ejs');
                qrcode.toDataURL(secret.otpauth_url, function (err, data_url) {
                    if (err) throw err
                    con.query("UPDATE login SET Dfa_token = ? WHERE email = ?", [
                        secret.base32,
                        email
                    ], function (err, result_token) {
                        if (err) throw err
                    })
                    console.log(secret.base32)
                    let codice_qr = data_url
                    res.render('doublefa.ejs', { codice_qr: codice_qr })
                });
            } else {
                let success = 'auth a 2 fattori gia aggiunta in precedenza'
                res.render('welcome.ejs', { success: success })
            }
        });
    } else {
        res.render('doublefa.ejs')
    }
    //res.end()
})

router.post('/doublefa', (req, res) => {
    if (req.session.authenticated) {
        const email = req.session.user.email
        con.query('SELECT Dfa_token FROM login WHERE email = ?', [req.session.user.email], function (err, token) {
            if (err) throw err
            let token_client = req.body.password
            console.log(token[0].Dfa_token)
            let verified = speakeasy.totp.verify({
                secret: token[0].Dfa_token,
                encoding: 'base32',
                token: token_client
            });
            if (verified) {
                con.query("UPDATE login SET dfa_enabled = 'true' WHERE email = ?", [email], function (err, result) {
                    if (err) throw err
                    console.log('2fa aggiornato')
                    success = 'auth a 2 fattori con app aggiunta'
                    res.render('welcome.ejs', { success: success })
                })
            } else {
                console.log('mannagg a maron')
                success = 'auth a 2 fattori fallita'
                res.render('welcome.ejs', { success: success })
            }
        })
    } else {
        console.log('prova')
        con.query('SELECT Dfa_token FROM login WHERE email = ?', [req.session.user.email], function (err, token) {
            if (err) throw err
            let token_client = req.body.password
            console.log(token[0].Dfa_token)
            let verified = speakeasy.totp.verify({
                secret: token[0].Dfa_token,
                encoding: 'base32',
                token: token_client
            });
            if (verified) {
                req.session.authenticated = true;
                success = 'Login avvenuto con successo, benvenuto!'
                res.render('welcome.ejs', { success: success });
            } else {
                success = 'codice app 2fa errato!'
                res.render('welcome.ejs', { success: success });
            }
        });
        //res.end()
    }
})

module.exports = router