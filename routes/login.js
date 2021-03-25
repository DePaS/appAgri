const express = require('express')
const router = express.Router()
const bcrypt = require('bcryptjs')
const mysql = require('mysql');

const con = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASS,
    database: process.env.DB_TABLE
})

router.get('/login', (req, res) => {
    if (req.session.authenticated) res.redirect('/')
    else res.render('login.ejs');
    res.end()
})

router.post('/login', (req, res) => {
    function loggati() {
        const email = req.body.email
        const password = req.body.password
        var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
        if (email.match(re)) {
            con.connect(function (err) {
                if (email) {
                    con.query("SELECT email FROM login WHERE email = ? AND email IS NOT NULL", [email], function (err, emailCheck) {
                        if (emailCheck[0] === undefined && password) {
                            err_msg_mail = "L'Email inserita non è presente nel DB."
                            return res.render('login.ejs', { err_msg_mail: err_msg_mail });
                        } else {
                            if (password) {
                                con.query(`SELECT password FROM login WHERE email = ? AND email IS NOT NULL`, [email], function (err, result) {
                                    if (result[0].password) {
                                        bcrypt.compare(password, result[0].password, function (err, result) {
                                            if (result) {
                                                con.query("SELECT active, user FROM login WHERE email = ?", [email], function (err, result_active) {
                                                    if (result_active[0].active == 'true') {
                                                        /*
                                                        req.session.authenticated = true;
                                                        
                                                        success = 'Login avvenuto con successo, benvenuto!'
                                                        res.render('welcome.ejs', { success: success });*/
                                                        let user = result_active[0].user
                                                        req.session.user = {
                                                            user, email, password
                                                        };
                                                        res.render('doublefa.ejs');
                                                    } else {
                                                        temp_email = req.body.email;
                                                        err_msg_psw = "la mail inserita e' registrata ma non ancora convalidata";
                                                        return res.render('login.ejs', { err_msg_psw: err_msg_psw, temp_email: temp_email });
                                                    }
                                                })
                                            } else {
                                                temp_email = req.body.email;
                                                err_msg_psw = "La password inserita non è valida.";
                                                return res.render('login.ejs', { err_msg_psw: err_msg_psw, temp_email: temp_email });
                                            }
                                        })
                                    }
                                })
                            } else {
                                temp_email = req.body.email;
                                err_msg_psw = "inserire una password";
                                return res.render('login.ejs', { err_msg_psw: err_msg_psw, temp_email: temp_email });
                            }
                        }
                    })
                } else {
                    if (password) {
                        err_msg_mail = 'Inserire la mail';
                        return res.render('login.ejs', { err_msg_mail: err_msg_mail });
                    } else {
                        err_msg_mail = 'Campo Obbligatorio';
                        err_msg_psw = "Campo Obbligatorio";
                        return res.render('login.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail });
                    }

                }
            })
        } else {
            if (email) {
                err_msg_mail = "L'E-Mail inserita non è valida";
                return res.render('login.ejs', { err_msg_mail: err_msg_mail });
            } else if (!password) {
                err_msg_mail = 'Campo Obbligatorio';
                err_msg_psw = "Campo Obbligatorio";
                return res.render('login.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail });
            } else {
                err_msg_mail = 'Campo Obbligatorio';
                return res.render('login.ejs', { err_msg_mail: err_msg_mail });
            }
        }
    } loggati();
})

module.exports = router