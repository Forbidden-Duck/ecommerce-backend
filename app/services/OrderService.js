const OrderSchema = require("../db/schemas/orders");
const { OrderItem } = require("../db/schemas/orders"); // Fixes typings breaking
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

module.exports = class OrderService {
    /**
     *
     * @param {Mongo} MongoDB
     */
    constructor(MongoDB) {
        this.MongoDB = MongoDB;
    }

    /**
     * Find a order
     * @param {OrderSchema} data
     * @returns {OrderSchema}
     */
    async find(data) {
        try {
            return (
                await this.MongoDB.find("orders", data, { limit: 1 }, true)
            )[0];
        } catch (err) {
            throw createError(404, "Order not found");
        }
    }

    /**
     * Find a order
     * @param {OrderSchema} data
     * @returns {OrderSchema[]}
     */
    async findMany(data) {
        try {
            return await this.MongoDB.find("orders", data, {}, true);
        } catch (err) {
            throw createError(404, "Order not found");
        }
    }

    /**
     * Find an order item
     * @param {string} orderID OrderID specific to the item
     * @param {OrderItem} data
     */
    async findItem(orderID, data) {
        // Check if order exists
        const order = await this.find({ _id: orderID });
        if (!order || order._id === undefined) {
            throw createError(404, "Order not found");
        }

        // Find the item on that order
        return order.items.find((orderItem) => {
            for (const [key, value] of Object.entries(data)) {
                // Compare two objects
                if (orderItem[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Find all user specific orders
     * @param {string} userID
     * @returns {OrderSchema[]}
     */
    async findOrdersByUser(userID) {
        try {
            return await this.MongoDB.find("orders", { userid: userID }, {});
        } catch (err) {
            throw createError(404, "Orders not found");
        }
    }

    /**
     * Create a new order
     * @param {OrderSchema} orderObj
     * @returns {OrderSchema}
     */
    async create(orderObj) {
        // Create ID without overriding existing one
        if (orderObj._id === undefined) {
            orderObj._id = createID();
        }
        // Set createdAt & modifiedAt
        orderObj.createdAt = date();
        orderObj.modifiedAt = 0;

        // Create the order
        try {
            await this.MongoDB.insert("orders", orderObj._id, orderObj, true);
        } catch (err) {
            throw createError(500, err.message);
        }

        // Check order exists
        const order = await this.find({ _id: orderObj._id });
        if (!order || order._id === undefined) {
            throw createError(500, "Could not create order");
        }
        return order;
    }

    /**
     * Update order data
     * @param {OrderSchema} orderObj
     * @returns {OrderSchema}
     */
    async update(orderObj) {
        // Check if order exists
        const order = await this.find({ _id: orderID });
        if (!order || order._id === undefined) {
            throw createError(404, "Order not found");
        }

        // Set modified
        orderObj.modifiedAt = date();

        // Update order
        try {
            await this.MongoDB.update(
                "orders",
                { _id: orderObj._id },
                { $set: orderObj }
            );
        } catch (err) {
            throw createError(500, err.message);
        }

        // Get the updated order
        const updatedOrder = await this.find({ _id: orderObj._id });
        if (!updatedOrder || updatedOrder._id === undefined) {
            throw createError(500, "Internal Server Error");
        }
        return updatedOrder;
    }

    /**
     * Delete a order
     * @param {string} orderID
     * @returns {boolean}
     */
    async delete(orderID) {
        // Check if order exists
        const order = await this.find({ _id: orderID });
        if (!order || order._id === undefined) {
            throw createError(404, "Order not found");
        }

        // Delete the order
        try {
            await this.MongoDB.delete("orders", { _id: orderID });
        } catch (err) {
            throw createError(500, err.message);
        }

        const orderDeleted = await this.find({ _id: orderID });
        return !orderDeleted || orderDeleted._id === undefined;
    }
};
