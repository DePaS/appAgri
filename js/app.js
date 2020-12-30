const { connect } = require('http2');
var mysql = require('mysql');

var con = mysql.createConnection({
    host: 'depas.c9zdk5ptcfcq.eu-central-1.rds.amazonaws.com',
    user: 'depas',
    password: 'Roccat75!',
    database: 'login'
});

con.connect(function(err){
    if (err) throw (err);
    con.query("SELECT email from login", function (err, result, fields) {
        if (err) throw err; 
        console.log('Email: ' + result[0].email);
    });
});
