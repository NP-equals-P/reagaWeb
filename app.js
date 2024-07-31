const express = require("express");
const mongoose = require('mongoose');
const { forEach } = require("lodash");
const { ObjectId } = require("mongodb");
const url = require('node:url');
const mainRouter = require("./controllers");

// ---------- My Functions ----------
 
async function createNewRoutine() {

    const alarm = await Alrm.create({isCreation: true});

    const event = await createNewEvent();

    const routine = await Rout.create({
        isCreation: true,
        creationAlarm: alarm._id,
        creationEvent: event._id
    });

    return routine;
}

async function createNewEvent() {

    const action = await Acti.create({isCreation: true});

    const event = await Evnt.create({
        isCreation: true,
        creationAction: action._id,
        start: 0,
        end: 1
    });

    return event;
}

async function deleteFullEvent(evntId) {
    Evnt.findByIdAndDelete(evntId).then(async (event) => {
        for (let i=0; i<event.actions.length; i+=1) {
            await Acti.findByIdAndDelete(event.actions[i]);
        }

        await Acti.findByIdAndDelete(event.creationAction);
    });
}

async function deleteFullRoutine(routId) {
    Rout.findByIdAndDelete(routId).then(async (routine) => {
        for (let i=0; i<routine.events.length; i+=1) {
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

async function findActionsByEvent(myEvent) {
    var actionList = [];

    for (let i=0; i<myEvent.actions.length; i+=1) {

        aux = await Acti.findById(myEvent.actions[i]._id);

        actionList.push(aux);
    }

    return actionList
}

function findEventMinDuration(actionList) {

    var max = 0;

    for (let i=0; i<actionList.length; i+=1) {

        if (actionList[i].end > max) {

            max = actionList[i].end;
        }
    }

    return max
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



app.post("/createSaveReac", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const newName = req.body.newReacName;

    switch (type) {
        case "create":
            Reac.findByIdAndUpdate(reacId, {$set: {isCreation: false, name: newName, isActive: false, isPaused: false}}).then(async (reactor) => {
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

app.post("/activateReactor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.activeRoutine;

    Reac.findByIdAndUpdate(reacId, {$set: {isActive: true, activeRoutine: routId, isPaused: false}}).then((reactor) => {
        res.redirect("/reacView?&_id=" + userId + "&reacId=" + reacId)
    })
});

app.post("/deactivateReactor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;

    Reac.findByIdAndUpdate(reacId, {$set: {isActive: false}}).then((reactor) => {
        res.redirect("/reacView?&_id=" + userId + "&reacId=" + reacId)
    })
});

app.post("/pauseReactor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;

    Reac.findByIdAndUpdate(reacId, {$set: {isPaused: true}}).then((reactor) => {
        res.redirect("/reacView?&_id=" + userId + "&reacId=" + reacId)
    })
});

app.post("/unpauseReactor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;

    Reac.findByIdAndUpdate(reacId, {$set: {isPaused: false}}).then((reactor) => {
        res.redirect("/reacView?&_id=" + userId + "&reacId=" + reacId)
    })
});

app.post("/createSaveSensor", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const sensId = req.body.sensId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;
    const modelId = req.body.modelId;

    switch (type) {
        case "create":
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit, isCreation: false, model: modelId}}).then((sensor) => {
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
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit, model: modelId}}).then((sensor) => {
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
    const modlId = req.body.modlId;

    const newName = req.body.newActuName;
    const newExit = req.body.newExit;

    switch (type) {
        case "create":
            Actu.findByIdAndUpdate(actuId, {$set: {name: newName, exit: newExit, isCreation: false, model: modlId}}).then((actuator) => {
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
                    case "saveEvents": 
                        res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                        break;
                    case "saveAlarms":
                        res.redirect("/addAlarm?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                        break;
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

app.post("/createSaveEvent", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;

    const newName = req.body.newEvntName;
    const newGroup = req.body.group;
    const newStart = req.body.newStart;
    const newEnd = req.body.newEnd;

    switch (type) {
        case "create":
            checkValidEvent(routId, newStart, newEnd, evntId).then((result) => {
                if (result) {
                    Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, isCreation: false, type: newGroup, start: newStart, end: newEnd, inQueue: false}}).then((event) => {
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
                } else {
                    Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd}}).then((event) => {
                        if (event.isCreation) {
                            res.redirect("/addEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&mode=intervalError");
                        } else {
                            res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&actiId=" + actiId+ "&mode=intervalError");
                        }
                    })
                }
            });
            break;
        default:
            Evnt.findById(evntId).then((testAdd) => {
                if (testAdd.isCreation) {
                    Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd}}).then((event) => {
                        switch (type) {
                            case "saveActions":
                                res.redirect("/addAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
                                break;
                            default:
                                Rout.findById(routId).then((routine) => {
                                    if (routine.isCreation) {
                                        res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
                                    } else {
                                        res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                                    }
                                });
                                break;
                        }
                    });
                } else {
                    checkValidEvent(routId, newStart, newEnd, evntId).then((result) => {
                        if (result) {
                            Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, type: newGroup, start: newStart, end: newEnd}}).then((event) => {
                                switch (type) {
                                    case "saveActions":
                                        res.redirect("/addAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);
                                        break;
                                    default:
                                        Rout.findById(routId).then((routine) => {
                                            if (routine.isCreation) {
                                                res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);
                                            } else {
                                                res.redirect("/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
                                            }
                                        });
                                        break;
                                }
                            });
                        } else {
                            Evnt.findByIdAndUpdate(evntId, {$set: {name: newName, type: newGroup}}).then((event) => {
                                res.redirect("/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&mode=intervalError")
                            });
                        }
                    });
                }
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





app.get("/addSensor", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Sens.findById(reac.creationSensor).then(async (sensor) => {
                var newModelList;

                newModelList = await CoMo.find();

                res.render("sensSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: sensor,
                    models: newModelList
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
        Sens.findById(sensId).then(async (sensor) => {
            var newModelList;

            newModelList = await CoMo.find();

            res.render("sensSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: sensor,
                models: newModelList
            });
        });
    });
});

app.get("/addActuator", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Actu.findById(reac.creationActuator).then(async (actuator) => {
                var newModelList;

                newModelList = await CoMo.find();

                res.render("actuSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: actuator,
                    models: newModelList
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
        Actu.findById(actuId).then(async (actuator) => {
            var newModelList;

            newModelList = await CoMo.find();

            res.render("actuSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: actuator,
                models: newModelList
            });
        });
    });
});

app.get("/addRoutine", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Reac.findById(reacId).then((reac) => {
            Rout.findById(reac.creationRoutine).then(async (routine) => {
                var newEvntList = [];
                var newAlrmList = [];

                for (let i=0; i<routine.events.length; i+=1) {
                    aux = await Evnt.findById(routine.events[i]._id);
                    newEvntList.push({
                        name: aux.name,
                        _id: aux._id,
                        type: aux.type,
                        start: aux.start,
                        end: aux.end
                    });
                }

                for (let i=0; i<routine.alarms.length; i+=1) {
                    aux = await Alrm.findById(routine.alarms[i]._id);
                    newAlrmList.push({
                        title: aux.title,
                        _id: aux._id
                    });
                }

                var max = 0;

                for (let i=0; i<newEvntList.length; i+=1) {
                    if (newEvntList[i].type === "normal" && newEvntList[i].end > max) {
                        max = newEvntList[i].end;
                    }
                }

                res.render("routSettingsPage", {
                    username: user.username,
                    _id: userId,
                    reacId: reacId,
                    data: routine,
                    events: newEvntList,
                    minDuration: max,
                    alarms: newAlrmList
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
        Rout.findById(routId).then(async (routine) => {
            var newEvntList = [];
            var newAlrmList = [];

            for (let i=0; i<routine.events.length; i+=1) {
                aux = await Evnt.findById(routine.events[i]._id);
                newEvntList.push({
                    name: aux.name,
                    _id: aux._id,
                    type: aux.type,
                    start: aux.start,
                    end: aux.end
                });
            }

            for (let i=0; i<routine.alarms.length; i+=1) {
                aux = await Alrm.findById(routine.alarms[i]._id);
                newAlrmList.push({
                    title: aux.title,
                    _id: aux._id
                });
            }

            var max = 0;

            for (let i=0; i<newEvntList.length; i+=1) {
                if (newEvntList[i].type === "normal" && newEvntList[i].end > max) {
                    max = newEvntList[i].end;
                }
            }

            res.render("routSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                data: routine,
                events: newEvntList,
                minDuration: max,
                alarms: newAlrmList
            });
        });
    });
});

app.get("/addAlarm", (req, res) => {
    var userId = req.query._id;
    var routId = req.query.routId;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {
        Rout.findById(routId).then((routine) => {
            Reac.findById(reacId).then((reactor) => {
                Alrm.findById(routine.creationAlarm).then(async (alarm) => {
    
                    var newSensList = [];
                    var newEventList = [];
    
                    for (let i=0; i<reactor.sensors.length; i+=1) {
                        aux = await Sens.findById(reactor.sensors[i]._id);
                        newSensList.push({
                            name: aux.name,
                            _id: aux._id
                        });
                    }

                    for (let i=0; i<routine.events.length; i+=1) {
                        aux = await Evnt.findById(routine.events[i]._id);
                        if (aux.type === "esporadic") {
                            newEventList.push({
                                name: aux.name,
                                _id: aux._id
                            });
                        }
                    }

                    res.render("alrmSettingsPage", {
                        username: user.username,
                        _id: userId,
                        reacId: reacId,
                        routId: routId,
                        data: alarm,
                        sensors: newSensList,
                        events: newEventList
                    });
                });
            });
        });
    });
});

app.get("/editAlarm", (req, res) => {
    var userId = req.query._id;
    var routId = req.query.routId;
    var reacId = req.query.reacId;
    var alrmId = req.query.alrmId;

    User.findById(userId).then((user) => {
        Rout.findById(routId).then((routine) => {
            Reac.findById(reacId).then((reactor) => {
                Alrm.findById(alrmId).then(async (alarm) => {
    
                    var newSensList = [];
                    var newEventList = [];
    
                    for (let i=0; i<reactor.sensors.length; i+=1) {
                        aux = await Sens.findById(reactor.sensors[i]._id);
                        newSensList.push({
                            name: aux.name,
                            _id: aux._id
                        });
                    }

                    for (let i=0; i<routine.events.length; i+=1) {
                        aux = await Evnt.findById(routine.events[i]._id);
                        if (aux.type === "esporadic") {
                            newEventList.push({
                                name: aux.name,
                                _id: aux._id
                            });
                        }
                    }

                    res.render("alrmSettingsPage", {
                        username: user.username,
                        _id: userId,
                        reacId: reacId,
                        routId: routId,
                        data: alarm,
                        sensors: newSensList,
                        events: newEventList
                    });
                });
            });
        });
    });
});

app.get("/addEvent", (req, res) => {

    var userId = req.query._id;
    var reacId = req.query.reacId;
    var routId = req.query.routId;

    var mode  = req.query.mode;

    Rout.findById(routId).then((routine) => {

        const requestUrl = "/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + routine.creationEvent + "&mode=" + mode;

        res.redirect(requestUrl);
    });
});

app.get("/editEvent", (req, res) => {

    const userId = req.query._id;
    const routId = req.query.routId;
    const reacId = req.query.reacId;
    const evntId = req.query.evntId;

    const mode  = req.query.mode;

    User.findById(userId).then((user) => {

        Evnt.findById(evntId).then(async (event) => {

            const actionList = await findActionsByEvent(event);

            const min = findEventMinDuration(actionList);

            res.render("evntSettingsPage", {
                username: user.username,
                _id: userId,
                reacId: reacId,
                routId: routId,
                data: event,
                actions: actionList,
                minDuration: min,
                mode: mode
            });
        });
    });
});

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
