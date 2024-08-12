const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Actu = require('../../models/actuators');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Run = require('../../models/runs');

const { findByIdArray, createNewReactor } = require("./commonFunctions");

const reactorRouter = new Router();

// ---------- My Functions ----------
// ---------- My Functions ----------

// ---------- Get Requests ----------
reactorRouter.get("/editReactor", (req, res) => {

    var logedId = req.query._id;
    var reacId = req.query.reactorId;

    User.findById(logedId).then((user) => {
        Reac.findById(reacId).then(async (reactor) => {

            const sensorList = await findByIdArray(reactor.sensors, Sens);
            const actuatorList = await findByIdArray(reactor.actuators, Actu);
            const routineList = await findByIdArray(reactor.routines, Rout);

            res.render('reacSettingsPage', {
                user: user,
                sensors: sensorList,
                actuators: actuatorList,
                routines: routineList,
                reactor: reactor
            });
        });
    });
});

reactorRouter.get("/reacView", (req, res) => {

    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((user) => {

        Reac.findById(reacId).then(async (reactor) => {

            const routineList = await findByIdArray(reactor.routines, Rout);

            res.render("reacView", {
                user: user,
                reactor: reactor,
                routines: routineList
            })
        });
    });
});

reactorRouter.get("/getEsporadicEvents", async (req, res) => {

    var routId = req.query.routId;

    const routine = await Rout.findById(routId);

    const espEventsList = await findByIdArray(routine.esporadicEvents, Evnt);

    res.end(JSON.stringify(espEventsList));

});

reactorRouter.get("/getSensors", async (req, res) => {

    const reacId = req.query.reacId;

    const reactor = await Reac.findById(reacId);

    const sensList = await findByIdArray(reactor.sensors, Sens);

    res.end(JSON.stringify(sensList));

});

reactorRouter.get("/getRunLog", async (req, res) => {

    var runId = req.query.runId;

    const run = await Run.findById(runId);

    res.end(JSON.stringify(run.log));

});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
reactorRouter.post("/saveReactor", async (req, res) => {

    const reacId = req.body.reacId;

    const newName = req.body.newReacName;

    await Reac.findByIdAndUpdate(reacId, {name: newName})
});

reactorRouter.post("/createReactor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;

    await Reac.findByIdAndUpdate(reacId, {isCreation: false});

    const newCreationReactor = await createNewReactor()

    await User.findByIdAndUpdate(userId, { $set:{creationReactor: newCreationReactor._id}, $push:{reactors: reacId}});

    res.redirect("/api/user/start?_id=" + userId);

});

reactorRouter.post("/deleteReactor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;

    await User.findByIdAndUpdate(logedId, { $pull: {reactors: reacId}})

    await deleteFullReactor(reacId);

    res.redirect("api/user/start?_id=" + userId);

});

reactorRouter.post("/dicardReactorEdit", async (req, res) => {

    var userId = req.body._id;
    var reacId = req.body.reacId;

    const newCreationReactor = await createNewReactor();

    await Reac.findByIdAndDelete(reacId);

    await User.findByIdAndUpdate(userId, {creationReactor: newCreationReactor._id});

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + newCreationReactor._id);

});

reactorRouter.post("/activateReactor", async (req, res) => {

    var reacId = req.body.reacId;
    var routId = req.body.activeRoutine;

    await Reac.findByIdAndUpdate(reacId, {$set: {isActive: true, isPaused: false, activeRoutine: routId}});
});

reactorRouter.post("/deactivateReactor", async (req, res) => {

    var reacId = req.body.reacId;

    await Reac.findByIdAndUpdate(reacId, {$set: {isActive: false}});
});

reactorRouter.post("/pauseReactor", async (req, res) => {

    var reacId = req.body.reacId;

    const reactor = await Reac.findByIdAndUpdate(reacId, {$set: {isPaused: true}});

    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const pauseLogStr = "[Reactor] " + reactor.name + " was paused. [Real time: " + day + "/" + month + "/" + year + ", " + hour + ":" + minutes + ":" + seconds + "]"

    await Run.findByIdAndUpdate(reactor.activeRun, {$push: {log: pauseLogStr}})
});

reactorRouter.post("/unpauseReactor", async (req, res) => {

    var reacId = req.body.reacId;

    const reactor = await Reac.findByIdAndUpdate(reacId, {$set: {isPaused: false}});

    const date = new Date();
    const day = date.getDate();
    const month = date.getMonth();
    const year = date.getFullYear();
    const hour = date.getHours();
    const minutes = date.getMinutes();
    const seconds = date.getSeconds();

    const pauseLogStr = "[Reactor] " + reactor.name + " was unpaused. [Real time: " + day + "/" + month + "/" + year + ", " + hour + ":" + minutes + ":" + seconds + "]"

    await Run.findByIdAndUpdate(reactor.activeRun, {$push: {log: pauseLogStr}})
});

reactorRouter.post("/callEsporadicEvent", async (req, res) => {

    var evntId = req.body.evntId;

    await Evnt.findByIdAndUpdate(evntId, {$set: {inQueue: true}});

    res.end()
});
// ---------- Post Requests ----------

module.exports = reactorRouter;