const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const actionSchema = new Schema({
    name: String,
    start: String,
    duration: String,
    component: {
        type: mongoose.Schema.Types.ObjectId,
    }
});

const Action = mongoose.model('action', actionSchema);
module.exports = Action;