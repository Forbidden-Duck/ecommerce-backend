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

    router.get("/", async (req, res, next) => {
        if (!req.tokenData.admin) {
            return res.status(403).send("You are not an admin");
        }

        try {
            const users = await MongoDB.services.user.findMany({});
            if (!users || users.length <= 0) {
                return res.status(404).send("Users not found");
            }
            for (const user of users) {
                delete user.password; // Don't send that.....
            }
            res.status(200).send(users);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:userid", (req, res, next) => {
        const user = Object.assign({}, req.user);
        delete user.password; // Don't send that...........
        res.status(200).send(user);
    });

    const refreshtokenCheck = async (req, res, next) => {
        // Check if the cookie exists
        const reTokenCookie = req.cookies["refresh_token"];
        const reTokenDB = await MongoDB.services.auth.getRefreshToken(
            reTokenCookie
        );
        if (reTokenDB && reTokenDB._id) {
            req.refresh_token = reTokenDB;
        }
        next();
    };
    router.put("/:userid", refreshtokenCheck, async (req, res, next) => {
        if (req.tokenData.userid !== req.user._id && !req.tokenData.admin) {
            return res.status(403).send("Can't edit other users");
        }

        const body = sanitize(req.body);
        const user = body.user || {};
        delete user.createdAt;
        delete user.modifiedAt; // Do not allow overriding of these

        if (user.admin && !req.tokenData.admin) {
            return res
                .status(403)
                .send("You can not make your account an admin");
        } else if (user.admin == false && req.tokenData.admin) {
            return res
                .status(403)
                .send("You can not add admin=false to the body");
        }

        const userObj = MongoDB.client.documentToSchema("users", user, true); // Remove bad fields
        userObj._id = req.user._id; // Ensure the _id exists
        try {
            const user = await MongoDB.services.user.update(
                userObj,
                body.password,
                req.refresh_token
            );
            delete user.password; // Don't send back the password;
            res.status(200).json(user);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.delete("/:userid", async (req, res, next) => {
        if (req.tokenData.userid !== req.user._id && !req.tokenData.admin) {
            return res.status(403).send("Can't delete other users");
        }
        // Admins can't delete their own or other admin accounts
        const user = await MongoDB.services.user.find({ _id: req.user._id });
        if (user && user.admin) {
            return res
                .status(403)
                .send("Can't delete your or other admin accounts");
        }

        try {
            const hasDelete = await MongoDB.services.user.delete(
                req.user._id,
                req.body.password
            );
            if (!hasDelete) {
                return res.status(500).send("Failed to delete user");
            }
            res.sendStatus(204);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
};
