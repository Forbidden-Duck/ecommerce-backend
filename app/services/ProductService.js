const ProductSchema = require("../db/schemas/products");
const createError = require("http-errors");
const Mongo = require("../db");
const { createID } = require("../db"); // Fixes typings breaking
const date = require("../db/date");

module.exports = class ProductService {
    /**
     * 
     * @param {Mongo} MongoDB 
     */
    constructor(MongoDB) {
        this.MongoDB = MongoDB
    }

    /**
     * Find a product
     * @param {ProductSchema} data 
     * @returns {ProductSchema}
     */
    async find(data) {
        try {
            return (await this.MongoDB.find("products", data, { limit: 1 }, true))[0];
        } catch (err) {
            throw createError(404, "Product not found");
        }
    }

    /**
     * Find an array of products
     * @param {ProductSchema} data 
     * @returns {ProductSchema[]}
     */
    async findMany(data) {
        try {
            return (await this.MongoDB.find("products", data, {}, true));
        } catch (err) {
            throw createError(404, "Products not found");
        }
    }

    /**
     * Create a new product
     * @param {ProductSchema} productObj 
     * @returns {ProductSchema}
     */
    async create(productObj) {
        // Create ID without overriding existing one
        if (productObj._id === undefined) {
            productObj._id = createID();
        }
        // Set createdAt & modifiedAt
        productObj.createdAt = date();
        productObj.modifiedAt = 0;

        // Create the product
        try {
            await this.MongoDB.insert("products", productObj._id, productObj, true);
        } catch (err) {
            throw createError(500, err.message);
        }

        // Check product exists
        const product = await this.find({ _id: productObj._id });
        if (!product || product._id === undefined) {
            throw createError(500, "Could not create product");
        }
        return product;
    }

    /**
     * Update product data
     * @param {ProductSchema} productObj 
     * @returns {ProductSchema}
     */
    async update(productObj) {
        // Check if product exists
        const product = await this.find({ _id: productObj._id });
        if (!product || product._id === undefined) {
            throw createError(404, "Product not found");
        }

        // Set modifiedAt
        productObj.modifiedAt = date();

        // Update product
        try {
            await this.MongoDB.update("products", { _id: product._id }, { $set: productObj });
        } catch (err) {
            throw createError(500, err.message);
        }

        // Get the updated product
        const updatedProduct = await this.find({ _id: product._id });
        if (!updatedProduct || updatedProduct._id === undefined) {
            throw createError(500, "Internal Server Error");
        }
        return updatedProduct;
    }

    /**
     * Delete a product
     * @param {string} productID 
     * @returns {boolean}
     */
    async delete(productID) {
        // Check if the product exists
        const product = await this.find({ _id: productID });
        if (!product || product._id === undefined) {
            throw createError(404, "Product not found");
        }

        // Delete the product
        try {
            await this.MongoDB.delete("products", { _id: productID });
        } catch (err) {
            throw createError(500, err.message);
        }

        const productDeleted = await this.find({ _id: productID });
        return !productDeleted || productDeleted._id === undefined;
    }
}