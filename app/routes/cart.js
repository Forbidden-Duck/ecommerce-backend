const express = require("express");
const { createID } = require("../db");
const date = require("../db/date");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const CartSchema = require("../db/schemas/carts");
const CartItemSchema = require("../db/hidden-schemas/cartitems");

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
            const cartitem = await MongoDB.services.cart.findItem(
                req.cart._id,
                { _id: cartitemid }
            );
            if (!cartitem || cartitem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            req.cartitem = cartitem;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/", async (req, res, next) => {
        let userid = req.tokenData.userid;
        // adminBody is used to allow admins to change the find params
        if (req.tokenData.admin && req.body.adminBody) {
            userid = req.body.adminBody.userid // * implies get all so undefined
                ? req.body.adminBody.userid === "*"
                    ? undefined
                    : req.body.adminBody.userid
                : userid;
        }
        try {
            const carts = await MongoDB.services.cart.findMany({ userid });
            res.status(200).send(carts);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.post("/", async (req, res, next) => {
        let userid = req.tokenData.userid;
        // adminBody is used to allow admins to change who's cart is being created
        // and other useful params in which users can not change
        if (req.tokenData.admin && req.body.adminBody) {
            userid = req.body.adminBody.userid || userid;
        }
        const cart = await MongoDB.services.cart.find({ userid });
        if (cart && cart._id !== undefined) {
            return res.status(409).send("Cart already exists");
        }

        try {
            const cart = await MongoDB.services.cart.create(userid);
            res.status(201).send(cart);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:cartid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid && !req.tokenData.admin) {
            return res.status(403).send("Can't get other user's carts");
        }

        res.status(200).send(req.cart);
    });

    const cartItemValidate = async (req, res, next) => {
        const body = req.body;
        if (
            typeof body !== "object" ||
            typeof body.productid !== "string" ||
            typeof body.quantity !== "number" ||
            typeof body.price !== "number"
        ) {
            return res.sendStatus(400);
        }
        next();
    };
    router.post("/:cartid/items", cartItemValidate, async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid && !req.tokenData.admin) {
            return res.status(403).send("Can't edit other user's carts");
        }

        // Convert body to cart item schema
        const body = sanitize(req.body);
        let cartItemObj = MongoDB.client.documentToObject(CartItemSchema, body);

        // Add cart item information
        cartItemObj = {
            ...cartItemObj,
            _id: createID(),
            createdAt: date(),
            modifiedAt: 0,
        };

        try {
            req.cart.items.push(cartItemObj);
            const cart = await MongoDB.services.cart.update({
                _id: req.cart._id,
                items: req.cart.items,
            });
            res.status(201).send({
                cart,
                cartitem: cart.items[cartItemObj._id],
            });
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.put("/:cartid/items/:cartitemid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid && !req.tokenData.admin) {
            return res.status(403).send("Can't edit other user's carts");
        }

        // Convert body to cart item schema
        const body = sanitize(req.body);
        // Limit updatable fields to quantity and price
        const cartItemObj = MongoDB.client.documentToObject(
            { quantity: 0, price: 0 },
            body,
            true
        );
        try {
            const cartItem = req.cart.items.find(
                (item) => item._id === req.cartitem._id
            );
            if (!cartItem || cartItem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            for (const [key, value] of Object.entries(cartItemObj)) {
                // Update all key value pairs
                cartItem[key] = value;
            }

            const cart = await MongoDB.services.cart.update({
                _id: req.cart._id,
                items: req.cart.items,
            });
            res.status(200).send({
                cart,
                cartitem: cart.items[req.cartitem._id],
            });
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.delete("/:cartid/items/:cartitemid", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid && !req.tokenData.admin) {
            return res.status(403).send("Can't edit other user's carts");
        }

        try {
            const cartItem = await MongoDB.services.cart.findItem(
                req.cart._id,
                { _id: req.cartitem._id }
            );
            if (!cartItem || cartItem._id === undefined) {
                return res.status(404).send("Cart item not found");
            }
            req.cart.items = req.cart.items.filter(
                (item) => item._id !== req.cartitem._id
            );

            const cart = await MongoDB.services.cart.update({
                _id: req.cart._id,
                items: req.cart.items,
            });
            res.status(200).send({
                cart,
                cartitem: cart.items[req.cartitem._id],
            });
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.post("/:cartid/checkout", async (req, res, next) => {
        if (req.tokenData.userid !== req.cart.userid) {
            return res.status(403).send("Can't checkout other user's carts");
        }
        const body = sanitize(req.body);
        if (!body.paymentInfo) {
            return res.status(400).send("Missing payment info");
        }

        try {
            const checkout = await MongoDB.services.cart.checkout(
                req.cart._id,
                body.paymentInfo
            );
            res.status(201).send(checkout);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
};
