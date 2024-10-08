const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const functionSchema = new Schema({
    name: String,
    numberVars: Number,
    stringVars: Number,
    html: String,
    isRegular: Boolean
});

const Function = mongoose.model('function', functionSchema);
module.exports = Function;