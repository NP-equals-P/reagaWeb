const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Acti = require('../../models/actions');

const actionRouter = new Router();

// ---------- My Functions ----------
// ---------- My Functions ----------

// ---------- Get Requests ----------
actionRouter.get("/editAction", async (req, res) => {

    const userId = req.query._id;
    const routId = req.query.routId;
    const reacId = req.query.reacId;
    const evntId = req.query.evntId;
    const actiId = req.query.actiId;

    const user = await User.findById(userId);

    const action = await Acti.findById(actiId);

    res.render("actiSettingsPage", {
        user: user,
        reacId: reacId,
        routId: routId,
        evntId: evntId,
        action: action
    });
});

actionRouter.get("/components", async (req, res) => {
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

actionRouter.get("/modelFunctions", (req, res) => {
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

actionRouter.get("/functionHTML", (req, res) => {
    var funcId = req.query.funcId;
    var aux;

    Func.findById(funcId).then(async (func) => {

        aux = {
            html: func.html
        }

        res.end(JSON.stringify(aux));
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
actionRouter.post("/saveAction", async (req, res) => {

    const actiId = req.body.actiId;

    const newName = req.body.newActiName;
    const newType = req.body.newType;
    const newStart = req.body.newStart;
    const newEnd = req.body.newEnd;

    await Acti.findByIdAndUpdate(actiId, {
        name: newName,
        type: newType,
        start: newStart,
        end: newEnd,
    });
});

actionRouter.post("/createSaveAction", (req, res) => {
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

actionRouter.post("/dicardActionEdit", (req, res) => {
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

actionRouter.post("/deleteAction", (req, res) => {
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
// ---------- Post Requests ----------

module.exports = actionRouter;