const express = require('express')
const router = express.Router()
const speakeasy = require('speakeasy')
const secret = speakeasy.generateSecret(20);
const url = speakeasy.otpauthURL({ secret: secret.ascii, label: 'depas.cloud', algorithm: 'sha1' });
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
                qrcode.toDataURL(url, function (err, data_url) {
                    if (err) throw err
                    con.query("UPDATE login SET Dfa_token = ? WHERE email = ?", [
                        secret.base32,
                        email
                    ], function (err, result_token) {
                        if (err) throw err
                    })
                    let codice_qr = data_url
                    res.render('doublefa.ejs', { codice_qr: codice_qr })
                });
            } else {
                let remove = req.query.remove
                if (remove == 'yes') {
                    res.render('doublefa.ejs')
                } else {
                    let success = 'auth a 2 fattori gia aggiunta in precedenza'
                    res.render('welcome.ejs', { success: success })
                }
            }
        });
    } else {
        let success = 'non sei loggato'
        res.render('welcome.ejs', { success: success })
    }
    //res.end()
})

router.post('/doublefa', (req, res) => {
    if (req.session.authenticated) {
        const email = req.session.user.email
        con.query('SELECT Dfa_token FROM login WHERE email = ?', [req.session.user.email], function (err, token) {
            if (err) throw err
            let token_client = req.body.password
            let verified = speakeasy.totp.verify({
                secret: token[0].Dfa_token,
                encoding: 'base32',
                token: token_client
            });
            if (verified) {
                con.query('SELECT dfa_enabled FROM login WHERE email = ?', [req.session.user.email], function (err, enabled) {
                    if (err) throw err 
                    if (enabled[0].dfa_enabled != 'true') {
                        con.query("UPDATE login SET dfa_enabled = 'true' WHERE email = ?", [email], function (err, result) {
                            if (err) throw err
                            success = 'auth a 2 fattori con app aggiunta'
                            res.render('welcome.ejs', { success: success })
                        })
                    }
                    if (enabled[0].dfa_enabled == 'true') {
                        con.query("UPDATE login SET dfa_enabled = null, Dfa_token = null WHERE email = ?", [email], function (err, removed) {
                            if (err) throw err
                                success = 'auth a 2 fattori rimossa con successo'
                                res.render('welcome.ejs', { success: success })
                        })
                    }
                })  
            } 
        })
    } else {
        con.query('SELECT Dfa_token FROM login WHERE email = ?', [req.session.user.email], function (err, token) {
            if (err) throw err
            let token_client = req.body.password
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
    }
})

module.exports = router