const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const { sensorEditSchema, sensorSchema, actuatorEditSchema, actuatorSchema, reactorEditSchema } = require("./common");

const userSchema = new Schema({
    username: String,
    reactors: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "reactors"
        }
    ],
    reactorCreationEdit: reactorEditSchema
});

const User = mongoose.model('user', userSchema);
module.exports = User;