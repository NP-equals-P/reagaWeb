const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
    name: String,
    exit: String,
    model: String,
    isCreation: Boolean
});

const Sensor = mongoose.model('sensor', sensorSchema);
module.exports = Sensor;