const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actuatorSchema = new Schema({
    name: String,
    exit: String,
    model: String
});

const Actuator = mongoose.model('actuator', actuatorSchema);
module.exports = Actuator;