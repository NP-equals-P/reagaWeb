const express = require("express");
const mongoose = require('mongoose');
const { forEach } = require("lodash");
const { ObjectId } = require("mongodb");
const url = require('node:url');

// ---------- My Functions ----------

async function deleteFullEvent(evntId) {
    Evnt.findByIdAndDelete(evntId).then(async (event) => {
        for (let i=0; i<event.actions.lenght; i+=1) {
            await Acti.findByIdAndDelete(event.actions[i]);
        }

        await Acti.findByIdAndDelete(event.creationAction);
    });
}

async function deleteFullRoutine(routId) {
    Rout.findByIdAndDelete(routId).then(async (routine) => {
        for (let i=0; i<routine.events.lenght; i+=1) {
            await deleteFullEvent(routine.events[i]);
        }

        await deleteFullEvent(routine.creationEvent);

        for (let i=0; i<routine.alarms.length; i+=1) {
            await Alrm.findByIdAndDelete(routine.alarms[i]);
        }

        await Alrm.findByIdAndDelete(routine.creationAlarm);
    });
}

async function deleteFullReactor(reacId) {
    Reac.findByIdAndDelete(reacId).then(async (resultD) => {
        for (let i=0; i<resultD.sensors.length; i+=1) {
            await Sens.findByIdAndDelete(resultD.sensors[i]);
        }
        for (let i=0; i<resultD.actuators.length; i+=1) {
            await Actu.findByIdAndDelete(resultD.actuators[i]);
        }
        for (let i=0; i<resultD.routines.length; i+=1) {
            await deleteFullRoutine(resultD.routines[i]);
        }
    
        await Sens.findByIdAndDelete(resultD.creationSensor);
        await Actu.findByIdAndDelete(resultD.creationActuator);
        await deleteFullRoutine(resultD.creationRoutine);
    });
}

async function createCleanReactor() {
    Acti.create({isCreation: true}).then((action) => {
        Evnt.create({isCreation: true, creationAction: action._id}).then((event) => {
            Alrm.create({isCreation: true}).then((alarm) => {
                Rout.create({isCreation: true, creationEvent: event._id, creationAlarm: alarm._id}).then((rotuine) => {
                    Actu.create({isCreation: true}).then((actuator) => {
                        Sens.create({isCreation: true}).then((sensor) => {
                            Reac.create({isCreation: true, 
                                creationSensor: sensor._id,
                                creationActuator: actuator._id,
                                creationRoutine: rotuine._id}).then((resultR) => {
                                    User.create({username: username, creationReactor: resultR._id}).then((resultU) => {
                                        res.redirect('/login');
                                    });
                                });
                        });
                    });
                });
            });
        });
    });
}

// ---------- My Functions ----------

