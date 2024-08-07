const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Actu = require('../../models/actuators');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Acti = require('../../models/actions');
const CoMo = require('../../models/componentsModels');
const Func = require('../../models/functions');

const { checkValidEvent } = require("./commonFunctions");

const actionRouter = new Router();

// ---------- My Functions ----------
async function checkValidAction(evntId, actiId, component, start, end) {

    const myEvent = await Evnt.findById(evntId);

    for (let i=0; i<myEvent.actions.length; i+=1) {

        if (!(myEvent.actions[i].toString() === actiId)) {

            auxAction = await Acti.findById(myEvent.actions[i])

            if (auxAction.component === component) {
                ret = {
                    ret: false
                }
            }
        }
    }

}
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
                funcList.push(aux)
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

actionRouter.get("/checkIntervals", async (req, res) => {

    const routId = req.query.routId;
    const evntId = req.query.evntId;
    const actiId = req.query.actiId;

    const start = req.query.start;
    const end = req.query.end;
    const component = req.query.component;

    var ret;

    if (checkValidAction(evntId, actiId, component, start, end) && checkValidEvent()) {
        ret = {
            ret: true
        };
    } else {
        ret = {
            ret: false
        };
    }

    res.end(JSON.stringify(ret));

});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
actionRouter.post("/saveAction", async (req, res) => {

    const actiId = req.body.actiId;
    const evntId = req.body.evntId;

    const newName = req.body.newActiName;
    const newType = req.body.newType;
    const newStart = req.body.newStart;
    const newEnd = req.body.newEnd;
    const newComponent = req.body.newComponent;
    const newFunction = req.body.newFunction;

    await Acti.findByIdAndUpdate(actiId, {
        name: newName,
        type: newType,
        start: newStart,
        end: newEnd,
        component: newComponent,
        function: newFunction
    });

    const myEvent = await Evnt.findById(evntId);

    if (myEvent.end < newEnd) {
        await Evnt.findByIdAndUpdate(evntId, {end: newEnd});
    }

    res.end()
});

actionRouter.post("/createAction", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const routId = req.body.routId;
    const evntId = req.body.evntId;
    const actiId = req.body.actiId;

    await Acti.findByIdAndUpdate(actiId, {isCreation: false});

    const newCreationAction = await Acti.create({isCreation: true})

    await Evnt.findByIdAndUpdate(evntId, { $set:{creationAction: newCreationAction._id}, $push:{actions: actiId}});

    res.redirect("/api/event/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);

});

actionRouter.post("/dicardActionEdit", async (req, res) => {

    var userId = req.body._id;
    var routId = req.body.routId;
    var reacId = req.body.reacId;
    var evntId = req.body.evntId;
    var actiId = req.body.actiId;

    await Acti.findByIdAndDelete(actiId);

    const newCreationAction = await Acti.create({isCreation: true, start: 0, end: 1});

    await Evnt.findByIdAndUpdate(evntId, {creationAction: newCreationAction._id})

    res.redirect("/api/action/editAction?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId + "&actiId=" + newCreationAction._id);
});

actionRouter.post("/deleteAction", async (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var routId = req.body.routId;
    var evntId = req.body.evntId;
    var actiId = req.body.actiId;

    await Evnt.findByIdAndUpdate(evntId, { $pull: {actions: actiId}});

    await Acti.findByIdAndDelete(actiId);

    res.redirect("/api/event/editEvent?_id=" + userId + "&reacId=" + reacId + "&routId=" + routId + "&evntId=" + evntId);

});
// ---------- Post Requests ----------

module.exports = actionRouter;