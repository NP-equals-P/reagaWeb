const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actionSchema = new Schema({
    name: String,
    isCreation: Boolean,
    type: String,
    start: Number,
    duration: Number,
    component: {
        type: mongoose.Schema.Types.ObjectId,
        value: ""
    }
});

const Action = mongoose.model('action', actionSchema);
module.exports = Action;