// ---------- Mongoose Models ----------
const User = require('./models/users');
const Reac = require('./models/reactors');
const Sens = require('./models/sensors');
const Actu = require('./models/actuators');
const Rout = require('./models/routines');
const Evnt = require('./models/events');
const Acti = require('./models/actions');
const Alrm = require('./models/alarms');
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

            Acti.create({isCreation: true}).then((action) => {
                Evnt.create({isCreation: true, creationAction: action._id}).then((event) => {
                    Alrm.create({isCreation: true}).then((alarm) => {
                        Rout.create({isCreation: true, creationEvent: event._id, creationAlarm: alarm._id}).then((rotuine) => {
                            Actu.create({isCreation: true}).then((actuator) => {
                                Sens.create({isCreation: true}).then((sensor) => {
                                    Reac.create({isCreation: true, 
                                        creationSensor: sensor._id,
                                        creationActuator: actuator._id,
                                        creationRoutine: rotuine._id}).then((resultR) => {
                                            User.create({username: username, creationReactor: resultR._id}).then((resultU) => {
                                                res.redirect('/login');
                                            });
                                        });
                                });
                            });
                        });
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

app.get("/deleteUser", (req, res) => {
    var logedId = req.query._id;

    User.findByIdAndDelete(logedId).then(async (user) => {
        for (let i=0; i<user.reactors.length; i+=1) {
            await deleteFullReactor(user.reactors);
        }

        await deleteFullReactor(user.creationReactor);

        res.redirect("/login");
    });
});

app.post("/createSaveReac", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const newName = req.body.newReacName;

    switch (type) {
        case "create":
            Reac.findByIdAndUpdate(reacId, {$set: {isCreation: false, name: newName}}).then(async (reactor) => {
                Alrm.create({isCreation: true}).then((alarm) => {
                    Acti.create({isCreation: true}).then((action) => {
                        Evnt.create({isCreation: true, creationAction: action._id}).then((event) => {
                            Rout.create({isCreation: true, creationEvent: event._id, creationAlarm: alarm._id}).then((routine) => {
                                Sens.create({isCreation: true}).then((sensor) => {
                                    Actu.create({isCreation: true}).then((actuator) => {
                                        Reac.create({isCreation: true, creationSensor: sensor._id, creationActuator: actuator._id, creationRoutine: routine._id}).then((creationReactor) => {
                                            User.findByIdAndUpdate(userId, {
                                                $set: {creationReactor: creationReactor._id},
                                                $push: {reactors: reactor._id}
                                            }).then((user) => {
                                                res.redirect("/start?_id=" + userId);
                                            });
                                        });
                                    });
                                });
                            });
                        });
                    });
                });

                // newCreationReactor = await createCleanReactor();

                // User.findByIdAndUpdate(userId, {
                //     $set: {creationReactor: newCreationReactor._id},
                //     $push: {reactors: reactor._id}
                // }).then((user) => {
                //     res.redirect("/start?_id=" + userId);
                // });
            });
            break;
        default:
            Reac.findByIdAndUpdate(reacId, {$set: {name: newName}}).then((reactor) => {
                switch (type) {
                    case "saveSensors":
                        res.redirect("/addSensor?_id=" + userId + "&reacId=" + reacId);
                        break;
                    case "saveActuators":
                        res.redirect("/addActuator?_id=" + userId + "&reacId=" + reacId);
                        break;
                    case "saveRoutines":
                        res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
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

    Alrm.create({isCreation: true}).then((alarm) => {
        Acti.create({isCreation: true}).then((action) => {
            Evnt.create({isCreation: true, creationAction: action._id}).then((event) => {
                Rout.create({isCreation: true, creationEvent: event._id, creationAlarm: alarm._id}).then((routine) => {
                    Sens.create({isCreation: true}).then((sensor) => {
                        Actu.create({isCreation: true}).then((actuator) => {
                            Reac.create({isCreation: true, creationSensor: sensor._id, creationActuator: actuator._id, creationRoutine: routine._id}).then((creationReac) => {
                                User.findByIdAndUpdate(logedId, {$set: {creationReactor: creationReac._id}}).then(async (user) => {
                                    await deleteFullReactor(reacId);
                                    res.redirect("/addReac?_id=" + logedId);
                                });
                            });
                        });
                    });
                });
            });
        });
    });
});

app.post("/deleteReactor", (req, res) => {
    var reacId = req.body.reacId;
    var logedId = req.body._id;

    User.findByIdAndUpdate(logedId, { $pull: {reactors: reacId}}).then(async (resultU) => {
        await deleteFullReactor(reacId).then((resultD) => {
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
            if (reactor.isCreation) {
                res.redirect("/addReac?_id=" + userId);
            }
            else {
                res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
            }
        });
    });
});

app.post("/createSaveActuator", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const actuId = req.body.actuId;

    const newName = req.body.newActuName;
    const newExit = req.body.newExit;

    switch (type) {
        case "create":
            Actu.findByIdAndUpdate(actuId, {$set: {name: newName, exit: newExit, isCreation: false}}).then((actuator) => {
                Actu.create({isCreation: true}).then((creationActuator) => {
                    Reac.findByIdAndUpdate(reacId, {
                        $set: {
                            creationActuator: creationActuator._id
                        }, 
                        $push: {
                            actuators: actuator._id
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
            Actu.findByIdAndUpdate(actuId, {$set: {name: newName, exit: newExit}}).then((actuator) => {
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

app.post("/dicardActuatorEdit", (req, res) => {
    var userId = req.body._id;
    var reacId = req.body.reacId;
    var actuId = req.body.actuId;

    Actu.create({isCreation: true}).then((creationActu) => {
        Reac.findByIdAndUpdate(reacId, {$set: {creationActuator: creationActu._id}}).then((reac) => {
            Actu.findByIdAndDelete(actuId).then((deletedActu) => {
                res.redirect("/addActuator?_id=" + userId + "&reacId=" + reacId);
            });
        });
    });
});

app.post("/deleteActuator", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var actuId = req.body.actuId;

    Reac.findByIdAndUpdate(reacId, { $pull: {actuators: actuId}}).then((reactor) => {
        Actu.findByIdAndDelete(actuId).then((actuator) => {
            if (reactor.isCreation) {
                res.redirect("/addReac?_id=" + userId);
            }
            else {
                res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
            }
        });
    });
});

app.post("/createSaveRoutine", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;

    const newName = req.body.newRoutName;

    switch (type) {
        case "create":
            Rout.findByIdAndUpdate(routId, {$set: {name: newName, isCreation: false}}).then((routine) => {
                Acti.create({isCreation: true}).then((creationAction) => {
                    Evnt.create({isCreation: true, creationAction: creationAction._id}).then((creationEvent) => {
                        Alrm.create({isCreation: true}).then((creationAlarm) => {
                            Rout.create({isCreation: true, creationEvent: creationEvent._id, creationAlarm: creationAlarm._id}).then((creationRoutine) => {
                                Reac.findByIdAndUpdate(reacId, {
                                    $set: {
                                        creationRoutine: creationRoutine._id
                                    }, 
                                    $push: {
                                        routines: routine._id
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
                    });
                });
            });
            break;
        default:
            Rout.findByIdAndUpdate(routId, {$set: {name: newName}}).then((routine) => {
                switch (type) {
                    case "saveEvents": {
                        res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                        break;
                    }
                    default:
                        Reac.findById(reacId).then((reactor) => {
                            if (reactor.isCreation) {
                                res.redirect("/addReac?_id=" + userId);
                            } else {
                                res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
                            }
                        });
                        break;
                }
            });
            break;
    }
});

app.post("/dicardRoutineEdit", (req, res) => {
    var userId = req.body._id;
    var reacId = req.body.reacId;
    var routId = req.body.routId;
    
    Acti.create({isCreation: true}).then((creationActi) => {
        Evnt.create({isCreation: true, creationAction: creationActi._id}).then((creationEvnt) => {
            Alrm.create({isCreation: true}).then((creationAlrm) => {
                Rout.create({isCreation: true, creationEvent: creationEvnt._id, creationAlarm: creationAlrm._id}).then((creationRout) => {
                    Reac.findByIdAndUpdate(reacId, {$set: {creationRoutine: creationRout._id}}).then(async (reac) => {
                        await deleteFullRoutine(routId);
                        res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
                    });
                }); 
            });
        });
    });

});

app.post("/deleteRoutine", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.routId;

    Reac.findByIdAndUpdate(reacId, { $pull: {routines: routId}}).then(async (reactor) => {
        await deleteFullRoutine(routId);
        if (reactor.isCreation) {
            res.redirect("/addReac?_id=" + userId);
        }
        else {
            res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
        }
    });
});

app.post("/createSaveEvent", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;

    const newName = req.body.newEvntName;
    const newGroup = req.body.group;
    const newStart = req.body.newStart;
    const newDuration = req.body.newDuration;

    switch (type) {
        case "create":
            Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, isCreation: false, type: newGroup, start: newStart, duration: newDuration}}).then((event) => {
                Acti.create({isCreation: true}).then((creationActi) => {
                    Evnt.create({isCreation: true, creationAction: creationActi._id}).then((creationEvnt) => {
                        Rout.findByIdAndUpdate(routId, {
                            $set: {
                                creationEvent: creationEvnt._id
                            }, 
                            $push: {
                                events: event._id
                            }
                        }).then((routine) => {
                            if (routine.isCreation) {
                                res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
                            } else {
                                res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId)
                            }
                        });
                    });
                });
            });
            break;
        default:
            Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, type: newGroup, start: newStart, duration: newDuration}}).then((event) => {
                Rout.findById(routId).then((routine) => {
                    if (routine.isCreation) {
                        res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
                    } else {
                        res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                    }
                });
            });
            break;
    }
});

app.post("/dicardEventEdit", (req, res) => {
    var userId = req.body._id;
    var routId = req.body.routId;
    var reacId = req.body.reacId;
    var evntId = req.body.evntId;


    Acti.create({isCreation: true}).then((creationActi) => {
        Evnt.create({isCreation: true, creationAction: creationActi._id}).then((creationEvnt) => {
            Rout.findByIdAndUpdate(routId, {$set: {creationEvent: creationEvnt._id}}).then(async (routine) => {
                await deleteFullEvent(evntId)
                res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
            });
        });
    });
});

app.post("/deleteEvent", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.routId;
    var evntId = req.body.evntId;

    Rout.findByIdAndUpdate(routId, { $pull: {events: evntId}}).then(async (routine) => {
        await deleteFullEvent(evntId);
        if (routine.isCreation) {
            res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
        }
        else {
            res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
        }
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
            var newActuList = [];
            var newRoutList = [];
            var aux;

            for (let i=0; i<reactor.sensors.length; i+=1) {
                aux = await Sens.findById(reactor.sensors[i]._id);
                newSensList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reactor.actuators.length; i+=1) {
                aux = await Actu.findById(reactor.actuators[i]._id);
                newActuList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reactor.routines.length; i+=1) {
                aux = await Rout.findById(reactor.routines[i]._id);
                newRoutList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            res.render('reacSettingsPage', {
                username: user.username,
                _id: logedId,
                data: {reactor: reactor, sensors: newSensList, actuators: newActuList, routines: newRoutList}
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
            var newActuList = [];
            var newRoutList = [];
            var aux;

            for (let i=0; i<reac.sensors.length; i+=1) {
                aux = await Sens.findById(reac.sensors[i]._id);
                newSensList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reac.actuators.length; i+=1) {
                aux = await Actu.findById(reac.actuators[i]._id);
                newActuList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reac.routines.length; i+=1) {
                aux = await Rout.findById(reac.routines[i]._id);
                newRoutList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            res.render('reacSettingsPage', {
                username: user.username,
                _id: logedId,
                data: {reactor: reac, sensors: newSensList, actuators: newActuList, routines: newRoutList}
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

app.get("/addActuator", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Actu.findById(reac.creationActuator).then((actuator) => {
                res.render("actuSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: actuator
                });
            });
        });
    });
});

app.get("/editActuator", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;
    var actuId = req.query.actuId;

    User.findById(userId).then((user) => {
        Actu.findById(actuId).then((actuator) => {
            res.render("actuSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: actuator
            });
        });
    });
});

app.get("/addRoutine", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Rout.findById(reac.creationRoutine).then((routine) => {
                res.render("routSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: routine
                });
            });
        });
    });
});

app.get("/editRoutine", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;
    var routId = req.query.routId;

    User.findById(userId).then((user) => {
        Rout.findById(routId).then((routine) => {
            res.render("routSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: routine
            });
        });
    });
});

app.get("/addEvent", (req, res) => {
    var userId = req.query._id;
    var routId = req.query.routId;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Rout.findById(routId).then((routine) => {
            Evnt.findById(routine.creationEvent).then((event) => {
                res.render("evntSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    routId: routId,
                    data: event
                });
            });
        });
    });
});

// ---------- Get Requests ----------


app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
