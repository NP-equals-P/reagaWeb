const http = require("http");
const fs = require("fs");
const _ = require("lodash");

const server = http.createServer((req, res) => {
    console.log("PEDIDO");

    res.setHeader("Content-Type", "text/html");

    let path = "./views/";

    switch(req.url) {
        case '/register':
            path += "registerPage.html";
            break;
        case '/star':
            path += "startPage.html";
            break;
        default:
            path += "loginPage.html";
            break;
    }

    //interessante
    res.statusCode = 200;

    fs.readFile(path, (err, data) => {
        if (err) {
            console.log(err);
            res.end();
        } else {
            //res.write(data);
            res.end(data);
        }
    })
});

server.listen(3000, "localhost", () => {
    console.log("RODANDO")
});