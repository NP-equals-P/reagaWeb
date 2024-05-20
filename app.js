const express = require("express");

const app = express();

app.set('view engine', 'ejs');

app.listen(3000);

app.get('/teste', (req, res) => {
    res.render('teste', {name: 'nome'});
});

app.get('/register', (req, res) => {
    res.render('registerPage')
});

app.get('/start', (req, res) => {
    res.render('startPage')
});

app.use(express.static('views'));

app.use((req, res) => {
    res.render('loginPage')
});
