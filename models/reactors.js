const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reactorSchema = new Schema({
    name: String,
    isCreation: Boolean,
    sensors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "sensors"
        }
    ],
    creationSensor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sensors"
    },
    actuators: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "actuators"
        }
    ],
    creationActuator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "actuators"
    },
    alarms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "alarms"
        }
    ],
    creationAlarm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "alarms"
    },
    routines: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "alarms"
        }
    ],
    creationRoutine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "routines"
    }
});

const Reac = mongoose.model('reactor', reactorSchema);
module.exports = Reac;