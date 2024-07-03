const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: {
        type: String
    },
    reactors: {
        type: Array
    },
    reacEdit: {
        type: String
    }
});

const User = mongoose.model('user', userSchema);
module.exports = User;