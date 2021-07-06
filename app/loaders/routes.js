const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");

/**
 * 
 * @param {import("express").Express} app 
 * @param {import("./mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/", async (req, res, next) => {
        // If an admin exists, one will return
        const admin = await MongoDB.services.user.find({ admin: true });
        if (!admin || admin._id === undefined) {
            MongoDB.services.auth.register({
                admin: true,
                email: "harrison.howard00707@gmail.com",
                firstname: "Harrison",
                lastname: "Howard",
                password: "changeYourPassword1@3$"
            });
        }
        next();
    });

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