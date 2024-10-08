const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    name: String,
    type: String,
    isCreation: Boolean,
    start: Number,
    end: Number,
    inQueue: Boolean,
    actions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "actions"
        }
    ],
    creationAction : {
        type: mongoose.Schema.Types.ObjectId,
        ref: "actions"
    }
});

const Event = mongoose.model('event', eventSchema);
module.exports = Event;