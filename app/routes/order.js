const express = require("express");
const { createID } = require("../db");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const OrderSchema = require("../db/schemas/orders");
const OrderItemSchema = require("../db/hidden-schemas/orderitems");

/**
 * Order Router
 * @param {router} app
 * @param {import("../loaders/mongodb").MongoService} MongoDB
 */
module.exports = (app, MongoDB) => {
    app.use("/api/order", router);

    router.param("orderid", async (req, res, next, orderid) => {
        try {
            const order = await MongoDB.services.order.find({ _id: orderid });
            if (!order || order._id === undefined) {
                return res.status(404).send("Order not found");
            }
            req.order = order;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/", async (req, res, next) => {
        let data = { userid: req.tokenData.userid };
        if (req.tokenData.admin && req.query.userid) {
            if (req.query.userid === "*") {
                delete data.userid;
            } else {
                data.userid = req.query.userid || data.userid;
            }
        }

        try {
            const orders = await MongoDB.services.order.findMany(data);
            if (!orders || orders.length <= 0) {
                return res.status(404).send("Orders not found");
            }
            res.status(200).send(orders);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:orderid", (req, res, next) => {
        if (req.tokenData.userid !== req.order.userid && !req.tokenData.admin) {
            return res.status(403).send("You can not view other user's orders");
        }
        res.status(200).send(req.order);
    });
};
