const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const userSchema = new Schema({
    username: String,
    reactors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "reactors"
        }
    ],
    creationReactor: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "reactors"
    }
});

const User = mongoose.model('user', userSchema);
module.exports = User;