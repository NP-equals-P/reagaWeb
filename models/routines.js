const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const routineSchema = new Schema({
    name: String,
    events: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "events"
        }
    ]
});

const Routine = mongoose.model('routine', routineSchema);
module.exports = Routine;