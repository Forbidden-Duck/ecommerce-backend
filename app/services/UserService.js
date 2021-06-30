const UserSchema = require("../db/schemas/users");
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

module.exports = class UserService {
    /**
     * 
     * @param {Mongo} MongoDB 
     */
    constructor(MongoDB) {
        this.MongoDB = MongoDB
    }

    /**
     * Find a user
     * @param {UserSchema} data 
     * @returns {UserSchema}
     */
    async find(data) {
        try {
            return (await this.MongoDB.find("users", data, { limit: 1 }, true))[0];
        } catch (err) {
            throw createError(404, "User not found");
        }
    }

    /**
     * Create a new user
     * @param {UserSchema} userObj
     * @returns {UserSchema}
     */
    async create(userObj) {
        // Create ID without overriding existing one
        userObj = Object.assign({ _id: createID() }, userObj);
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
     * @returns {UserSchema}
     */
    async update(userObj) {
        // Check if user exists
        const user = await this.find({ _id: userObj._id });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        // Set modifiedAt
        userObj.modifiedAt = date();

        // Update user
        try {
            await this.MongoDB.update("users", { _id: userObj._id }, { $set: userObj });
        } catch (err) {
            throw createError(500, err.message);
        }

        // Get the updated user
        const updatedUser = await this.find({ _id: userObj._id });
        if (!updatedUser || updatedUser._id === undefined) {
            throw createError(500, "Internal Server Error");
        }
        return updatedUser;
    }

    /**
     * Delete a user
     * @param {string} userID
     * @returns {boolean}
     */
    async delete(userID) {
        // Check if user exists
        const user = await this.find({ _id: userObj._id });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        // Delete the user
        try {
            await this.MongoDB.delete("products", { _id: userID });
        } catch (err) {
            throw createError(500, err.message);
        }

        const userDeleted = await this.find({ _id: userObj._id });
        return !userDeleted || userDeleted._id === undefined;
    }
}