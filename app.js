const express = require("express");
const mongoose = require('mongoose');
const mainRouter = require("./controllers");

// ---------- Configs ----------
const app = express();

app.use(express.urlencoded({ extended: true })); //TODO: Danger zone! I don't know what these lines do.
app.set('view engine', 'ejs');
app.use(express.static('views'));
app.use(express.json());

app.use("/", mainRouter); //Routing
// ---------- Configs ----------

// ---------- Connect to DB ----------
//const urI = 'mongodb://usrbioma:B%21omA2024@db-bioma.feagri.unicamp.br:27017/bioma?retryWrites=true&loadBalanced=false&serverSelectionTimeoutMS=5000&connectTimeoutMS=10000&authSource=bioma&authMechanism=SCRAM-SHA-256';

const urI = "mongodb+srv://ito:senhaito@cluster0.2muvzud.mongodb.net/test?retryWrites=true&w=majority&appName=Cluster0";

mongoose.connect(urI)
    .then((result) => app.listen(3000))
    .catch((err) => console.log(err));
// ---------- Connect to DB ----------

//App requests
app.get('/login', (req, res) => {
    res.render('loginPage', {mode: req.query.mode});
});

app.get('/register', (req, res) => {
    res.render('registerPage', {mode: req.query.mode});
});

app.use((req, res) => {
    res.render('loginPage', {mode: 'normal'})
});
