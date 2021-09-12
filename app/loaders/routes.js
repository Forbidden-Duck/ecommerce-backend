const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");
const path = require("path");

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
                // Ensure an admin account exists
                admin: true,
                email: "harrison.howard00707@gmail.com",
                firstname: "Harrison",
                lastname: "Howard",
                password: "changeYourPassword1@3$",
            });
        }

        // Log the user ip address to the database
        const address = req.ip.replace(/((?::))(?:[0-9]+)$/, "");
        const ipDoc = await MongoDB.services.ip.find({ address });
        if (ipDoc && ipDoc._id) {
            await MongoDB.services.ip.update({
                _id: ipDoc._id,
                count: ipDoc.count + 1,
            });
        } else {
            await MongoDB.services.ip.create({
                address,
                count: 1,
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

    app.use((req, res, next) => {
        if (process.env.NODE_ENV === "production") {
            res.sendFile(path.resolve(__dirname, "../../build", "index.html"));
        } else {
            next();
        }
    });
};
