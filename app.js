const express = require("express");
const mongoose = require('mongoose');
const { forEach } = require("lodash");
const { ObjectId } = require("mongodb");
const url = require('node:url');

// ---------- My Functions ----------

// ---------- My Functions ----------

// ---------- Mongoose Models ----------
const User = require('./models/users');
const Reac = require('./models/reactors');
const Sens = require('./models/sensors');
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
            Sens.create({isCreation: true}).then((sensor) => {
                Reac.create({isCreation: true, creationSensor: sensor._id}).then((resultR) => {
                    User.create({username: username, creationReactor: resultR._id}).then((resultU) => {
                        res.redirect('/login');
                    });
                });
            });
        });
    } else {
        res.redirect("/register?mode=" + 'matchError');
    }
});

app.post("/tryLogin", (req, res) => { 
    var tryUsername = req.body.loginUsername;

    const que = User.find({});

    que.select('username');

    que.exec().then((ans) => {
        for (let i = 0; i<ans.length; i++) {
            if (tryUsername === ans[i].username) {
                res.redirect("/start?_id=" + ans[i]._id);
                return;
            }
        }

        res.redirect("/login?mode=" + 'loginError');
    });
});

app.post("/createSaveReac", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const newName = req.body.newReacName;

    switch (type) {
        case "create":
            Reac.findByIdAndUpdate(reacId, {$set: {isCreation: false, name: newName}}).then((reactor) => {
                Sens.create({isCreation: true}).then((sensor) => {
                    Reac.create({isCreation: true, creationSensor: sensor._id}).then((creationReactor) => {
                        User.findByIdAndUpdate(userId, {
                            $set: {creationReactor: creationReactor._id},
                            $push: {reactors: reactor._id}
                        }).then((user) => {
                            res.redirect("/start?_id=" + userId);
                        });
                    });
                });
            });
            break;
        default:
            Reac.findByIdAndUpdate(reacId, {$set: {name: newName}}).then((reactor) => {
                switch (type) {
                    case "saveSensors":
                        res.redirect("/addSensor?_id=" + userId + "&reacId=" + reacId);
                        break;
                    default:
                        if (reactor.isCreation) {
                            res.redirect("/start?_id=" + userId);
                        } else {
                            res.redirect("/reacView?_id=" + userId + "&reacId=" + reacId);
                        }
                }
            });
    }
});

app.post("/dicardReactorEdit", (req, res) => {
    var logedId = req.body._id;
    var reacId = req.body.reacId;

    Reac.create({isCreation: true}).then((creationReac) => {
        User.findByIdAndUpdate(logedId, {$set: {creationReactor: creationReac._id}}).then((user) => {
            Reac.findByIdAndDelete(reacId).then((deletedReac) => {
                console.log(deletedReac);
                res.redirect("/addReac?_id=" + logedId);
            });
        });
    });
});

app.post("/deleteReactor", (req, res) => {
    var reacId = req.body.reacId;
    var logedId = req.body._id;

    User.findByIdAndUpdate(logedId, { $pull: {reactors: reacId}}).then((resultU) => {
        Reac.findByIdAndDelete(reacId).then((resultD) => {
            res.redirect("/start?_id=" + logedId);
        });
    });
});

app.post("/createSaveSensor", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const sensId = req.body.sensId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;

    switch (type) {
        case "create":
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit, isCreation: false}}).then((sensor) => {
                Sens.create({isCreation: true}).then((creationSensor) => {
                    Reac.findByIdAndUpdate(reacId, {
                        $set: {
                            creationSensor: creationSensor._id
                        }, 
                        $push: {
                            sensors: sensor._id
                        }
                    }).then((reactor) => {
                        if (reactor.isCreation) {
                            res.redirect("/addReac?_id=" + userId);
                        } else {
                            res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId)
                        }
                    });
                });
            });
            break;
        default:
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit}}).then((sensor) => {
                Reac.findById(reacId).then((reactor) => {
                    if (reactor.isCreation) {
                        res.redirect("/addReac?_id=" + userId);
                    } else {
                        res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
                    }
                });
            });
            break;
    }
});

app.post("/dicardSensorEdit", (req, res) => {
    var userId = req.body._id;
    var reacId = req.body.reacId;
    var sensId = req.body.sensId;

    Sens.create({isCreation: true}).then((creationSens) => {
        Reac.findByIdAndUpdate(reacId, {$set: {creationSensor: creationSens._id}}).then((reac) => {
            Sens.findByIdAndDelete(sensId).then((deletedSens) => {
                res.redirect("/addSensor?_id=" + userId + "&reacId=" + reacId);
            });
        });
    });
});

app.post("/deleteSensor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var sensId = req.body.sensId;

    Reac.findByIdAndUpdate(reacId, { $pull: {sensors: sensId}}).then((reactor) => {
        Sens.findByIdAndDelete(sensId).then((sensor) => {
            res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
        });
    });
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

    User.findById(logedId).then(async (ans) => {

        var newList = [];
        var aux;
    
        for (let i=0; i<ans.reactors.length; i+=1) {
            aux = await Reac.findById(ans.reactors[i]._id);
            newList.push({
                name: aux.name,
                _id: aux._id
            });
        }

        res.render('startPage', {
            username: ans.username,
            reactors: newList,
            _id: logedId});
    })
});

app.get("/addReac", (req, res) => {
    var logedId = req.query._id;

    User.findById(logedId).then((user) => {
        Reac.findById(user.creationReactor).then(async (reactor) => {

            var newSensList = [];
            var aux;

            for (let i=0; i<reactor.sensors.length; i+=1) {
                aux = await Sens.findById(reactor.sensors[i]._id);
                newSensList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            res.render('addReacPage', {
                username: user.username,
                _id: logedId,
                data: {reactor: reactor, sensors: newSensList}
            });
        });
    });
});

app.get("/editReac", (req, res) => {
    var logedId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(logedId).then((user) => {
        Reac.findById(reacId).then(async (reac) => {

            var newSensList = [];
            var aux;

            for (let i=0; i<reac.sensors.length; i+=1) {
                aux = await Sens.findById(reac.sensors[i]._id);
                newSensList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            res.render('addReacPage', {
                username: user.username,
                _id: logedId,
                data: {reactor: reac, sensors: newSensList}
            });
        });
    });
});

app.get("/reacView", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((resultU) => {
        Reac.findById(reacId).then((resultR) => {
            res.render("reacView", {
                username: resultU.username,
                _id: userId,
                data: resultR
            })
        });
    });
});

app.get("/addSensor", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Sens.findById(reac.creationSensor).then((sensor) => {
                res.render("sensSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: sensor
                });
            });
        });
    });
});

app.get("/editSensor", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;
    var sensId = req.query.sensId;

    User.findById(userId).then((user) => {
        Sens.findById(sensId).then((sensor) => {
            res.render("sensSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: sensor
            });
        });
    });
});
// ---------- Get Requests ----------


app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
