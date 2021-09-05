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
            const orders = await MongoDB.services.order.findMany({ userid });
            if (!orders || orders.length <= 0) {
                return res.status(404).send("Orders not found");
            }
            res.status(200).send(orders);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:orderid", (req, res, next) => {
        res.status(200).send(req.order);
    });
};
