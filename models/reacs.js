const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reacSchema = new Schema({
    name: {
        type: String
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
    },
    isEdit: {
        type: Boolean
    },
    isCreationEdit: {
        type: Boolean
    },
    edit: {
        type: String,
        value: null
    }
});

const Reac = mongoose.model('reac', reacSchema);
module.exports = Reac;