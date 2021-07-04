const express = require("express");
const { createID } = require("../db");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const CartSchema = require("../db/schemas/carts");
const { CartItemSchema } = require("../db/schemas/carts");

/**
 * User Router
 * @param {router} app 
 * @param {import("../loaders/mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/api/cart", router);

    router.param("cartid", async (req, res, next, cartid) => {
        try {
            const cart = await MongoDB.services.cart.find({ _id: cartid });
            if (!cart || cart._id === undefined) {
                return res.status(404).send("Cart not found");
            }
            req.cart = cart;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.param("cartitemid", async (req, res, next, cartitemid) => {
        try {
            const cartitem = await MongoDB.services.cart.findItem(req.cart._id, { _id: cartitemid });
            if (!cartitem || cartitem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            req.cartitem = cartitem;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.post("/", cartValidate, async (req, res, next) => {
        try {
            const cart = await MongoDB.services.cart.create(req.tokenData.userid);
            res.status(201).send(cart);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:cartid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid) {
            return res.status(403).send("Can't get other user's carts");
        }

        res.status(200).send(req.cart);
    });

    const cartItemValidate = async (req, res, next) => {
        const body = req.body;
        if (typeof body !== "object"
            || typeof body.productid !== "string"
            || typeof body.quantity !== "number"
            || typeof body.price !== "number") {
            return res.sendStatus(400);
        }
        next();
    };
    router.post("/:cartid/items", cartItemValidate, async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid) {
            return res.status(403).send("Can't edit other user's carts");
        }

        // Convert body to cart item schema
        const body = sanitize(req.body);
        const cartItemObj = MongoDB.client.documentToObject(CartItemSchema, body);
        try {
            req.cart.items.push(cartItemObj);
            const cart = await MongoDB.services.cart.update({ items: req.cart.items });
            res.status(201).send(cart);
        } catch (error) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.put("/:cartid/items/:cartitemid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid) {
            return res.status(403).send("Can't edit other user's carts");
        }

        // Convert body to cart item schema
        const body = sanitize(req.body);
        // Limit updatable fields to quantity and price
        const cartItemObj = MongoDB.client.documentToObject({ quantity: 0, price: 0 }, body, true);
        try {
            const cartItem = await MongoDB.services.cart.findItem(req.cart._id, { _id: req.cartitem._id });
            if (!cartItem || cartItem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            for (const [key, value] of Object.entries(cartItemObj)) { // Update all key value pairs
                cartItem[key] = value;
            }

            const cart = await MongoDB.services.cart.update({ items: req.cart.items });
            res.status(200).send(cart);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.delete("/:cartid/items/:cartitemid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid) {
            return res.status(403).send("Can't edit other user's carts");
        }

        try {
            const cartItem = await MongoDB.services.cart.findItem(req.cart._id, { _id: req.cartitem._id });
            if (!cartItem || cartItem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            req.cart.items = req.cart.items.filter(item => item._id !== req.cartitem._id);

            const cart = await MongoDB.services.cart.update({ items: req.cart.items });
            res.status(200).send(cart);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.post("/:cartid/checkout", async (req, res, next) => {
        try {
            const checkout = await MongoDB.services.cart.checkout(req.cart._id);
            res.status(201).send(checkout);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
}