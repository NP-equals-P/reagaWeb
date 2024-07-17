const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const routineSchema = new Schema({
    name: String,
    isCreation: Boolean,
    events: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "events"
        }
    ],
    creationEvent: {
        
        type: mongoose.Schema.Types.ObjectId,
        ref: "events"
        
    },
    alarms: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "alarms"
        }
    ],
    creationAlarm: {
        
        type: mongoose.Schema.Types.ObjectId,
        ref: "alarms"
        
    }
});

const Routine = mongoose.model('routine', routineSchema);
module.exports = Routine;