const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const alarmSchema = new Schema({
    title: String,
    isCreation: Boolean,
    mesage: String
});

const Alarm = mongoose.model('alarm', alarmSchema);
module.exports = Alarm;