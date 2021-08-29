const UserSchema = require("../db/schemas/users");
const RefreshTokenSchema = require("../db/schemas/refresh_tokens");
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

// Crypto for encrypting password
const hash = require("../crypto/hash");

module.exports = class UserService {
    /**
     *
     * @param {Mongo} MongoDB
     */
    constructor(MongoDB) {
        this.MongoDB = MongoDB;
    }

    /**
     * Find a user
     * @param {UserSchema} data
     * @returns {UserSchema}
     */
    async find(data) {
        try {
            return (
                await this.MongoDB.find("users", data, { limit: 1 }, true)
            )[0];
        } catch (err) {
            throw createError(404, "User not found");
        }
    }

    /**
     * Find an array of users
     * @param {UserSchema} data
     * @returns {UserSchema[]}
     */
    async findMany(data) {
        try {
            return await this.MongoDB.find("users", data, {}, true);
        } catch (err) {
            throw createError(404, "Users not found");
        }
    }

    /**
     * Create a new user
     * @param {UserSchema} userObj
     * @returns {UserSchema}
     */
    async create(userObj) {
        // Create ID without overriding existing one
        if (userObj._id === undefined) {
            userObj._id = createID();
        }
        // Set createdAt & modifiedAt
        userObj.createdAt = date();
        userObj.modifiedAt = 0;

        // Create the user
        try {
            await this.MongoDB.insert("users", userObj._id, userObj, true);
        } catch (err) {
            throw createError(500, err.message);
        }

        // Check user exists
        const user = await this.find({ _id: userObj._id });
        if (!user || user._id === undefined) {
            throw createError(500, "Could not create user");
        }
        return user;
    }

    /**
     * Update user data
     * @param {UserSchema} userObj
     * @param {object} password
     * @param {RefreshTokenSchema} [refreshTokenObj]
     * @param {boolean} [admin]
     * @returns {UserSchema}
     */
    async update(userObj, password, refreshTokenObj, admin) {
        // Check if user exists
        const user = await this.find({ _id: userObj._id });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }
        // Get the admin user if admin is true
        let adminUser;
        if (admin) {
            adminUser = await this.find({ _id: password.userid });
            if (!adminUser || adminUser._id === undefined) {
                throw createError(404, "Admin user not found");
            }
        }
        // Check password exists
        if (
            typeof password !== "object" ||
            typeof password.password !== "string" ||
            password.password.length <= 0
        ) {
            // No password is required if authed under Google
            if (
                (admin && !adminUser.authedGoogle) ||
                (!admin && !user.authedGoogle)
            ) {
                throw createError(
                    400,
                    "Password is required to validate the user"
                );
            }
        }

        if (
            (admin && adminUser.authedGoogle) ||
            (!admin && user.authedGoogle) ||
            hash.compare(
                password.password,
                admin ? adminUser.password : user.password
            )
        ) {
            // Set modifiedAt
            userObj.modifiedAt = date();

            // If password is set, encrypt it
            if (userObj.password !== undefined) {
                userObj.password = hash.create(userObj.password);
                // Log user out of all sessions but current
                // If no token was found, just delete all refresh_tokens
                const filter = { userid: user._id };
                if (refreshTokenObj && refreshTokenObj._id)
                    filter._id = { $ne: refreshTokenObj._id };
                await this.MongoDB.deleteMany("refresh_tokens", filter);
                userObj.authedGoogle = false; // Set to false once the user's password has been changed (unless already false)
            }

            // Update user
            try {
                await this.MongoDB.update(
                    "users",
                    { _id: userObj._id },
                    { $set: userObj }
                );
            } catch (err) {
                throw createError(500, err.message);
            }

            // Get the updated user
            const updatedUser = await this.find({ _id: userObj._id });
            if (!updatedUser || updatedUser._id === undefined) {
                throw createError(500, "Internal Server Error");
            }
            return updatedUser;
        } else {
            throw createError(401, "Unauthorized");
        }
    }

    /**
     * Delete a user
     * @param {string} userID
     * @param {object} password
     * @param {boolean} [admin]
     * @returns {boolean}
     */
    async delete(userID, password, admin) {
        // Check password exists
        if (
            typeof password !== "object" ||
            typeof password.password !== "string" ||
            password.password.length <= 0
        ) {
            throw createError(400, "Password is required to validate the user");
        }

        // Check if user exists
        const user = await this.find({ _id: userID });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }
        // Get the admin user if admin is true
        let adminUser;
        if (admin) {
            adminUser = await this.find({ _id: password.userid });
            if (!adminUser || adminUser._id === undefined) {
                throw createError(404, "Admin user not found");
            }
        }

        if (
            hash.compare(
                password.password,
                admin ? adminUser.password : user.password
            )
        ) {
            // Delete the user
            try {
                await this.MongoDB.delete("users", { _id: userID });
                // Delete all user refresh_tokens
                await this.MongoDB.deleteMany("refresh_tokens", {
                    userid: user._id,
                });
            } catch (err) {
                throw createError(500, err.message);
            }

            const userDeleted = await this.find({ _id: userID });
            return !userDeleted || userDeleted._id === undefined;
        } else {
            throw createError(401, "Unauthorized");
        }
    }
};
