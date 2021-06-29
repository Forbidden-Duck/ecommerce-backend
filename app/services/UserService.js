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
     * Create a new user
     * @param {UserSchema} userObj
     * @returns {UserSchema}
     */
    async create(userObj) {
        // Create ID
        userObj._id = createID();
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
        if (!user) {
            throw createError(500, "Could not create user");
        }
        return user;
    }

    /**
     * Update user data
     * @param {UserSchema} userObj 
     */
    async update(userObj) {
        // Check if user exists
        const user = await this.find({ _id: userObj._id });
        if (!user) {
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
        if (!updatedUser) {
            throw createError(503, "Internal Server Error");
        }
        return updatedUser;
    }

    /**
     * Find a user
     * @param {UserSchema} data 
     * @returns {UserSchema}
     */
    async find(data) {
        try {
            return (await this.MongoDB.find("users", data, { limit: 1 }))[0];
        } catch (err) {
            throw createError(404, "User not found");
        }
    }
}