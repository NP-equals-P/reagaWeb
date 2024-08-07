const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Acti = require('../../models/actions');

const { deleteFullEvent } = require("./commonFunctions");
const { createNewEvent } = require("./commonFunctions");

const eventRouter = new Router();

// ---------- My Functions ----------
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

function findEventMaxStart(actionList) {

    var min = Infinity;

    for (let i=0; i<actionList.length; i+=1) {

        if (actionList[i].start < min) {

            min = actionList[i].start;
        }
    }

    return min;
}
// ---------- My Functions ----------

// ---------- Get Requests ----------
eventRouter.get("/editEvent", async (req, res) => {

    const userId = req.query._id;
    const routId = req.query.routId;
    const reacId = req.query.reacId;
    const evntId = req.query.evntId;

    const user = await User.findById(userId)

    const myEvent = await Evnt.findById(evntId)

    const actionList = await findActionsByEvent(myEvent);

    const min = findEventMinDuration(actionList);
    const max = findEventMaxStart(actionList);

    res.render("evntSettingsPage", {
        user: user,
        reacId: reacId,
        routId: routId,
        event: myEvent,
        actions: actionList,
        minDuration: min,
        maxStart: max
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
eventRouter.post("/saveEvent", async (req, res) => {

    const evntId = req.body.evntId;
    const routId = req.body.routId;

    const newName = req.body.newEvntName;
    const newGroup = req.body.newGroup;
    const newStart = req.body.newStart;
    const newEnd = req.body.newEnd;

    const oldEvent = await Evnt.findByIdAndUpdate(evntId, {name: newName, type: newGroup, start: newStart, end: newEnd});

    if (!(oldEvent.type === newGroup) && !(oldEvent.isCreation)) {
        if (newGroup === "normal") {
            await Rout.findByIdAndUpdate(routId, {$pull:{esporadicEvents: evntId}, $push:{events: evntId}});
        } else {
            await Rout.findByIdAndUpdate(routId, {$push:{esporadicEvents: evntId}, $pull:{events: evntId}});
        }
    }

    res.end();
});

eventRouter.post("/createEvent", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;

    const newEvent = await Evnt.findByIdAndUpdate(evntId, {isCreation: false});

    const newCreationEvent = await createNewEvent();

    if (newEvent.type === "normal") {

        await Rout.findByIdAndUpdate(routId, { $set:{creationEvent: newCreationEvent._id}, $push:{events: evntId}});

    } else {

        await Rout.findByIdAndUpdate(routId, { $set:{creationEvent: newCreationEvent._id}, $push:{esporadicEvents: evntId}});
    }

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);

});

eventRouter.post("/dicardEventEdit", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;
    
    await deleteFullEvent(evntId);

    const newCreationEvent = await createNewEvent();

    await Rout.findByIdAndUpdate(routId, {creationEvent: newCreationEvent._id});

    res.redirect("/api/event/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + newCreationEvent._id);
});

eventRouter.post("/deleteEvent", async (req, res) => {

    var userId = req.body._id;
    var reacId = req.body.reacId;
    var routId = req.body.routId;
    var evntId = req.body.evntId;

    const myEvent = await Evnt.findById(evntId);

    if (myEvent.type === "normal") {

        await Rout.findByIdAndUpdate(routId, { $pull: {events: evntId}});

    } else {

        await Rout.findByIdAndUpdate(routId, { $pull: {esporadicEvents: evntId}});

    }

    await deleteFullEvent(evntId);

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId);
});
// ---------- Post Requests ----------

module.exports = eventRouter;