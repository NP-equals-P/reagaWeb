const express = require("express");
const mongoose = require('mongoose');
const mainRouter = require("./controllers");

// ---------- My Functions ----------
async function checkValidAction(evntId, newStart, newEnd, newComponent, actiId) {
    const myEvent = await Evnt.findById(evntId);
    var action;
    var actionEnd;

    for (let i=0; i<myEvent.actions.length; i+=1) {
        if (!(actiId === myEvent.actions[i].toString())) {
            action = await Acti.findById(myEvent.actions[i]);
            actionEnd = action.start + action.end;
            if (newComponent.toString() === action.component.toString()) {
                if (!(newEnd <= action.start) && !(newStart >= actionEnd)) {
                    return false;
                }
            }
        }
    }

    return true;
}

async function checkValidEvent(routId, newStart, newEnd, evntId) {
    const myRout = await Rout.findById(routId);
    const newEvent = await Evnt.findById(evntId);

    var eventEnd;
    var event;

    for (let i=0; i<myRout.events.length; i+=1) {
        event = await Evnt.findById(myRout.events[i]);

        if (!(event._id.toString() === evntId)) {
            if (event.type === "normal") {
                eventEnd = event.end;
        
                if (!(newEnd <= event.start) && !(newStart >= eventEnd)) {
                    for (let j=0; j<newEvent.actions.length; j+=1) {
                        for (let k=0; k<event.actions.length; k+=1) {
                            var newEventActi = await Acti.findById(newEvent.actions[j])
                            var eventActi = await Acti.findById(event.actions[k])
                            if (newEventActi.component.toString() === eventActi.component.toString()) {
                                return false
                            }
                        }
                    }
                }
            }
        }
    }

    return true;
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
const CoMo = require('./models/componentsModels');
const Func = require('./models/functions');
// ---------- Mongoose Models ----------

// ---------- Configs ----------
const app = express();

app.use(express.urlencoded({ extended: true })); //TODO: Danger zone! I don't know what these lines do.
app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.json());

app.use("/", mainRouter); //Routing
// ---------- Configs ----------

// ---------- Connect to DB ----------
//const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

const urI = "mongodb+srv://ito:senhaito@cluster0.2muvzud.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(urI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));
// ---------- Connect to DB ----------

// ---------- Post Requests ----------

