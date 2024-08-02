const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Alrm = require('../../models/alarms');

const { deleteFullRoutine } = require("./commonFunctions");
const { findByIdArray } = require("./commonFunctions");

const routineRouter = new Router();

// ---------- My Functions ----------
function findMaxEventEnd(eventList) {

    var max = 0;

    for (let i=0; i<eventList.length; i+=1) {
        if (eventList[i].end > max) {
            max = eventList[i].end;
        }
    }

    return max;
}
// ---------- My Functions ----------

// ---------- Get Requests ----------
routineRouter.get("/editRoutine", (req, res) => {

    var userId = req.query._id;
    var reacId = req.query.reacId;
    var routId = req.query.routId;

    User.findById(userId).then((user) => {

        Rout.findById(routId).then(async (routine) => {

            const eventList = await findByIdArray(routine.events, Evnt);
            const esporadicEventList = await findByIdArray(routine.esporadicEvents, Evnt);
            const alarmList = await findByIdArray(routine.alarms, Alrm);

            var maxEnd = findMaxEventEnd(eventList);

            res.render("routSettingsPage", {
                user: user,
                reacId: reacId,
                routine: routine,
                events: eventList,
                espEvents: esporadicEventList,
                alarms: alarmList,
                minDuration: maxEnd
            });
        });
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
routineRouter.post("/createSaveRoutine", (req, res) => {
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

routineRouter.post("/saveRoutine", async (req, res) => {

    const routId = req.body.routId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;
    const newModel = req.body.newModel;

    await Sens.findByIdAndUpdate(sensId, {name: newName, exit: newExit, model: newModel});
});

routineRouter.post("/createRoutine", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;

    await Sens.findByIdAndUpdate(sensId, {isCreation: false});

    const newCreationSensor = await Sens.create({isCreation: true});

    await Reac.findByIdAndUpdate(reacId, { $set:{creationSensor: newCreationSensor._id}, $push:{sensors: sensId}});

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + reacId);

});

routineRouter.post("/dicardRoutineEdit", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    
    await deleteFullRoutine(routId);

    const newCreationRoutine = await createNewRoutine();

    await User.findByIdAndUpdate(userId, {creationRoutine: newCreationRoutine._id});

    res.redirect("/addRoutine?_id=" + userId + "&reacId=" + reacId);

});

routineRouter.post("/deleteRoutine", async (req, res) => {

    var userId = req.body._id;
    var routId = req.body.routId;

    await Reac.findByIdAndUpdate(reacId, { $pull: {routines: routId}});

    res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
});
// ---------- Post Requests ----------

module.exports = routineRouter;