const express = require('express')
const app = module.exports = express()
const bcrypt = require('bcryptjs')
const session = require('express-session');
//const cookieParser = require('cookie-parser')
const MySQLStore = require('express-mysql-session')(session);
const path = require('path');

const users = []
const name = []
const email = []
const password = []
let err_msg_psw = ''
let err_msg_mail = ''
let err_msg_campi = ''
let temp_email = ''
let temp_user = ''
let err_msg_user = ''
let success = ''

const { connect } = require('http2');
const mysql = require('mysql');
const e = require('express');
const { request } = require('http');

app.use(express.static("public"));
app.use(express.static("js"));

const pool = mysql.createPool({
    connectionLimit: 1,
    host: 'app-agri.cwq3tqmj1f1n.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'f23L;-nO',
    database: 'agri'
})

const options = {
    host: 'app-agri.cwq3tqmj1f1n.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'f23L;-nO',
    database: 'agri'
}

const sessionStore = new MySQLStore(options);

app.use('/static', express.static(path.join(__dirname, 'public')))

app.set('view-engine', 'ejs')

app.use(session({
    secret: 'session_cookie_secret',
    cookie: { maxAge: 300000 },
    store: sessionStore,
    resave: false,
    saveUninitialized: false
}));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

/*
app.use((req, res, next) => {
    console.log(req.method);
    next();
})*/

app.get('/', (req, res) => {
    if (req.session.authenticated) res.render('home.ejs')
    else res.redirect('/login')
})

app.get('/register', (req, res) => {
    success = 'Registrazione già effettuata! Sarai '
    if (req.session.authenticated) {
        success = 'Sei già loggato, sarai portato alla home!'
        res.render('welcome.ejs', {success: success})
    }
    else res.render('register.ejs');
})

app.get('/login', (req, res) => {
    if (req.session.authenticated) res.redirect('/home')
    else res.render('login.ejs');
})

