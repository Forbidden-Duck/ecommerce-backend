const IPSchema = require("../db/schemas/iplog");
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Seperate imports to fix typings
const date = require("../db/date");

module.exports = class IPService {
    /**
     *
     * @param {Mongo} MongoDB
     */
    constructor(MongoDB) {
        this.MongoDB = MongoDB;
    }

    /**
     * Find a ip address
     * @param {IPSchema} data
     * @returns {IPSchema}
     */
    async find(data) {
        try {
            return (
                await this.MongoDB.find("iplog", data, { limit: 1 }, true)
            )[0];
        } catch (err) {
            throw createError(404, "IP not found");
        }
    }

    /**
     * Create a ip address
     * @param {IPSchema} ipObj
     * @returns {IPSchema}
     */
    async create(ipObj) {
        // Create ID without overriding existing one
        if (!ipObj._id) {
            ipObj._id = createID();
        }
        // Set createdAt & modifiedAt
        ipObj.createdAt = date();
        ipObj.modifiedAt = 0;

        // Create the IP
        try {
            await this.MongoDB.insert("iplog", ipObj._id, ipObj, true);
        } catch (err) {
            throw createError(500, err.message);
        }

        // Check the user exists
        const ip = await this.find({ _id: ipObj._id });
        if (!ip || !ip._id) {
            throw createError(500, "Could not create IP address");
        }
        return ip;
    }

    /**
     * Update ip address
     * @param {IPSchema} ipObj
     */
    async update(ipObj) {
        // Check if IP exists
        const ip = await this.find({ _id: ipObj._id });
        if (!ip || !ip._id) {
            throw createError(404, "IP not found");
        }

        // Set modifiedAt
        ipObj.modifiedAt = date();

        // Update IP
        try {
            await this.MongoDB.update(
                "iplog",
                { _id: ipObj._id },
                {
                    $set: ipObj,
                }
            );
        } catch (err) {
            throw createError(500, err.message);
        }

        // Get the updated IP address
        const updatedIP = await this.find({ _id: ipObj._id });
        if (!updatedIP || !updatedIP._id) {
            throw createError(500, "Internal Server Error");
        }
        return updatedIP;
    }
};
