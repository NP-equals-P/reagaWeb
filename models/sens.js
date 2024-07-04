const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
    username: {
        type: String
    },
    exit: {
        type: String
    },
    model: {
        type: String
    }
});

const Sens = mongoose.model('sensor', sensorSchema);
module.exports = Sens;