const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');

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

    res.render("evntSettingsPage", {
        user: user,
        reacId: reacId,
        routId: routId,
        event: myEvent,
        actions: actionList,
        minDuration: min
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

eventRouter.post("/createSaveEvent", (req, res) => {
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

    res.redirect("/api/routine/editRoutine?_id=" + userId + "&reactorId=" + reacId + "&routId=" + routId);

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