app.post("/createSaveAlarm", (req, res) => {
    const type = req.body.type;
    const alrmId = req.body.alrmId;
    const routId = req.body.routId;
    const userId = req.body._id;
    const reacId = req.body.reacId;

    const newTitle = req.body.newTitle;
    const newMsg = req.body.newMsg;
    const newLimit = req.body.newLimit;
    const alarmType = req.body.alarmType;
    var triggerStatus = req.body.triggersStatus;
    const triggerEvent = req.body.triggerEvent;
    const sensor = req.body.newSensor;

    if (triggerStatus === "on") {
        triggerStatus = true;
    } else {
        triggerStatus = false;
    }
    
    switch (type) {
        case "create":
            Alrm.findByIdAndUpdate(alrmId, {$set: {
                title: newTitle,
                message: newMsg,
                limit: newLimit,
                type: alarmType,
                triggers: triggerStatus,
                triggerEvent: triggerEvent,
                sensor: sensor,
                isCreation: false
            }}).then((alarm) => {
                Alrm.create({isCreation: true}).then((creationAlrm) => {
                    Rout.findByIdAndUpdate(routId, {
                        $set: {
                            creationAlarm: creationAlrm._id
                        }, 
                        $push: {
                            alarms: alarm._id
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
            break;
        default:
            Alrm.findByIdAndUpdate(alrmId, {$set: {
                title: newTitle,
                message: newMsg,
                limit: newLimit,
                type: alarmType,
                triggers: triggerStatus,
                triggerEvent: triggerEvent,
                sensor: sensor
            }}).then((alarm) => {
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

app.post("/discardAlarmEdit", (req, res) => {
    var userId = req.body._id;
    var routId = req.body.routId;
    var reacId = req.body.reacId;
    var alrmId = req.body.alrmId;

    Alrm.create({isCreation: true}).then((creationAlrm) => {
        Alrm.findByIdAndDelete(alrmId).then((deleteAlrm) => {
            Rout.findByIdAndUpdate(routId, {$set: {creationAlarm: creationAlrm._id}}).then((routine) => {
                res.redirect("/addAlarm?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
            });
        });
    });
});

app.post("/deleteAlarm", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.routId;
    var alrmId = req.body.alrmId;

    Rout.findByIdAndUpdate(routId, { $pull: {alarms: alrmId}}).then(async (routine) => {
        Alrm.findByIdAndDelete(alrmId).then((alarm) => {
            if (routine.isCreation) {
                res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
            }
            else {
                res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
            }
        });
    });
});

app.post("/createSaveAction", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;
    const actiId = req.body.actiId;

    const newName = req.body.newActiName;
    const newGroup = req.body.group;
    const newStart = req.body.newStart;
    const newEnd = req.body.newEnd;
    const newComponent = req.body.newComponent;
    const newFunction = req.body.newFunction;

    var metaBodySize = 12;
    var count = 1;
    var varList = [];

    for (key in req.body) {
        if (count > metaBodySize) {
            varList.push(req.body[key])
        }

        count += 1;
    }

    switch (type) {
        case "create":
            checkValidAction(evntId, newStart, newEnd, newComponent).then((result) => {
                if (result) {
                    Acti.findByIdAndUpdate(actiId, {$set: {isCreation: false, name: newName, type: newGroup, start: newStart, end: newEnd, component: newComponent, function: newFunction, varList: varList}}).then((action) => {
                        Acti.create({isCreation: true}).then((creationActi) => {
                            Evnt.findByIdAndUpdate(evntId, {
                                $set: {
                                    creationAction: creationActi._id
                                }, 
                                $push: {
                                    actions: action._id
                                }
                            }).then((event) => {
                                if (event.isCreation) {
                                    res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                                } else {
                                    res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
                                }
                            });
                        });
                    });
                } else {
                    Acti.findByIdAndUpdate(actiId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd, component: newComponent, varList: varList}}).then((action) => {
                        if (action.isCreation) {
                            res.redirect("/addAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&mode=intervalError");
                        } else {
                            res.redirect("/editAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&actiId=" + actiId+ "&mode=intervalError");
                        }
                    });
                }
            }); 
            break;
        default:
            Acti.findById(actiId).then((testAdd) => {
                if (testAdd.isCreation) {
                    Acti.findByIdAndUpdate(actiId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd, component: newComponent, function: newFunction, varList: varList}}).then((action) => {
                        Evnt.findById(evntId).then((event) => {
                            if (event.isCreation) {
                                res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                            } else {
                                res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
                            }
                        });
                    });
                } else {
                    checkValidAction(evntId, newStart, newEnd, newComponent, actiId).then((result) => {
                        if (result) {
                            Acti.findByIdAndUpdate(actiId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd, component: newComponent, function: newFunction, varList: varList}}).then((action) => {
                                Evnt.findById(evntId).then((event) => {
                                    if (event.isCreation) {
                                        res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                                    } else {
                                        res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
                                    }
                                });
                            });
                        } else {
                            Acti.findByIdAndUpdate(actiId, {$set: {name: newName, type: newGroup, component: newComponent, function: newFunction, varList: varList}}).then((action) => {
                                res.redirect("/editAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&actiId=" + actiId + "&mode=intervalError")
                            });
                        }
                    });
                }
            });

            break;
    }
});

app.post("/dicardActionEdit", (req, res) => {
    var userId = req.body._id;
    var routId = req.body.routId;
    var reacId = req.body.reacId;
    var evntId = req.body.evntId;
    var actiId = req.body.actiId;


    Acti.create({isCreation: true}).then((creationActi) => {
        Evnt.findByIdAndUpdate(evntId, {$set: {creationAction: creationActi._id}}).then(async (event) => {
            Acti.findByIdAndDelete(actiId).then((deletedActi) => {
                res.redirect("/addAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
            });
        });
    });
});

app.post("/deleteAction", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.routId;
    var evntId = req.body.evntId;
    var actiId = req.body.actiId;

    Evnt.findByIdAndUpdate(evntId, { $pull: {actions: actiId}}).then(async (event) => {
        Acti.findByIdAndDelete(actiId).then((action) => {
            if (event.isCreation) {
                res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
            }
            else {
                res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
            }
        });
    });
});

app.post("/callEsporadicEvent", (req, res) => {
    var userId = req.body._id;
    var evntId = req.body.evntId;
    var reacId = req.body.reacId;
    
    Evnt.findByIdAndUpdate(evntId, {$set: {inQueue: true}}).then((event) => {
        res.redirect("/reacView?_id=" + userId + "&reacId=" + reacId)
    });
});
// ---------- Post Requests ----------


// ---------- Get Requests ----------
app.get("/addAction", (req, res) => {
    var userId = req.query._id;
    var evntId = req.query.evntId;
    var routId = req.query.routId;
    var reacId = req.query.reacId;
    var mode  = req.query.mode;

    User.findById(userId).then((user) => {
        Evnt.findById(evntId).then((event) => {
            Acti.findById(event.creationAction).then((action) => {
                Reac.findById(reacId).then(async (reactor) => {
                    var newSensList = [];
                    var newActuList = [];

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

                    res.render("actiSettingsPage", {
                        username: user.username,
                        _id: userId,
                        reacId: reacId,
                        routId: routId,
                        evntId: evntId,
                        data: action,
                        sensors: newSensList,
                        actuators: newActuList,
                        mode: mode
                    });
                });
            });
        });
    });
});

app.get("/editAction", (req, res) => {
    var userId = req.query._id;
    var routId = req.query.routId;
    var reacId = req.query.reacId;
    var evntId = req.query.evntId;
    var actiId = req.query.actiId;
    var mode = req.query.mode;

    User.findById(userId).then((user) => {
        Acti.findById(actiId).then((action) => {
            Reac.findById(reacId).then(async (reactor) => {
                var newSensList = [];
                var newActuList = [];
    
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
                res.render("actiSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    routId: routId,
                    evntId: evntId,
                    data: action,
                    sensors: newSensList,
                    actuators: newActuList,
                    mode: mode
                });
            });
        });
    });
});

app.get("/components", async (req, res) => {
    var reacId = req.query.reacId;
    var aux;

    var sensorList = [];
    var actuatorList = [];

    Reac.findById(reacId).then(async (reactor) => {
        for (let i=0; i<reactor.sensors.length; i+=1) {
            aux = await Sens.findById(reactor.sensors[i]);
            sensorList.push({
                name: aux.name,
                _id: aux._id,
                model: aux.model
            })
        }

        for (let i=0; i<reactor.actuators.length; i+=1) {
            aux = await Actu.findById(reactor.actuators[i]);
            actuatorList.push({
                name: aux.name,
                _id: aux._id,
                model: aux.model
            })
        }

        var data = {
            sensors: sensorList,
            actuators: actuatorList
        }

        res.end(JSON.stringify(data));
    });
});

app.get("/modelFunctions", (req, res) => {
    var compId = req.query.compId;
    var type = req.query.type;
    var aux;
    var funcList = [];

    var mode;

    if (type === "sensor") {
        mode = Sens;
    } else {
        mode = Actu;
    }

    mode.findById(compId).then((component) => {
        CoMo.findById(component.model).then(async (model) => {
            for (let i=0; i<model.functions.length; i+=1) {
                aux = await Func.findById(model.functions[i]);
                funcList.push({
                    name: aux.name,
                    _id: aux._id
                })
            }
    
            res.end(JSON.stringify(funcList));
        });
    });


});

app.get("/functionHTML", (req, res) => {
    var funcId = req.query.funcId;
    var aux;

    Func.findById(funcId).then(async (func) => {

        aux = {
            html: func.html
        }

        res.end(JSON.stringify(aux));
    });
});

app.get("/teste", (req, res) => {

    console.log(req.query)

    return;
});
// ---------- Get Requests ----------

//App requests
app.get('/login', (req, res) => {
    res.render('loginPage', {mode: req.query.mode});
});

app.get('/register', (req, res) => {
    res.render('registerPage', {mode: req.query.mode});
});

app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
