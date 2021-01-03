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

const { connect } = require('http2');
const mysql = require('mysql');
const e = require('express');

app.use(express.static("public"));

const con = mysql.createConnection({
    host: 'app-agri.cwq3tqmj1f1n.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'f23L;-nO',
    database: 'agri'
})

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
//app.use(cookieParser());
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
    if (req.session.authenticated) res.redirect('/home')
    else res.render('login.ejs');
})

app.get('/error', (req, res) => {
    res.render('error.ejs');
})

app.get('/login', (req, res) => {
    if (req.session.authenticated) res.redirect('/home')
    else res.render('login.ejs');
})

app.get('/home', (req, res, next) => {
    if (req.session.authenticated) res.render('home.ejs');
    else res.redirect('/error');
})



app.post('/login', (req, res) => {
    function loggati() {
        const email = req.body.email
        const password = req.body.password
        if (email && password) {
           /* if (req.session.authenticated) {
                res.json(req.session);
            } else {*/
                con.connect(function (err) {
                    console.log('Connesso al DB!')
                    const checkMail = `SELECT email FROM login WHERE email = '${email}' AND email IS NOT NULL`
                    con.query(checkMail, function (err, emailCheck) {
                        if (emailCheck[0] === undefined) {
                            res.redirect('/error')
                            console.log('>> email non esiste <<')
                        } else {
                            const login = `SELECT password FROM login WHERE email = '${email}' AND email IS NOT NULL`
                            con.query(login, function (err, result) {
                                if (result[0].password) {
                                    bcrypt.compare(password, result[0].password, function (err, result) {
                                        if (result) {
                                            console.log('>> ' + password + ' <<')
                                            req.session.authenticated = true;
                                            req.session.user = {
                                                email, password
                                            };
                                            res.redirect('/home')
                                        } else {
                                            res.redirect('/error')
                                        }
                                    })
                                }
                            })
                        }
                    })
                })
           // }
        } else res.redirect('/error');
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
                        console.log(result2)

                    })
                    res.redirect('/login')
                    console.log('Inserisco dati a DB!') 
                }
            })
        } catch {
            res.redirect('/register')
        }
    }
    registra()

});

/*
function validateCookie(req, res, next) {
    const { cookies } = req;
    if('session_id' in cookies) {
        console.log('Session ID exists.');
        if (cookies.session_id === '123456') next();
        else res.status(403).send({ msg: 'Non autorizzato' });
    }   else {
        res.status(403).send({ msg: 'Non autorizzato' });
    }
    next();
}
*/

/*
app.get('/loggato', validateCookie,(req, res) => {
    res.status(200).json({ msg: 'sei dentro' });
});
*/

const port = process.env.port || 8080;

app.listen(port)