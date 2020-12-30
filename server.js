const express = require('express')
const app = express()
const bcrypt = require('bcryptjs')

const users = []
const name = []
const email = []
const password = []

const { connect } = require('http2');
var mysql = require('mysql');
const passport = require('passport')

var con = mysql.createConnection({
    host: 'depas.c9zdk5ptcfcq.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'Roccat75!',
    database: 'login'
})

var pool = mysql.createPool({
    connectionLimit : 1,
    host: 'depas.c9zdk5ptcfcq.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'Roccat75!',
    database: 'login'
})


app.set('view-engine', 'ejs')
app.use(express.urlencoded({ extended: false }))

app.get('/', (req, res) => {
    res.render('index.ejs');
})

app.get('/error', (req, res) => {
    res.render('error.ejs');
})

app.get('/login', (req, res) => {
    res.render('login.ejs');
})
var zero = 0;
app.get('/home', (req, res) => {
    if (zero == 0){
    res.render('home.ejs');
    } else {
        res.redirect('/error')
    }
})


app.post('/login', (req, res) => {
     function loggati() {
            const email = req.body.email
            const password = req.body.password 

            con.connect(function(err){
                console.log('Connesso al DB!')
                var checkMail = `SELECT email FROM login WHERE email = '${email}' AND email IS NOT NULL`
                con.query(checkMail, function(err, emailCheck){
                    if (emailCheck[0] === undefined) {
                        res.redirect('/error')
                    } else {
                        var login = `SELECT password FROM login WHERE email = '${email}' AND email IS NOT NULL`
                        con.query(login, function(err, result){
                    //console.log(typeof(result[0].password))
                    
                    if (result[0].password) {
                        bcrypt.compare(password, result[0].password, function(err, result){
                            console.log('>>' + password)
                            if (result) {
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
    } loggati()
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

                var check_email = `SELECT email FROM login WHERE email = '${email}'`
                pool.query(check_email, function(err, result1){
                    if (result1[0] != undefined) {
                        if (result1[0].email == email) {
                            res.redirect('/error')
                            console.log('stessa mail')
                        }
                    } 
                     else {
                        var register = `INSERT INTO login (username, email, password) VALUES ('${name}', '${email}', '${hashedPassword}');`
                            pool.query(register, function (err, result2){
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

const port = process.env.port || 3000;
app.listen(port)