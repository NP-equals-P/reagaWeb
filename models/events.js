const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventSchema = new Schema({
    name: String,
    start: String,
    duration: String,
    actions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "actions"
        }
    ]
});

const Event = mongoose.model('event', eventSchema);
module.exports = Event;