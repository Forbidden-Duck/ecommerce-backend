const expressLoader = require("./express");
const mongodbLoader = require("./mongodb");
const routeLoader = require("./routes");

module.exports = async app => {
    const expressApp = await expressLoader(app);
    const MongoDB = await mongodbLoader();
    await routeLoader(expressApp, MongoDB);
    expressApp.use((err, req, res, next) => {
        let { message, status } = err;
        status = status || 500;
        return res.status(status).send({ message });
    });
};