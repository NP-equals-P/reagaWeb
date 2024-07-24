const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actuatorSchema = new Schema({
    name: String,
    exit: String,
    model: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "componentsModels"
    },
    isCreation: Boolean
});

const Actuator = mongoose.model('actuator', actuatorSchema);
module.exports = Actuator;