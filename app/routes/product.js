const express = require("express");
const { createID } = require("../db");
const router = express.Router();
const sanitize = require("mongo-sanitize");

const ProductSchema = require("../db/schemas/products");

/**
 * User Router
 * @param {router} app 
 * @param {import("../loaders/mongodb").MongoService} MongoDB 
 */
module.exports = (app, MongoDB) => {
    app.use("/api/product", router);

    router.param("productid", async (req, res, next, productid) => {
        try {
            const product = await MongoDB.services.product.find({ _id: productid });
            if (!product || product._id === undefined) {
                return res.status(404).send("Product not found");
            }
            req.product = product;
            next();
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/", async (req, res, next) => {
        const body = sanitize(req.body);
        const productObj = MongoDB.client.documentToSchema("products", body, true);

        try {
            const products = await MongoDB.services.product.findMany(productObj);
            if (!products || products.length <= 0) {
                return res.status(404).send("Products not found");
            }
            res.status(200).send(products);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.get("/:productid", async (req, res, next) => {
        res.status(200).send(req.product);
    });

    // TODO Product POST PUT DELETE (Admin ability)
}