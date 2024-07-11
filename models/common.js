const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const sensorEditSchema = new Schema({
    name: String,
    exit: String,
    model: String
});

const sensorSchema = new Schema({
    name: String,
    exit: String,
    model: String,
    edit: sensorEditSchema
});

const actuatorEditSchema = new Schema({
    name: String,
    exit: String,
    model: String
});

const actuatorSchema = new Schema({
    name: String,
    exit: String,
    model: String,
    edit: actuatorEditSchema
});

const reactorEditSchema = new Schema({
    name: String,
    sensors: [sensorSchema],
    actuators: [actuatorSchema],
    sensorCrationEdit: sensorEditSchema,
    actuatorCreationEdit: actuatorEditSchema
});

module.exports = { sensorEditSchema, sensorSchema, actuatorEditSchema, actuatorSchema, reactorEditSchema }