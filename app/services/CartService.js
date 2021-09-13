const CartSchema = require("../db/schemas/carts");
const { CartItem } = require("../db/schemas/carts"); // Fixes typings breaking
const OrderSchema = require("../db/schemas/orders");
const { OrderItem } = require("../db/schemas/orders"); // Fixes typings breaking
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

const OrderService = require("./OrderService");
const UserService = require("./UserService");
const ProductService = require("./ProductService");

// Initialise Stripe
const { STRIPE } = require("../../config");
/**
 * @type {import "stripe".Stripe}
 */
const stripe = require("stripe")(STRIPE);

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
     * @param {UserService} UserSVC
     * @param {ProductService} ProductSVC
     */
    constructor(MongoDB, OrderSVC, UserSVC, ProductSVC) {
        this.MongoDB = MongoDB;
        this.OrderService = OrderSVC;
        this.UserService = UserSVC;
        this.ProductService = ProductSVC;
    }

    /**
     * Find a cart
     * @param {CartSchema} data
     * @returns {CartSchema}
     */
    async find(data) {
        try {
            return (
                await this.MongoDB.find("carts", data, { limit: 1 }, true)
            )[0];
        } catch (err) {
            throw createError(404, "Cart not found");
        }
    }

    /**
     * Find a cart
     * @param {CartSchema} data
     * @returns {CartSchema[]}
     */
    async findMany(data) {
        try {
            return await this.MongoDB.find("carts", data, {}, true);
        } catch (err) {
            throw createError(404, "Carts not found");
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
        return cart.items.find((cartItem) => {
            for (const [key, value] of Object.entries(data)) {
                // Compare two objects
                if (cartItem[key] !== value) {
                    return false;
                }
            }
            return true;
        });
    }

    /**
     * Create a new cart
     * @param {string} userid
     * @returns {CartSchema}
     */
    async create(userid) {
        // Check if user exists
        const user = await this.UserService.find({ _id: userid });
        if (!user || user._id === undefined) {
            throw createError(404, "User not found");
        }

        /**
         * @type {CartSchema}
         */
        const cartObj = {
            _id: createID(),
            userid: user._id,
            createdAt: date(),
            modifiedAt: 0,
        };

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
        const cart = await this.find({ _id: cartObj._id });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Set modified
        cartObj.modifiedAt = date();

        // Update cart
        try {
            await this.MongoDB.update(
                "carts",
                { _id: cartObj._id },
                { $set: cartObj }
            );
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
     * Delete a cart
     * @param {string} cartID
     * @returns {boolean}
     */
    async delete(cartID) {
        // Check if the cart exists
        const cart = await this.find({ _id: cartID });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Delete the cart
        try {
            await this.MongoDB.delete("carts", { _id: cartID });
        } catch (err) {
            throw createError(500, err.message);
        }

        const cartDeleted = await this.find({ _id: cartID });
        return !cartDeleted || cartDeleted._id === undefined;
    }

    /**
     * Cart checkout
     * @param {string} cartID
     * @param {object} paymentInfo
     * @returns {checkout}
     */
    async checkout(cartID, paymentInfo) {
        // Check if the cart exists
        const cart = await this.find({ _id: cartID });
        if (!cart || cart._id === undefined) {
            throw createError(404, "Cart not found");
        }

        // Check if product items exist
        if (!cart.items || cart.items.length <= 0) {
            throw createError(400, "No items in the cart");
        }
        for (const item of cart.items) {
            const product = await this.ProductService.find({
                _id: item.productid,
            });
            if (!product || product._id === undefined) {
                throw createError(404, "Product item not found");
            }
        }

        // Get total price of all items
        const total = cart.items.reduce((total, item) => {
            return (total += item.price);
        }, 0);

        // Delete cart
        const hasDeletedCart = this.delete(cart._id);
        if (!hasDeletedCart) {
            throw createError(500, "Failed to delete the cart on checkout");
        }

        // Create order
        let status = "PROCESSING";
        /**
         * @type {OrderSchema}
         */
        const orderObj = {
            userid: cart.userid,
            total: total,
            items: cart.items,
            status,
        };
        const orderCreated = await this.OrderService.create(orderObj);

        let charge;
        try {
            charge = await stripe.charges.create({
                amount: parseInt(total.toFixed(2)),
                currency: "usd",
                source: paymentInfo.id,
                description: "Ecommerce Charge",
            });
            console.log(charge);
        } catch (err) {
            status = "FAILED";
            charge = err.message;
        }
        if (charge) {
            switch (charge.status) {
                case "succeeded":
                    status = "SUCCESS";
                    break;
                default:
                    status = "FAILED";
                    break;
            }
        }
        const order = await this.OrderService.update({
            _id: orderCreated._id,
            status,
            payment: charge,
        });

        return {
            order,
            charge,
        };
    }
};
