const { Router } = require("express");

const userRouter = require("./user");
const { reactorRouter } = require("./reactor");

const apiRouter = new Router();

apiRouter.use("/user", userRouter);
apiRouter.use("/reactor", reactorRouter);

module.exports = apiRouter; 