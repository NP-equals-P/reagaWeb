const mongoose = require('mongoose');

//Change to .env variable
const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

mongoose.connect(urI);
//.then((result) => app.listen(3000)).catch((err) => console.log(err));

module.exports = mongoose.connection;