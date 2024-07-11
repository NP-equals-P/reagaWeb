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
                res.redirect("/start?_id=" + ans[i]._id.toString());
                return;
            }
        }

        res.redirect("/login?mode=" + 'loginError');
    });
});

app.post("/dicardCreationEdit", (req, res) => {
    var logedId = req.body._id;
    
    const cleanSensorCreationEdit = {
        name: "",
        exit: "",
        model: ""
    }

    const cleanActuatorCreationEdit = {
        name: "",
        exit: "",
        model: ""
    }

    const cleanCreationEdit = {
        name: "",
        sensors: [],
        actuators: [],
        sensorCrationEdit: cleanSensorCreationEdit,
        actuatorCreationEdit: cleanActuatorCreationEdit
    }

    User.findByIdAndUpdate(logedId, {$set: {reactorCreationEdit: cleanCreationEdit}}).then((result) => {
        res.redirect("/start?_id=" + logedId);
    });

});

app.post("/createOrSaveSensorUser", (req, res) => {
    const type = req.body.type;

    switch (type) {
        case "create":
            break;
        default:
            User.findById(_id).then((result) => {
                result.reactorCreationEdit.name = newName;

            });
    }
});


app.post("/createOrSave", (req, res) => {
    const type = req.body.type;
    const _id = req.body._id;
    const newName = req.body.newReacName;

    switch (type) {
        case "create":
            
            User.findById(_id).then((result) => {
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
                    name: result.reactorCreationEdit.name,
                    sensors: result.reactorCreationEdit.sensors,
                    actuators: result.reactorCreationEdit.actuators,
                    sensorCrationEdit: newSensorCreationEdit,
                    actuatorCreationEdit: newActuatorCreationEdit
                }

                Reac.create({
                    name: result.reactorCreationEdit.name,
                    sensors: result.reactorCreationEdit.sensors,
                    actuators: result.reactorCreationEdit.actuators,
                    edit: newEdit
                }).then((resultR) => {
                    result.reactorCreationEdit.name = "";
                    result.reactorCreationEdit.sensors = [];
                    result.reactorCreationEdit.sensorCrationEdit = newSensorCreationEdit;
                    result.reactorCreationEdit.actuatorCreationEdit = newActuatorCreationEdit;

                    result.save().then((resultU) => {
                        User.findByIdAndUpdate(_id, {$push: {reactors: resultR._id}}).then((resultF) => {
                            res.redirect("/start?_id=" + _id);
                        });
                    });
                });
            });

            break;
        case "realize": 
            console.log("Realize");
            break;
        default:
            User.findById(_id).then((result) => {
                result.reactorCreationEdit.name = newName;
                result.save().then((resultS) => {
                    switch (type) {
                        case "saveRedSensors":
                            res.redirect("/addSensor");
                            break;
                        case "saveRedActuators":
                            // res.redirect("/actuator");
                            break;
                        default:
                            res.redirect("/start?_id=" + _id);
                    }
                });
            });
    }   
});




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

app.post("/discardNewReacEdit", (req, res) => {
    console.log("CABO");
});

app.post("/deleteReac", (req, res) => {
    var reacId = req.body.reacId;
    var logedId = req.body._id;

    Reac.findByIdAndDelete(reacId).then((result) => {
        Reac.findByIdAndDelete(result.edit).then((resultE) => {
            User.findByIdAndUpdate(logedId, { $pull: {reactors: new ObjectId(reacId)}}).then((resultU) => {
                res.redirect("/start?_id=" + logedId);
            });
        });
    })
});

app.post("/dicardEdit", (req, res) => {
    var logedId = req.body._id;
    var reacId = req.body.reacId;

    if (reacId) {
        Reac.findById(reacId).then((result) => {
            Reac.findByIdAndUpdate(result.edit, {$set: {name: result.name}}).then((resultE) => {
                res.redirect("/editReac?_id=" + logedId + "&reacId=" + reacId);
            });
        });
    } else {
        User.findById(logedId).then((result) => {
            Reac.findByIdAndUpdate(result.reacEdit, {$set: {name: ""}}).then((resultM) => {
                res.redirect("/addReac?_id=" + logedId);
            });
        });
    }

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

    if (logedId) {
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
    }
    else {
        res.redirect("/login");
    }
});

app.get("/addSensor", (req, res) => {
    res.render("addSensPage", {username: "AQUi"});
});


app.get("/addReac", (req, res) => {
    var logedId = req.query._id;
    var mode = req.query.mode;

    if (logedId) {
        User.findById(logedId).then((ans) => {
            res.render('addReacPage', {
                username: ans.username,
                _id: ans._id,
                edit: ans.reactorCreationEdit,
                mode: mode
            });
        })
    }
    else {
        console.log(logedId + "AAA");
        res.redirect("/login");
    }
});

app.get("/editReac", (req, res) => {
    var logedId = req.query._id;
    var reacId = req.query.reacId

    if (logedId && reacId) {
        User.findById(logedId).then((ans) =>{
            Reac.findById(reacId).then((ansR) => {
                Reac.findById(ansR.edit).then((ansE) => {
                    res.render('addReacPage', {
                        username: ans.username,
                        _id: ans._id,
                        reac: ansR,
                        data: ansE,
                        reacId: ansR._id,
                        editId: ansR.edit,
                        isCreationEdit: false
                    });
                });
                return;
            })
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
