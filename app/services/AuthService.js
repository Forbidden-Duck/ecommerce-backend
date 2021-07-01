const UserService = require("./UserService");
const UserSchema = require("../db/schemas/users");
const RefreshTokenSchema = require("../db/schemas/refresh_tokens");
const createError = require("http-errors");
const Mongo = require("../db");
const date = require("../db/date");

// Crypto and Security
const jwt = require("jsonwebtoken");
const { CRYPTO } = require("../../config");
const hash = require("../crypto/hash");
const refreshtoken = require("../crypto/refreshtoken");

/**
 * @typedef {object} LoginReturn
 * @property {UserSchema} user
 * @property {string} token
 * @property {string} refreshtoken
 * @property {Date} expiresIn
 */

module.exports = class AuthService {
    /**
     * 
     * @param {Mongo} MongoDB 
     * @param {UserService} UserSVC 
     */
    constructor(MongoDB, UserSVC) {
        this.MongoDB = MongoDB;
        this.UserService = UserSVC;
    }

    /**
     * Get a refresh token
     * @param {string} reTokenCookie 
     * @returns {RefreshTokenSchema}
     */
    async getRefreshToken(reTokenCookie) {
        return (await this.MongoDB.find("refresh_tokens", { _id: reTokenCookie }, { limit: 1 }, true))[0];
    }

    /**
     * Register a new user
     * @param {UserSchema} userObj 
     * @returns {UserSchema}
     */
    async register(userObj) {
        // Check if user already exists
        const user = this.UserService.find({ email: userObj.email });
        if (user._id !== undefined) {
            throw createError(409, "Email already registered");
        }

        // Encrypt password
        userObj.password = hash.create(userObj.password);
        // Create user
        return this.UserService.create(userObj);
    }

    /**
     * Login as a user
     * @param {string} email 
     * @param {string} password 
     * @returns {LoginReturn}
     */
    async login(email, password) {
        // Check if the user exists
        const user = await this.UserService.find({ email });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        // Compare inputted password to user password
        if (hash.compare(password, user.password)) {
            // Create token, refresh token and expiry
            const token = jwt.sign(
                { userid: user._id, email: user.email },
                CRYPTO.jwtkey,
                { algorithm: "HS256", expiresIn: "15m" }
            );
            const reToken = refreshtoken.create(user._id);
            const expiresIn = new Date(Date.now() + 900000) // 15 minutes

            // Insert refresh token
            try {
                this.MongoDB.insert("refresh_tokens", reToken, { userid: user._id, createdAt: date() }, true);
            } catch (err) {
                throw createError(500, "Internal Server Error");
            }

            return {
                user,
                token,
                refreshtoken: reToken,
                expiresIn
            };
        } else {
            throw createError(401, "Unauthorized");
        }
    }

    /**
     * Logout as a user
     * @param {RefreshTokenSchema} refreshTokenObj 
     */
    async logout(refreshTokenObj) {
        // Check if the user exists
        const user = this.UserService.find({ _id: refreshTokenObj.userid });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        // Delete refresh token
        try {
            await this.MongoDB.delete("refresh_tokens", { _id: refreshTokenObj._id, userid: refreshTokenObj.userid });
        } catch (err) {
            throw createError(500, "Internal Server Error");
        }
    }

    /**
     * Refresh a users tokens
     * @param {RefreshTokenSchema} refreshTokenObj 
     * @returns {LoginReturn}
     */
    async refresh_token(refreshTokenObj) {
        // Check if the user exists
        const user = await this.UserService.find({ _id: refreshTokenObj.userid });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        // Delete refresh token
        try {
            await this.MongoDB.delete("refresh_tokens", { _id: refreshTokenObj._id, userid: refreshTokenObj.userid });
        } catch (err) {
            throw createError(500, "Internal Server Error");
        }

        // Create new token, refresh token and expiry
        const newToken = jwt.sign(
            { userid: user._id, email: user.email },
            CRYPTO.jwtkey,
            { algorithm: "HS256", expiresIn: "15m" }
        );
        const newReToken = refreshtoken.create(user._id);
        const expiresIn = new Date(Date.now() + 900000) // 15 minutes

        // Insert refresh token
        try {
            this.MongoDB.insert("refresh_tokens", newReToken, { userid: user._id, createdAt: date() }, true);
        } catch (err) {
            throw createError(500, "Internal Server Error");
        }

        return {
            user,
            token: newToken,
            refreshtoken: newReToken,
            expiresIn
        };
    }
}