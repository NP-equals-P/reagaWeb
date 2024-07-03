const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String,
        required: true
    },
    reactors: {
        type: Array,
        required: true
    }
});

const User = mongoose.model('user', userSchema);
module.exports = User;