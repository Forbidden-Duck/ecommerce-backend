const express = require("express");
const { createID } = require("../db");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const UserSchema = require("../db/schemas/users");

/**
 * User Router
 * @param {router} app 
 * @param {import("../loaders/mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/api/user", router);

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

    router.post("/", async (req, res, next) => {
        if (!req.tokenData.admin) {
            return res.status(403).send("You are not an admin");
        }
        const body = sanitize(req.body);
        const userObj = MongoDB.client.documentToSchema("users", body);
        try {
            const user = await MongoDB.services.auth.register(userObj);
            delete user.password; // Don't send back the password...
            res.status(201).json(user);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:userid", (req, res, next) => {
        res.status(200).send(req.user);
    });

    router.put("/:userid", async (req, res, next) => {
        if (req.tokenData.userid !== req.user._id) {
            return res.status(403).send("Can't edit other users");
        }

        const body = sanitize(req.body);
        delete body.createdAt;
        delete body.modifiedAt; // Do not allow overriding of these

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

    router.delete("/:userid", async (req, res, next) => {
        if (req.tokenData.userid !== req.user._id) {
            return res.status(403).send("Can't delete other users");
        }
        try {
            const hasDelete = await MongoDB.services.user.delete(req.user._id);
            if (!hasDelete) {
                return res.status(500).send("Failed to delete user");
            }
            res.sendStatus(204);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
}