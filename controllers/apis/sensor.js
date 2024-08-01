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

module.exports = sensorRouter;