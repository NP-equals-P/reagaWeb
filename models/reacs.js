const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reacSchema = new Schema({
    name: {
        type: String,
        required: true
    },
    sensors: {
        type: Array,
        value: []
    },
    actuators: {
        type: Array,
        value: []
    },
    routines: {
        type: Array,
        value: []
    },
    alarms: {
        type: Array,
        value: []
    }
});

const Reac = mongoose.model('reac', reacSchema);
module.exports = Reac;