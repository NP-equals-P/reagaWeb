const express = require("express");
const mongoose = require('mongoose');
const { forEach } = require("lodash");
const { ObjectId } = require("mongodb");
const url = require('node:url');

let findUserByID = function(id) {

    const que = User.find({});
    return que.exec()
        .then((ans) => {
            for (let i = 0; i<ans.length; i++) {
                if (ans[i]._id.toString() === id) {
                    return ans[i];
                }
            }

            return null;
        });
}

// ---------- Mongoose Models ----------
const User = require('./models/users');

const Reac = require('./models/reacs');
// ---------- Mongoose Models ----------


// ---------- Configs ----------
const app = express();

app.use(express.urlencoded({ extended: true }));

app.set('view engine', 'ejs');

app.use(express.static('views'));
// ---------- Configs ----------


// ---------- Connect to DB ----------
//const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

const urI = "mongodb+srv://ito:senhaito@cluster0.2muvzud.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(urI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));
// ---------- Connect to DB ----------


// ---------- Post Requests ----------
app.post('/start', (req, res) => {
    const que = User.find({});
    que.exec()
        .then((ans) => {
            if (req.body.type === "auth") {
                var tryUsername = req.body.username;
                var tryPassword = req.body.password;
    
                for (let i = 0; i<ans.length; i++) {
                    if (tryUsername === ans[i].username) {
                        if (tryPassword === ans[i].password) {
                            res.render('startPage', {user: ans[i]});
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
            } else if (req.body.type === "in") {

                let AUser = findUserByID(req.body.id)

                AUser.then(function(result) {
                    if (result != null) {
                        res.render('startPage', {user: result});
                    }
                });
            } else if (req.body.type === "addReac") {
                var reacName = req.body.name;
                var userId = req.body.id;

                const reac = new Reac({
                    name: reacName
                });

                
                reac.save()
                .then(() => {
                        User.findByIdAndUpdate(userId, {
                            $push: {
                                reactors: reac._id
                            }
                        })
                            .then((result) => {
                                res.redirect(url.format({
                                    pathname: "/start",
                                    query: {
                                        "type": "in"
                                    }
                                }));
                            });
                    });
            }
        });
});

app.post('/addReac', (req, res) => {
    let AUser = findUserByID(req.body.id)

    AUser.then(function(result) {
        if (result != null) {
            res.render('addReacPage', {user: result});
        }
    });
    
});

app.post("/tryLogin", (req, res) => { 
    var tryUsername = req.body.loginUsername;

    const que = User.find({});

    que.select('username');

    que.exec().then((ans) => {
        for (let i = 0; i<ans.length; i++) {
            if (tryUsername === ans[i].username) {
                res.redirect("/start?_id=" + ans[i]._id.toString());
                return;
            }
        }

        res.redirect("/login?mode=" + 'loginError');

        return;
    });

});

app.post('/tryRegister', (req, res) => {
    var username = req.body.username;
    var repeatUsername = req.body.repeatUsername;

    if (username === repeatUsername) {
        const que = User.find({});

        que.select('username');

        que.exec().then((ans) => {
            for (let i = 0; i<ans.length; i++) {
                if (username === ans[i].username) {
                    res.redirect("/register?mode=" + 'takenError');
                    return;
                }
            }

            const user = new User({
                username: username, 
                reactors: []
            });
            user.save().then((result) => {
                res.redirect('/login');
                return;
            })
        });
    } else {
        res.redirect("/register?mode=" + 'matchError');
        return;
    }

});
// ---------- Post Requests ----------


// ---------- Get Requests ----------
app.get('/register', (req, res) => {
    res.render('registerPage', {mode: req.query.mode});
});

app.get('/login', (req, res) => {
    res.render('loginPage', {mode: req.query.mode});
});

app.get("/start", (req, res) => {
    var logedId = req.query._id;

    if (logedId) {
        User.findById(logedId).then((ans) =>{
            res.render('startPage', {
                username: ans.username,
                reactors: ans.reactors,
                _id: ans._id});
            return;
        })

        return;
    }
    else {
        res.redirect("/login");
        return;
    }
}); 
// ---------- Get Requests ----------

app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
