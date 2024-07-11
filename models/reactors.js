const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { sensorEditSchema, sensorSchema, actuatorEditSchema, actuatorSchema, reactorEditSchema } = require("./common");

const reactorSchema = new Schema({
    name: String,
    sensors: [sensorSchema],
    actuators: [actuatorSchema],
    edit: reactorEditSchema
});

const Reac = mongoose.model('reactor', reactorSchema);
module.exports = Reac;