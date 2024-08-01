const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const CoMo = require('../../models/componentsModels');

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
// ---------- Get Requests ----------

// ---------- Post Requests ----------
sensorRouter.post("/saveSensor", async (req, res) => {

    const sensId = req.body.sensId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;
    const newModel = req.body.newModel;

    await Sens.findByIdAndUpdate(sensId, {name: newName, exit: newExit, model: newModel});
});

sensorRouter.post("/createSaveSensor", (req, res) => {
    const type = req.body.type;
    const userId = req.body._id;
    const reacId = req.body.reacId;
    const sensId = req.body.sensId;

    const newName = req.body.newSensName;
    const newExit = req.body.newExit;
    const modelId = req.body.modelId;

    switch (type) {
        case "create":
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit, isCreation: false, model: modelId}}).then((sensor) => {
                Sens.create({isCreation: true}).then((creationSensor) => {
                    Reac.findByIdAndUpdate(reacId, {
                        $set: {
                            creationSensor: creationSensor._id
                        }, 
                        $push: {
                            sensors: sensor._id
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
            break;
        default:
            Sens.findByIdAndUpdate(sensId, {$set: {name: newName, exit: newExit, model: modelId}}).then((sensor) => {
                Reac.findById(reacId).then((reactor) => {
                    if (reactor.isCreation) {
                        res.redirect("/addReac?_id=" + userId);
                    } else {
                        res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
                    }
                });
            });
            break;
    }
});

sensorRouter.post("/dicardSensorEdit", (req, res) => {
    var userId = req.body._id;
    var reacId = req.body.reacId;
    var sensId = req.body.sensId;

    Sens.create({isCreation: true}).then((creationSens) => {
        Reac.findByIdAndUpdate(reacId, {$set: {creationSensor: creationSens._id}}).then((reac) => {
            Sens.findByIdAndDelete(sensId).then((deletedSens) => {
                res.redirect("/addSensor?_id=" + userId + "&reacId=" + reacId);
            });
        });
    });
});

sensorRouter.post("/deleteSensor", (req, res) => {
    var reacId = req.body.reacId;
    var userId = req.body._id;
    var sensId = req.body.sensId;

    Reac.findByIdAndUpdate(reacId, { $pull: {sensors: sensId}}).then((reactor) => {
        Sens.findByIdAndDelete(sensId).then((sensor) => {
            if (reactor.isCreation) {
                res.redirect("/addReac?_id=" + userId);
            }
            else {
                res.redirect("/editReac?_id=" + userId + "&reacId=" + reacId);
            }
        });
    });
});
// ---------- Post Requests ----------
module.exports = sensorRouter;