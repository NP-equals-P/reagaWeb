const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Actu = require('../../models/actuators');
const CoMo = require('../../models/componentsModels');

const actuatorRouter = new Router();

// ---------- Get Requests ----------
actuatorRouter.get("/editActuator", (req, res) => {

    const userId = req.query._id;
    const reacId = req.query.reacId;
    const actuId = req.query.actuId;

    User.findById(userId).then((user) => {

        Actu.findById(actuId).then(async (actuator) => {

            const modelList = await CoMo.find({type: "actuator"});

            res.render("actuSettingsPage", {
                user: user,
                reacId: reacId,
                actuator: actuator,
                models: modelList
            });
        });
    });
});
// ---------- Get Requests ----------

// ---------- Post Requests ----------
actuatorRouter.post("/saveActuator", async (req, res) => {

    const actuId = req.body.actuId;

    const newName = req.body.newActuName;
    const newExit = req.body.newExit;
    const newModel = req.body.newModel;

    await Actu.findByIdAndUpdate(actuId, {name: newName, exit: newExit, model: newModel});

    res.end()
});

actuatorRouter.post("/createActuator", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const actuId = req.body.actuId;

    await Actu.findByIdAndUpdate(actuId, {isCreation: false});

    const newCreationActuator = await Actu.create({isCreation: true});

    await Reac.findByIdAndUpdate(reacId, { $set:{creationActuator: newCreationActuator._id}, $push:{actuators: actuId}});

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + reacId);

});

actuatorRouter.post("/dicardActuatorEdit", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const actuId = req.body.actuId;

    const newCreationActuator = await Actu.create({isCreation: true});

    await Actu.findByIdAndDelete(actuId);

    await Reac.findByIdAndUpdate(reacId, {$set: {creationActuator: newCreationActuator._id}});

    res.redirect("/api/actuator/editActuator?_id=" + userId + "&actuId=" + newCreationActuator._id + "&reacId=" + reacId);
});

actuatorRouter.post("/deleteActuator", async (req, res) => {

    const userId = req.body._id;
    const reacId = req.body.reacId;
    const actuId = req.body.actuId;

    await Reac.findByIdAndUpdate(reacId, { $pull: {actuators: actuId}})

    await Actu.findByIdAndDelete(actuId)

    res.redirect("/api/reactor/editReactor?_id=" + userId + "&reactorId=" + reacId);
});
// ---------- Post Requests ----------

module.exports = actuatorRouter;