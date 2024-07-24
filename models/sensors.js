const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorSchema = new Schema({
    name: String,
    exit: String,
    model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "componentsModels"
    },
    isCreation: Boolean
});

const Sensor = mongoose.model('sensor', sensorSchema);
module.exports = Sensor;