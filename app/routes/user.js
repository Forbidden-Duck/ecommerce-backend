const express = require("express");
const { createID } = require("../db");
const router = express.Router();

const UserSchema = require("../db/schemas/users");

/**
 * User Router
 * @param {router} app 
 * @param {import("../loaders/mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/user", router);

    router.param("userid", async (req, res, next, userid) => {
        try {
            const user = await MongoDB.services.user.find({ _id: userid });
            if (!user || user._id === undefined) {
                return res.status(404).send("User not found");
            }
            req.user = user;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:userid", (req, res, next) => {
        res.status(200).send(req.user);
    });

    router.put("/:userid", (req, res, next) => {
        const body = req.body;
        const userObj = MongoDB.client.documentToSchema("users", body, true); // Remove bad fields
        userObj._id = req.user._id; // Ensure the _id exists
        try {
            const user = await MongoDB.services.user.update(userObj);
            delete user.password // Don't send back the password;
            res.status(200).json(user);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.delete("/:userid", (req, res, next) => {
        try {
            await MongoDB.services.user.delete(req.user._id);
            res.sendStatus(200);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
}