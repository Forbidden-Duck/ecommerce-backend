const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");

/**
 * 
 * @param {import("express").Express} app 
 * @param {import("./mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    // TODO Implement Admin abilities
    // TODO Implement rate-limiting
    // TODO Implement IP blocking
    require("../routes/auth")(app, MongoDB);

    // /api Authentication
    app.use("/api", (req, res, next) => {
        // Check if the header exists
        const headerToken = req.headers["authorization"];
        if (headerToken) {
            const token = headerToken.split(" ")[1];
            // Validate the header
            jwt.verify(token, CRYPTO.jwtkey, (err, data) => {
                if (err) {
                    return res.sendStatus(401);
                }
                req.token = token;
                req.tokenData = data;
                next();
            });
        } else {
            res.sendStatus(400);
        }
    });
    require("../routes/user")(app, MongoDB);
    require("../routes/product")(app, MongoDB);
    require("../routes/cart")(app, MongoDB);
    require("../routes/order")(app, MongoDB);
};