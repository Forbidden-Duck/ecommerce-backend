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

    router.post("/", async (req, res, next) => {
        if (!req.tokenData.admin) {
            return res.status(403).send("You are not an admin");
        }

        const body = sanitize(req.body);
        const productObj = MongoDB.client.documentToSchema("products", body);
        try {
            const product = await MongoDB.services.product.create(productObj);
            res.status(201).send(product);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.put("/:productid", async (req, res, next) => {
        if (!req.tokenData.admin) {
            return res.status(403).send("You are not an admin");
        }

        const body = sanitize(req.body);
        delete body.createdAt;
        delete body.modifiedAt; // Do not allow overriding these
        const productObj = MongoDB.client.documentToSchema("products", body, true);
        productObj._id = req.product._id; // Ensure the _id exists
        try {
            const product = await MongoDB.services.product.update(productObj);
            res.status(200).send(product);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });

    router.delete("/:productid", async (req, res, next) => {
        if (!req.tokenData.admin) {
            return res.status(403).send("You are not an admin");
        }

        try {
            const hasDelete = await MongoDB.services.product.delete(req.product._id);
            if (!hasDelete) {
                return res.status(500).send("Failed to delete product");
            }
            res.sendStatus(204);
        } catch (err) {
            res.status(err.status || 500).send(err.message);
        }
    });
}