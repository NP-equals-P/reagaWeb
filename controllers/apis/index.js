const { Router } = require("express");

const userRouter = require("./user");
const reactorRouter = require("./reactor");
const sensorRouter = require("./sensor");
const actuatorRouter = require("./actuator");
const routineRouter = require("./routine");
const alarmRouter = require("./alarm");
const eventRouter = require("./event");
const actionRouter = require("./action");

const apiRouter = new Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/reactor", reactorRouter);
apiRouter.use("/sensor", sensorRouter);
apiRouter.use("/actuator", actuatorRouter);
apiRouter.use("/routine", routineRouter);
apiRouter.use("/alarm", alarmRouter);
apiRouter.use("/event", eventRouter);
apiRouter.use("/action", actionRouter);

module.exports = apiRouter; 