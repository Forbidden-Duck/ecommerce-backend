const expressLoader = require("express");

module.exports = async app => {
    const expressApp = await expressLoader(app);
    // TODO: MongoDB
    // TODO: Routes
    expressApp.use((err, req, res, next) => {
        let { message, status } = err;
        status = status || 500;
        return res.status(status).send({ message });
    });
};