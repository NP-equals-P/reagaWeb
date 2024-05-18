const express = require("express");

const app = express();

app.set('view engine', 'ejs');

app.listen(3000);

app.get('/teste', (req, res) => {
    res.render('teste', {name: 'nome'});
});

app.get('/register', (req, res) => {
    res.sendFile('./views/registerPage.html', {root: __dirname})
});

app.get('/start', (req, res) => {
    res.sendFile('./views/startPage.html', {root: __dirname})
});

app.use((req, res) => {
    res.sendFile('./views/loginPage.html', {root: __dirname})
});