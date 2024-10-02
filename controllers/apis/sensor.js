const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const CoMo = require('../../models/componentsModels');

const { ObjectId } = require('mongodb');

const sensorRouter = new Router();

// ---------- Get Requests ----------
sensorRouter.get("/editSensor", (req, res) => {

    var userId = req.query._id;
    var reacId = req.query.reacId;
    var sensId = req.query.sensId;

    User.findById(userId).then((user) => {

        Sens.findById(sensId).then(async (sensor) => {

            const modelList = await CoMo.find({type: "sensor"});

            res.render("sensSettingsPage", {
                user: user,
                reacId: reacId,
                sensor: sensor,
                models: modelList
            });
        });
    });
});

sensorRouter.get("/getSensor", async (req, res) => {

    const sensId = req.query.sensId;

    const sensor = await Sens.findById(sensId);

    res.end(JSON.stringify(sensor));

});

sensorRouter.get("/getModelMeasure", async (req, res) => {

    const modlId = req.query.modlId;

    const model = await CoMo.findById(modlId);

    res.end(JSON.stringify(model));

});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
sensorRouter.post("/saveSensor", async (req, res) => {

    const sensId = req.body.sensId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;
    const newModel = req.body.newModel;

    console.log(newModel, "AAAAAAAAa")

    await Sens.findByIdAndUpdate(sensId, {name: newName, exit: newExit, model: newModel});

    res.end()
});

sensorRouter.post("/createSensor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const sensId = req.body.sensId;

    await Sens.findByIdAndUpdate(sensId, {isCreation: false});

    const newCreationSensor = await Sens.create({isCreation: true});

    await Reac.findByIdAndUpdate(reacId, { $set:{creationSensor: newCreationSensor._id}, $push:{sensors: sensId}});

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + reacId);

});

sensorRouter.post("/dicardSensorEdit", async (req, res) => {

    const sensId = req.body.sensId;

    await Sens.findByIdAndUpdate(sensId, {$set: {name: "", exit: ""}});

    res.end()
});

sensorRouter.post("/deleteSensor", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const sensId = req.body.sensId;

    await Reac.findByIdAndUpdate(reacId, { $pull: {sensors: sensId}})

    await Sens.findByIdAndDelete(sensId)

    res.end();
});
// ---------- Post Requests ----------

module.exports = sensorRouter;