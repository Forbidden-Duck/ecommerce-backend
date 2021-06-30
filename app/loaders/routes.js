const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");

/**
 * 
 * @param {import("express").Express} app 
 * @param {import("./mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    // TODO Auth route require("../routes/auth")(app, MongoDB);

    // /api Authentication
    app.use("/api", (req, res, next) => {
        // Check if the cookie exists
        const reTokenCookie = req.cookies["refresh_token"];
        if (reTokenCookie === undefined) {
            return res.sendStatus(403);
        }

        // Validate the cookie
        jwt.verify(reTokenCookie, CRYPTO.jwtkey, (err, data) => {
            if (err) {
                return res.sendStatus(403);
            }
            req.token = reTokenCookie;
            req.user = data;
            next();
        });
    });
    // TODO User route require("../routes/user")(app, MongoDB);
    // TODO Product route require("../routes/product")(app, MongoDB);
    // TODO Order route require("../routes/order")(app, MongoDB);
    // TODO Cart route require("../routes/cart")(app, MongoDB);
};