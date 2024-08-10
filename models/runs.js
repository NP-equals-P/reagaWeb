const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const runSchema = new Schema({
    log: [String]
});

const Run = mongoose.model('run', runSchema);
module.exports = Run;