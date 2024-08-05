const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Alrm = require('../../models/alarms');

const { deleteFullRoutine } = require("./commonFunctions");
const { findByIdArray } = require("./commonFunctions");
const { createNewRoutine } = require("./commonFunctions");

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
routineRouter.post("/saveRoutine", async (req, res) => {

    const routId = req.body.routId;

    const newName = req.body.newRoutName;

    await Rout.findByIdAndUpdate(routId, {name: newName});
});

routineRouter.post("/createRoutine", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;

    await Rout.findByIdAndUpdate(routId, {isCreation: false});

    const newCreationRoutine = await createNewRoutine();

    await Reac.findByIdAndUpdate(reacId, { $set:{creationRoutine: newCreationRoutine._id}, $push:{routines: routId}});

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + reacId);

});

routineRouter.post("/dicardRoutineEdit", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    
    await deleteFullRoutine(routId);

    const newCreationRoutine = await createNewRoutine();

    await Reac.findByIdAndUpdate(reacId, {creationRoutine: newCreationRoutine._id});

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + newCreationRoutine._id);

});

routineRouter.post("/deleteRoutine", async (req, res) => {

    var userId = req.body._id;
    var reacId = req.body.reacId;
    var routId = req.body.routId;

    await Reac.findByIdAndUpdate(reacId, { $pull: {routines: routId}});

    await deleteFullRoutine(routId);

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reacId=" + reacId);
});
// ---------- Post Requests ----------

module.exports = routineRouter;