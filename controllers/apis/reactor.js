const { Router } = require("express");
const User = require('../../models/users');
const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Actu = require('../../models/actuators');

const reactorRouter = new Router();

// ---------- My Functions ----------
async function createNewReactor() {

    const sensor = await Sens.create({isCreation: true});

    const actuator = await Actu.create({isCreation: true});

    const routine = await createNewRoutine();

    const reactor = await Reac.create({
        isCreation: true,
        creationSensor: sensor._id,
        creationActuator: actuator._id,
        creationRoutine: routine._id
    });

    return reactor;

    return "Sucess"
}
// ---------- My Functions ----------

// ---------- Get Requests ----------
reactorRouter.get("/editReactor", (req, res) => {
    var logedId = req.query._id;
    var reacId = req.query.reactorId;

    console.log(req.query);

    User.findById(logedId).then((user) => {
        Reac.findById(reacId).then(async (reac) => {

            var newSensList = [];
            var newActuList = [];
            var newRoutList = [];
            var aux;

            for (let i=0; i<reac.sensors.length; i+=1) {
                aux = await Sens.findById(reac.sensors[i]._id);
                newSensList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reac.actuators.length; i+=1) {
                aux = await Actu.findById(reac.actuators[i]._id);
                newActuList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            for (let i=0; i<reac.routines.length; i+=1) {
                aux = await Rout.findById(reac.routines[i]._id);
                newRoutList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            res.render('reacSettingsPage', {
                username: user.username,
                _id: logedId,
                data: {reactor: reac, sensors: newSensList, actuators: newActuList, routines: newRoutList}
            });
        });
    });
});

reactorRouter.get("/reacView", (req, res) => {
    var userId = req.query._id;
    var reacId = req.query.reacId;

    User.findById(userId).then((resultU) => {
        Reac.findById(reacId).then(async (resultR) => {
            var newRoutList = [];
            var newEspEventList = []
            var aux;

            for (let i=0; i<resultR.routines.length; i+=1) {
                aux = await Rout.findById(resultR.routines[i]._id);
                newRoutList.push({
                    name: aux.name,
                    _id: aux._id
                });
            }

            if (resultR.isActive) {
                var activeRout = await Rout.findById(resultR.activeRoutine);
                for (let i=0; i<activeRout.events.length; i+=1) {
                    aux = await Evnt.findById(activeRout.events[i]);
                    if (aux.type === "esporadic") {
                        newEspEventList.push({
                            name: aux.name,
                            _id: aux._id
                        })
                    }
                }
            }

            res.render("reacView", {
                username: resultU.username,
                _id: userId,
                data: resultR,
                routines: newRoutList,
                activeRoutine: resultR.activeRoutine,
                espEvents: newEspEventList
            })
        });
    });
});
// ---------- Get Requests ----------

module.exports = {reactorRouter, createNewReactor};