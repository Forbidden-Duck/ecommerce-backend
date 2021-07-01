const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");

/**
 * 
 * @param {import("express").Express} app 
 * @param {import("./mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
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
                req.user = data;
                next();
            });
        } else {
            res.sendStatus(400);
        }
    });
    // TODO User route require("../routes/user")(app, MongoDB);
    // TODO Product route require("../routes/product")(app, MongoDB);
    // TODO Order route require("../routes/order")(app, MongoDB);
    // TODO Cart route require("../routes/cart")(app, MongoDB);
};