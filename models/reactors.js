const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reactorSchema = new Schema({
    name: String,
    isCreation: Boolean,
    isActive: Boolean,
    isPaused: Boolean,
    activeRoutine: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "routines"
    },
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
            ref: "actuators",
        }
    ],
    creationActuator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "actuators"
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
    },
    activeRun: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "runs"
    },
    runs: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "runs"
        }
    ]
});

const Reac = mongoose.model('reactor', reactorSchema);
module.exports = Reac;