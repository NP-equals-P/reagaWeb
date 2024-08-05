const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Alrm = require('../../models/alarms');

const { findByIdArray } = require("./commonFunctions");

const alarmRouter = new Router();

// ---------- Get Requests ----------
alarmRouter.get("/editAlarm", async (req, res) => {

    const userId = req.query._id;
    const routId = req.query.routId;
    const reacId = req.query.reacId;
    const alrmId = req.query.alrmId;

    const user = await User.findById(userId);
    const reactor = await Reac.findById(reacId);
    const routine = await Rout.findById(routId);
    const alarm = await Alrm.findById(alrmId);
    
    const sensorList = await findByIdArray(reactor.sensors, Sens);
    const eventList = await findByIdArray(routine.esporadicEvents, Evnt);

    res.render("alrmSettingsPage", {
        user: user,
        reacId: reacId,
        routId: routId,
        alarm: alarm,
        sensors: sensorList,
        events: eventList
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
alarmRouter.post("/saveAlarm", async (req, res) => {

    const alrmId = req.body.alrmId;

    const newTitle = req.body.newTitle;
    const newMsg = req.body.newMsg;
    const newLimit = req.body.newLimit;
    const newType = req.body.newType;
    const newSensor = req.body.newSensor;
    const newTriggerStatus = req.body.newTriggerStatus;
    const newTriggerEvent = req.body.newTriggerEvent;

    await Alrm.findByIdAndUpdate(alrmId, {
        title: newTitle,
        message: newMsg,
        type: newType,
        limit: newLimit,
        sensor: newSensor,
        triggers: newTriggerStatus,
        triggerEvent: newTriggerEvent
    });

    res.end();
});

alarmRouter.post("/createAlarm", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const alrmId = req.body.alrmId;

    await Alrm.findByIdAndUpdate(alrmId, {isCreation: false});

    const newCreationAlarm = await Alrm.create({isCreation: true, limit: 0});

    await Rout.findByIdAndUpdate(routId, { $set:{creationAlarm: newCreationAlarm._id}, $push:{alarms: alrmId}});

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);

});

alarmRouter.post("/dicardAlarmEdit", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const alrmId = req.body.alrmId;
    
    await Alrm.findByIdAndDelete(alrmId);

    const newCreationAlarm = await Alrm.create({isCreation: true, limit: 0});

    await Rout.findByIdAndUpdate(routId, {creationAlarm: newCreationAlarm._id});

    res.redirect("/api/alarm/editAlarm?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&alrmId=" + newCreationAlarm._id);
});

alarmRouter.post("/deleteAlarm", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const alrmId = req.body.alrmId;

    await Rout.findByIdAndUpdate(routId, { $pull: {alarms: alrmId}});

    await Alrm.findByIdAndDelete(alrmId);

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
});
// ---------- Post Requests ----------

module.exports = alarmRouter;