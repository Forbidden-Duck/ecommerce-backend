const expressLoader = require("./express");
const mongodbLoader = require("./mongodb");

module.exports = async app => {
    const expressApp = await expressLoader(app);
    const MongoDB = await mongodbLoader();
    // TODO Routes
    expressApp.use((err, req, res, next) => {
        let { message, status } = err;
        status = status || 500;
        return res.status(status).send({ message });
    });
};