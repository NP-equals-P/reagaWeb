const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alarmSchema = new Schema({
    title: String,
    isCreation: Boolean,
    message: String,
    type: String,
    limit: Number,
    sensor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "sensors"
    },
    triggers: Boolean,
    triggerEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "events"
    }
});

const Alarm = mongoose.model('alarm', alarmSchema);
module.exports = Alarm;