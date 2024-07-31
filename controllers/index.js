const { Router } = require("express");

const apiRouter = require("./apis");

const mainRouter = new Router();

mainRouter.use("/api", apiRouter);

module.exports = mainRouter;