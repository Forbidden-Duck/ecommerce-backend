const CartSchema = require("../db/schemas/carts");
const { CartItem } = require("../db/schemas/carts"); // Fixes typings breaking
const OrderService = require("./OrderService");
const OrderSchema = require("../db/schemas/orders");
const { OrderItem } = require("../db/schemas/orders"); // Fixes typings breaking
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

/**
 * @typedef {object} checkout
 * @property {OrderSchema} orders
 * @property {*} charge
 */

module.exports = class CartService {
    /**
     * 
     * @param {Mongo} MongoDB 
     * @param {OrderService} OrderSVC
     */
    constructor(MongoDB, OrderSVC) {
        this.MongoDB = MongoDB
        this.OrderService = OrderSVC;
    }

    /**
     * Find a cart
     * @param {CartSchema} data 
     * @returns {CartSchema}
     */
    async find(data) {
        try {
            return (await this.MongoDB.find("carts", data, { limit: 1 }, true))[0];
        } catch (err) {
            throw createError(404, "Cart not found");
        }
    }

    /**
     * Find a cart item
     * @param {string} cartID 
     * @param {CartItem} data 
     */
    async findItem(cartID, data) {
        // Check if the cart exists
        const cart = await this.find({ _id: cartID });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Find the item on that cart
        return cart.items.find(cartItem => {
            for (const [key, value] of Object.entries(data)) { // Compare two objects
                if (cartItem[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Create a new cart
     * @param {CartSchema} cartObj 
     * @returns {CartSchema}
     */
    async create(cartObj) {
        // Create ID without overriding existing one
        if (cartObj._id === undefined) {
            cartObj._id = createID();
        }
        // Set createdAt & modifiedAt
        cartObj.createdAt = date();
        cartObj.modifiedAt = 0;

        // Create the cart
        try {
            await this.MongoDB.insert("carts", cartObj._id, cartObj, true);
        } catch (err) {
            throw createError(500, err.message);
        }

        // Check cart exists
        const cart = await this.find({ _id: cartObj._id });
        if (!cart || cart._id === undefined) {
            throw createError(500, "Could not create cart");
        }
        return cart;
    }

    /**
     * Update cart data
     * @param {CartSchema} cartObj 
     * @returns {CartSchema}
     */
    async update(cartObj) {
        // Check if the cart exists
        const cart = await this.find({ _id: cartID });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Set modified
        cartObj.modifiedAt = date();

        // Update cart
        try {
            await this.MongoDB.update("carts", { _id: cartObj._id }, { $set: cartObj });
        } catch (err) {
            throw createError(500, err.message);
        }

        // Get the updated cart
        const updatedCart = await this.find({ _id: cartObj._id });
        if (!updatedCart || updatedCart._id === undefined) {
            throw createError(500, "Internal Server Error");
        }
        return updatedCart;
    }

    /**
     * Cart checkout
     * @param {string} cartID
     * @returns {checkout}
     */
    async checkout(cartID) {
        // TODO Add stripe
        // Check if the cart exists
        const cart = await this.find({ _id: cartID });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Get total price of all items
        const total = cart.items.reduce((total, item) => {
            return total += item.price;
        }, 0);

        // Create order
        /**
         * @type {OrderSchema}
         */
        const orderObj = {
            userid: cart.userid,
            total: total,
            items: cart.items
        };
        const order = this.OrderService.create(orderObj);

        // Make the charge to the user
        const charge = "Not available"; // Stripe not connected yet
        order.status = "COMPLETED";
        return {
            order: order,
            charge: charge
        };
    }
}