const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const reacSchema = new Schema({
    name: {
        type: String,
        required: true
    }
});

const Reac = mongoose.model('reac', reacSchema);
module.exports = Reac;