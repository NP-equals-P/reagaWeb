const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CoMoSchema = new Schema({
    name: String,
    type: String,
    functions: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "functions"
    }]
});

const CoMo = mongoose.model('componentsmodel', CoMoSchema);
module.exports = CoMo;