const { Router } = require("express");
const mongoose = require('mongoose');
const ObjectId = require('mongodb').ObjectId;
const Schema = mongoose.Schema;
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Actu = require('../../models/actuators');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Run = require('../../models/runs');

const { findByIdArray, createNewReactor, deleteFullReactor } = require("./commonFunctions");

const reactorRouter = new Router();

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

reactorRouter.get("/allLog", (req, res) => {
    const userId = req.query._id;
    const reacId = req.query.reacId;

    User.findById(userId).then((user) => {

        Reac.findById(reacId).then(async (reactor) => {

            res.render("allLogPage", {
                user: user,
                reactor: reactor
            })
        });
    });
});

reactorRouter.get("/allRuns", (req, res) => {
    const userId = req.query._id;
    const reacId = req.query.reacId;

    User.findById(userId).then((user) => {

        Reac.findById(reacId).then(async (reactor) => {

            res.render("allRunsPage", {
                user: user,
                reactor: reactor
            })
        });
    });
});

reactorRouter.get("/allTimeSeries", (req, res) => {
    const userId = req.query._id;
    const reacId = req.query.reacId;
    const runId = req.query.runId;

    User.findById(userId).then((user) => {

        Reac.findById(reacId).then(async (reactor) => {

            res.render("allTSPage", {
                user: user,
                reactor: reactor,
                runId: runId
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

reactorRouter.get("/getReactor", async (req, res) => {

    const reacId = req.query.reacId;

    const reactor = await Reac.findById(reacId);

    res.end(JSON.stringify(reactor));

});

reactorRouter.get("/getSensors", async (req, res) => {

    const reacId = req.query.reacId;

    const reactor = await Reac.findById(reacId);

    const sensList = await findByIdArray(reactor.sensors, Sens);

    res.end(JSON.stringify(sensList));

});

reactorRouter.get("/getRuns", async (req, res) => {

    const reacId = req.query.reacId;

    const reactor = await Reac.findById(reacId);

    const runList = await findByIdArray(reactor.runs, Run);

    res.end(JSON.stringify(runList));

});

reactorRouter.get("/getActiveRun", async (req, res) => {
    const reacId = req.query.reacId;

    const reactor = await Reac.findById(reacId);

    const activeRun = await Run.findById(reactor.activeRun);

    res.end(JSON.stringify(activeRun));
});

reactorRouter.get("/getRunLog", async (req, res) => {

    var runId = req.query.runId;

    const run = await Run.findById(runId);

    res.end(JSON.stringify(run.log));

});

reactorRouter.get("/getRunTS", async (req, res) => {

    const runId = req.query.runId;
    const sensId = req.query.sensId;

    const coll = await (mongoose.connection.db.collection("z_runTS[" + runId + "]"))

    const find = await coll.find({"sensorId": new ObjectId(sensId)}).limit(52)

    const measurementsList = await find.toArray();

    console.log(measurementsList.length, sensId)

    res.end(JSON.stringify(measurementsList));

});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
reactorRouter.post("/saveReactor", async (req, res) => {

    const reacId = req.body.reacId;

    const newName = req.body.newReacName;

    await Reac.findByIdAndUpdate(reacId, {name: newName})

    res.end()
});

reactorRouter.post("/createReactor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;

    await Reac.findByIdAndUpdate(reacId, {isCreation: false, isActive: false, isPaused: false});

    const newCreationReactor = await createNewReactor()

    await User.findByIdAndUpdate(userId, { $set:{creationReactor: newCreationReactor._id}, $push:{reactors: reacId}});

    res.redirect("/api/user/start?_id=" + userId);

});

reactorRouter.post("/deleteReactor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;

    await User.findByIdAndUpdate(userId, { $pull: {reactors: reacId}})

    await deleteFullReactor(reacId);

    res.end();

});

reactorRouter.post("/dicardReactorEdit", async (req, res) => {

    const reacId = req.body.reacId;

    const oldReactor = await Reac.findByIdAndUpdate(reacId, {$set: {name: "", sensors: [], actuators: [], routines: []}});

    for (let i=0; i<oldReactor.sensors.length; i+=1) {
        await Sens.findByIdAndDelete(oldReactor.sensors[i])
    }
    for (let i=0; i<oldReactor.actuators.length; i+=1) {
        await Actu.findByIdAndDelete(oldReactor.actuators[i])
    }
    for (let i=0; i<oldReactor.routines.length; i+=1) {
        await Rout.findByIdAndDelete(oldReactor.routines[i])
    }

    res.end();
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