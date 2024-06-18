const express = require("express");
const mongoose = require('mongoose');

const User = require('./models/users');
const { forEach } = require("lodash");

const app = express();

var logUser;

app.use(express.urlencoded({ extended: true }));

const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

mongoose.connect(urI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));

app.set('view engine', 'ejs');

app.post('/addReac', (req, res) => {
    console.log(req.body);
});

app.post('/register', (req, res) => {
    const que = User.find({});
    que.select('username');
    que.exec()
        .then((ans) => {
            var newUsername = req.body.username;

            for (let i = 0; i<ans.length; i++) {
                if (newUsername === ans[i].username) {
                    res.render('registerPage', {mode: 'usernameTaken'});
                    return
                }
            }

            var pass1 = req.body.password;
            var pass2 = req.body.password2;

            if (pass1 === pass2) {
                const user = new User({
                    username: newUsername, 
                    password:pass1, 
                    reactors: []
                });
                user.save()
                .then((result) => {
                    res.redirect('/login');
                    return
                })
                .catch((err) => {
                    console.log(err);
                });
            }
            else {
                res.render('registerPage', {mode: 'passwordMistake'});
                return
            }
        });
});

app.post('/start', (req, res) => {
    const que = User.find({});
    que.exec()
        .then((ans) => {
            var tryUsername = req.body.username;
            var tryPassword = req.body.password;

            for (let i = 0; i<ans.length; i++) {
                if (tryUsername === ans[i].username) {
                    if (tryPassword === ans[i].password) {
                        res.render('startPage', {user: ans[i]});
                        logUser = ans[i];
                        return
                    }
                    else {
                        res.render('loginPage', {mode: 'error'});
                        return
                    }
                }
            }
            res.render('loginPage', {mode: 'error'});
            return
        });
});

app.get('/register', (req, res) => {
    res.render('registerPage', {mode: 'normal'});
});

app.get('/start', (req, res) => {
    console.log(req);
    res.render('startPage', {user: logUser})
});

app.get('/reacView', (req, res) => {
    res.render('reacView')
});

app.get('/addReac', (req, res) => {
    res.render('addReacPage')
});

app.get('/addSens', (req, res) => {
    res.render('addSensPage')
});

app.get('/addActu', (req, res) => {
    res.render('addActuPage')
});

app.get('/addRout', (req, res) => {
    res.render('addRoutPage')
});

app.get('/addEvt', (req, res) => {
    res.render('addEvtPage')
});

app.get('/addAct', (req, res) => {
    res.render('addActPage')
});

app.get('/addAlar', (req, res) => {
    res.render('addAlarPage')
});


app.use(express.static('views'));

app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
