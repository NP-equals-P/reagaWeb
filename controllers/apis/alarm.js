const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');

const { findByIdArray } = require("./commonFunctions");

const alarmRouter = new Router();

// ---------- Get Requests ----------
app.get("/editAlarm", async (req, res) => {

    const userId = req.query._id;
    const routId = req.query.routId;
    const reacId = req.query.reacId;
    const alrmId = req.query.alrmId;

    const user = await User.findById(userId);
    const routine = await Rout.findById(routId);
    const reactor = await Reac.findById(reacId)
    const alarm = await Alrm.findById(alrmId)
    
    const sensorList = await findByIdArray(reactor.sensors);
    const eventList = await findByIdArray(reactor.events);;

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
// ---------- Post Requests ----------

module.exports = alarmRouter;