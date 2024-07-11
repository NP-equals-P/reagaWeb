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

const Reac = require('./models/reactors');
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

            const registerSensorEdit = {
                name: "",
                exit: "",
                model: ""
            };

            const registerActuatorEdit = {
                name: "",
                exit: "",
                model: ""
            };

            const registerReactorEdit = {
                name: "",
                sensorCrationEdit: registerSensorEdit,
                actuatorCreationEdit: registerActuatorEdit
            };

            User.create({
                username: username, reactors: [], reactorCreationEdit: registerReactorEdit}).then((result) => {
                res.redirect('/login');
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

app.post("/createChangeSaveReac", (req, res) => {
    const mode = req.body.mode;
    const type = req.body.type;
    const userId = req.body._id;
    const newName = req.body.newReacName;

    switch (mode) {
        case "creation": 
            switch (type) {
                case "create":
                    User.findById(userId).then((result) => {
                        const newSensorCreationEdit = {
                            name: "",
                            exit: "",
                            model: ""
                        }
        
                        const newActuatorCreationEdit = {
                            name: "",
                            exit: "",
                            model: ""
                        }
        
                        const newEdit = {
                            name: newName,
                            sensors: result.reactorCreationEdit.sensors,
                            actuators: result.reactorCreationEdit.actuators,
                            sensorCrationEdit: newSensorCreationEdit,
                            actuatorCreationEdit: newActuatorCreationEdit
                        }
        
                        Reac.create({
                            name: newName,
                            sensors: result.reactorCreationEdit.sensors,
                            actuators: result.reactorCreationEdit.actuators,
                            edit: newEdit
                        }).then((resultR) => {
                            result.reactorCreationEdit.name = "";
                            result.reactorCreationEdit.sensors = [];
                            result.reactorCreationEdit.actuators = [];
                            result.reactorCreationEdit.sensorCrationEdit = newSensorCreationEdit;
                            result.reactorCreationEdit.actuatorCreationEdit = newActuatorCreationEdit;
        
                            result.save().then((resultU) => {
                                User.findByIdAndUpdate(userId, {$push: {reactors: resultR._id}}).then((resultF) => {
                                    res.redirect("/start?_id=" + userId);
                                });
                            });
                        });
                    });
                    break;
                default:
                    User.findById(userId).then((result) => {
                        result.reactorCreationEdit.name = newName;
                        result.save().then((resultS) => {
                            switch (type) {
                                case "saveSensors":
                                    res.redirect("/addSensor?_id=" + userId);
                                    break;
                                default:
                                    res.redirect("/start?_id=" + userId);
                            }
                        });
                    });
            }
            break;
        default:
            const reacId = req.body.reacId;

            switch (type) {
                case "concrete":
                    Reac.findById(reacId).then((resultR) => {
                        resultR.name = newName;
                        resultR.edit.name = newName;
                        resultR.sensors = resultR.edit.sensors;
                        resultR.actuators = resultR.edit.actuators;
                        resultR.save().then((resultS) => {
                            res.redirect("/reacView?_id=" + userId + "&reacId=" + reacId);
                        });
                    });
                    break;
                default:
                    Reac.findById(reacId).then((resultR) => {
                        resultR.edit.name = newName;
                        resultR.save().then((resultS) => {
                            switch (type) {
                                case "saveSensors":
                                    res.redirect("/addSensor?_id=" + userId);
                                    break;
                                default:
                                    res.redirect("/reacView?_id=" + userId + "&reacId=" + reacId);
                            }
                        });
                    });
            }
    }
});

app.post("/deleteReactor", (req, res) => {
    var reacId = req.body.reacId;
    var logedId = req.body._id;

    User.findByIdAndUpdate(logedId, { $pull: {reactors: new ObjectId(reacId)}}).then((resultU) => {
        Reac.findByIdAndDelete(reacId).then((resultD) => {
            res.redirect("/start?_id=" + logedId);
        });
    });
});

app.post("/dicardReactorEdit", (req, res) => {
    var logedId = req.body._id;
    var reacId = req.body.reacId;
    var mode = req.body.mode;

    if (mode === "edition") {
        Reac.findById(reacId).then((result) => {
            result.edit.name = result.name;
            result.edit.sensors = result.sensors;
            result.edit.actuators = result.actuators;
            result.save().then((resultS) => {
                res.redirect("/editReac?_id=" + logedId + "&reacId=" + reacId);
            });
        });
    } else {
        User.findById(logedId).then((result) => {
            result.reactorCreationEdit.name = "";
            result.reactorCreationEdit.sensors = [];
            result.reactorCreationEdit.actuators = [];
            result.save().then((resultS) => {
                res.redirect("/addReac?_id=" + logedId);
            });
        });
    }

});

app.post("/createChangeSaveSensor", (req, res) => {

});
// ---------- Post Requests ----------


// ---------- Get Requests ----------
app.get('/login', (req, res) => {
    res.render('loginPage', {mode: req.query.mode});
});

app.get('/register', (req, res) => {
    res.render('registerPage', {mode: req.query.mode});
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
            _id: ans._id});
    })
});

app.get("/addReac", (req, res) => {
    var logedId = req.query._id;

    User.findById(logedId).then((ans) => {
        res.render('reacSettingsPage', {
            username: ans.username,
            _id: ans._id,
            reacId: null,
            edit: ans.reactorCreationEdit,
            mode: "creation"
        });
    })
});

app.get("/reacView", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((resultU) => {
        Reac.findById(reacId).then((resultR) => {
            res.render("reacView", {
                username: resultU.username,
                _id: userId,
                reac: resultR
            })
        });
    });

});

app.get("/editReac", (req, res) => {
    var logedId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(logedId).then((user) => {
        for (let i=0; i < user.reactors.length; i+=1) {
            if (reacId === user.reactors[i].toString()) {
                Reac.findById(user.reactors[i]).then((reac) => {
                    res.render('reacSettingsPage', {
                        username: user.username,
                        _id: logedId,
                        reacId: reacId,
                        edit: reac.edit,
                        mode: "edition"
                    });
                });
                break;
            }
        }
    });
});

app.get("/addSensor", (req, res) => {
    var logedId = req.query._id;
    var mode = req.query.mode;

    switch (mode) {
        case "creation":
                User.findById(logedId).then((resultU) => {
                    res.render("sensSettingsPage", {
                        username: resultU.username,
                        _id: logedId,
                        sensorData: resultU.reactorCreationEdit.sensorCrationEdit
                    });
                });
            break;
        default:
            break;
    }

    res.render("addSensPage", {username: "A", _id: logedId});
});
// ---------- Get Requests ----------


app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
