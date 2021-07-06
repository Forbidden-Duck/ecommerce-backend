const express = require("express");
const { createID } = require("../db");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const UserSchema = require("../db/schemas/users");

/**
 * Auth Router
 * @param {router} app 
 * @param {import("../loaders/mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/auth", router);

    const registerValidate = async (req, res, next) => {
        const body = req.body;
        if (typeof body !== "object"
            || (typeof body.email !== "string" || body.email.length < 4 || body.email.length > 32)
            || typeof body.password !== "string") {
            return res.sendStatus(400);
        }
        next();
    };
    router.post("/register", registerValidate, async (req, res) => {
        // Convert the body to the user schema
        const body = sanitize(req.body);
        // Check if they set .admin
        if (body.admin) {
            return res.status(403).send("You can not create admin accounts in /register");
        }

        const userObj = MongoDB.client.documentToSchema("users", body);

        try {
            const user = await MongoDB.services.auth.register(userObj);
            delete user.password; // Don't send back the password...
            res.status(201).json(user);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    const loginValidate = (req, res, next) => {
        const body = req.body;
        if (typeof body !== "object"
            || typeof body.email !== "string"
            || typeof body.password !== "string") {
            return res.sendStatus(400);
        }
        next();
    };
    router.post("/login", loginValidate, async (req, res) => {
        // Check if the user exists
        const body = req.body;
        try {
            // Log the user in
            const loginObj = await MongoDB.services.auth.login(body.email, body.password);

            res.cookie("refresh_token", loginObj.refreshtoken, {
                maxAge: 2.592e+9, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
            });
            res.status(200).json({
                userid: loginObj.user._id,
                token: loginObj.token,
                expiresIn: loginObj.expiresIn,
                refreshtoken: loginObj.refreshtoken
            });
        } catch (err) {
            return res.status(err.status || 500).send(err.message);
        }
    });

    const refreshtokenValidate = async (req, res, next) => {
        // Check if the cookie exists
        const reTokenCookie = req.cookies["refresh_token"];
        const reTokenDB = await MongoDB.services.auth.getRefreshToken(reTokenCookie);
        if (!reTokenDB || reTokenDB._id === undefined) {
            return res.sendStatus(401);
        }
        req.refresh_token = reTokenDB;
        next();
    };
    router.post("/refresh_token", refreshtokenValidate, async (req, res) => {
        const refresh_token = req.refresh_token;
        try {
            // Refresh the token
            const refreshObj = await MongoDB.services.auth.refresh_token(refresh_token);

            res.cookie("refresh_token", refreshObj.refreshtoken, {
                maxAge: 2.592e+9, // 30 days
                httpOnly: true,
                secure: process.env.NODE_ENV === "production" ? true : false,
            });
            res.status(200).json({
                userid: refreshObj.user._id,
                token: refreshObj.token,
                expiresIn: refreshObj.expiresIn,
                refreshtoken: refreshObj.refreshtoken
            });
        } catch (err) {
            return res.status(err.status || 500).send(err.message);
        }
    });
    router.post("/logout", refreshtokenValidate, async (req, res) => {
        const refresh_token = req.refresh_token;
        try {
            // Log user out
            await MongoDB.services.auth.logout(refresh_token);
            res.sendStatus(200);
        } catch (err) {
            return res.status(err.status || 500).send(err.message);
        }
    });
}