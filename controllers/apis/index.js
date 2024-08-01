const { Router } = require("express");

const userRouter = require("./user");
const reactorRouter = require("./reactor");
const sensorRouter = require("./sensor");
const routineRouter = require("./routine");

const apiRouter = new Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/reactor", reactorRouter);
apiRouter.use("/sensor", sensorRouter);
apiRouter.use("/routine", routineRouter);

module.exports = apiRouter; 