app.post('/login', (req, res) => {
    function loggati() {
        const email = req.body.email
        const password = req.body.password
        if (email) {
                const checkMail = `SELECT email FROM login WHERE email = '${email}' AND email IS NOT NULL`
                pool.query(checkMail, function (err, emailCheck) {
                    if (emailCheck[0] === undefined && password) {
                        err_msg_mail = "L'Email inserita non è presente nel DB."
                        return res.render('login.ejs', { err_msg_mail: err_msg_mail });
                    } else {
                        if (password) {
                            const login = `SELECT password FROM login WHERE email = '${email}' AND email IS NOT NULL`
                            pool.query(login, function (err, result) {
                                if (result[0].password) {
                                    bcrypt.compare(password, result[0].password, function (err, result) {
                                        if (result) {
                                            console.log('>> ' + password + ' <<')
                                            req.session.authenticated = true;
                                            req.session.user = {
                                                email, password
                                            };
                                            //res.redirect('/home')
                                            success = 'Login avvenuto con successo, benvenuto!'
                                            res.render('welcome.ejs', { success: success });
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
                            console.log('psw manca');
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
                err_msg_campi = 'Compilare entrambi i campi'
                return res.render('login.ejs', { err_msg_campi: err_msg_campi });
            }

        }
    } loggati();
})


app.get('/register', (req, res) => {
    res.render('register.ejs');
})

app.post('/register', (req, res) => {
    async function registra() {
        try {
            const hashedPassword = await bcrypt.hash(req.body.password, 10)
            const name = req.body.name
            const email = req.body.email
            const pass_check = req.body.password
            const numbers = /[0-9]/g;
            var upperCaseLetters = /[A-Z]/g;
            var lowerCaseLetters = /[a-z]/g;
            var re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
            let validUser = 'non_valido';
            let validEmail = 'non_valido';
            let validPassword = 'non_valido';
            console.log(pass_check.length)
            if (name.length > 2 && name.length < 15) {
                validUser = 'valido'
            }
            if (email.match(re)) {
                validEmail = 'valido'
            } else {
                console.log('email non valida')
            }
            if (pass_check.length < 7 || pass_check.length > 16) {
                console.log('password lunga o corta')
            } else {
                if (pass_check.match(numbers) && pass_check.match(upperCaseLetters) && pass_check.match(lowerCaseLetters) && !(/\s/.test(pass_check))) {
                    validPassword = 'valido'
                } else {
                    console.log('password errata')
                }
            }
            if (name && email && pass_check) {
                if ((validUser == 'valido') && (validEmail == 'valido') && (validPassword == 'valido')) {
                    const check_email = `SELECT email FROM login WHERE email = '${email}'`
                    pool.query(check_email, function (err, result1) {
                        if (result1[0] != undefined) {
                            if (result1[0].email == email) {
                                res.redirect('/error')
                                console.log('stessa mail')
                            }
                        }
                        else {
                            const register = `INSERT INTO login (user, email, password, idlogin) VALUES ('${name}', '${email}', '${hashedPassword}', '1234');`
                            pool.query(register, function (err, result2) {
                                if (err) throw err
                            })
                            success = 'Registrazione avvenuta con successo, benvenuto!'
                            res.render('welcome.ejs', { success: success });
                            console.log('Inserisco dati a DB!')
                        }
                    })
                } else {
                    if ((validUser != 'valido') && (validEmail != 'valido')) {
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        err_msg_psw = "La password deve avere lunghezza compresa tra 8 e 16 caratteri e contenere almeno una A, a e un numero"
                        temp_email = req.body.email
                        temp_user = req.body.name
                        if (validPassword != 'valido') {
                            return res.render('register.ejs', { err_msg_user: err_msg_user, err_msg_mail: err_msg_mail, err_msg_psw: err_msg_psw, temp_email: temp_email, temp_user: temp_user });
                        } else {
                            return res.render('register.ejs', { err_msg_user: err_msg_user, err_msg_mail: err_msg_mail, temp_email: temp_email, temp_user: temp_user });
                        }
                    } else if ((validUser != 'valido') && (validEmail == 'valido')) {
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        temp_email = req.body.email
                        return res.render('register.ejs', { err_msg_user: err_msg_user, temp_email: temp_email });
                    } else if ((validUser == 'valido') && (validEmail != 'valido')) {
                        temp_user = req.body.name
                        err_msg_user = "L'username deve avere lunghezza compresa tra 6 e 15 caratteri"
                        err_msg_mail = "Controllare correttezza formale E-Mail"
                        return res.render('register.ejs', { err_msg_mail: err_msg_mail, temp_user: temp_user });
                    } else if ((validUser == 'valido') && (validEmail == 'valido')) {
                        err_msg_psw = "La password deve avere lunghezza compresa tra 8 e 16 caratteri e contenere almeno una A, a e un numero"
                        temp_user = req.body.name
                        temp_email = req.body.email
                        if (validPassword != 'valido') {
                            return res.render('register.ejs', { err_msg_psw: err_msg_psw, temp_user: temp_user, temp_email: temp_email });
                        }
                    }
                }
            } else {
                if (name && email && !pass_check) {
                    err_msg_psw = "Campo obbligatorio"
                    temp_user = req.body.name
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, temp_user: temp_user, temp_email: temp_email });
                } else if (name && !email && !pass_check) {
                    err_msg_psw = "Campo obbligatorio"
                    err_msg_mail = "Campo obbligatorio"
                    temp_user = req.body.name
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail, temp_user: temp_user });
                } else if (!name && email && !pass_check) {
                    err_msg_psw = "Campo obbligatorio"
                    err_msg_user = "Campo obbligatorio"
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_user: err_msg_user, temp_email: temp_email });
                } else if (!name && !email && pass_check) {
                    err_msg_mail = "Campo obbligatorio"
                    err_msg_user = "Campo obbligatorio"
                    return res.render('register.ejs', { err_msg_mail: err_msg_mail, err_msg_user: err_msg_user });
                } else if (!name && email && pass_check) {
                    err_msg_user = "Campo obbligatorio"
                    temp_email = req.body.email
                    return res.render('register.ejs', { err_msg_user: err_msg_user, temp_email: temp_email });
                } else if (name && !email && pass_check) {
                    err_msg_mail = "Campo obbligatorio"
                    temp_user = req.body.name
                    return res.render('register.ejs', { err_msg_mail: err_msg_mail, temp_user: temp_user });
                } else if (!name && !email && !pass_check) {
                    err_msg_psw = "Campo obbligatorio"
                    err_msg_mail = "Campo obbligatorio"
                    err_msg_user = "Campo obbligatorio"
                    return res.render('register.ejs', { err_msg_psw: err_msg_psw, err_msg_mail: err_msg_mail, err_msg_user: err_msg_user });
                }
            }


        } catch {
            res.redirect('/register')
        }
    }
    registra()
});

const port = process.env.port || 5000;

app.listen(port)