const Reac = require('../../models/reactors');
const Sens = require('../../models/sensors');
const Actu = require('../../models/actuators');
const Rout = require('../../models/routines');
const Evnt = require('../../models/events');
const Acti = require('../../models/actions');
const Alrm = require('../../models/alarms');

async function createNewEvent() {

    const action = await Acti.create({isCreation: true});

    const event = await Evnt.create({
        isCreation: true,
        creationAction: action._id,
        start: 0,
        end: 1
    });

    return event;
}

async function createNewRoutine() {

    const alarm = await Alrm.create({isCreation: true});

    const event = await createNewEvent();

    const routine = await Rout.create({
        isCreation: true,
        creationAlarm: alarm._id,
        creationEvent: event._id
    });

    return routine;
}

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
}

async function findByIdArray(idArray, MySchema) {

    var aux;
    const documentList = [];

    for (let i=0; i<idArray.length; i+=1) {
        aux = await MySchema.findById(idArray[i]._id);
        documentList.push(aux);
    }

    return documentList;
}

async function deleteFullEvent(evntId) {
    Evnt.findByIdAndDelete(evntId).then(async (event) => {
        for (let i=0; i<event.actions.length; i+=1) {
            await Acti.findByIdAndDelete(event.actions[i]);
        }

        await Acti.findByIdAndDelete(event.creationAction);
    });
}

async function deleteFullRoutine(routId) {
    Rout.findByIdAndDelete(routId).then(async (routine) => {
        for (let i=0; i<routine.events.length; i+=1) {
            await deleteFullEvent(routine.events[i]);
        }

        await deleteFullEvent(routine.creationEvent);

        for (let i=0; i<routine.alarms.length; i+=1) {
            await Alrm.findByIdAndDelete(routine.alarms[i]);
        }

        await Alrm.findByIdAndDelete(routine.creationAlarm);
    });
}

async function deleteFullReactor(reacId) {
    Reac.findByIdAndDelete(reacId).then(async (resultD) => {
        for (let i=0; i<resultD.sensors.length; i+=1) {
            await Sens.findByIdAndDelete(resultD.sensors[i]);
        }
        for (let i=0; i<resultD.actuators.length; i+=1) {
            await Actu.findByIdAndDelete(resultD.actuators[i]);
        }
        for (let i=0; i<resultD.routines.length; i+=1) {
            await deleteFullRoutine(resultD.routines[i]);
        }
    
        await Sens.findByIdAndDelete(resultD.creationSensor);
        await Actu.findByIdAndDelete(resultD.creationActuator);
        await deleteFullRoutine(resultD.creationRoutine);
    });
}

module.exports = {
    createNewEvent,
    createNewRoutine,
    createNewReactor,
    findByIdArray,
    deleteFullEvent,
    deleteFullRoutine,
    deleteFullReactor
}