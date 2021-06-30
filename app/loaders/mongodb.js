const Mongo = require("../db");
const { DB } = require("../../config");

const AuthService = require("../services/AuthService");
const UserService = require("../services/UserService");
const ProductService = require("../services/ProductService");
// TODO Order service require("../services/OrderService");
// TODO Cart service require("../services/CartService");

module.exports = async () => {
    /**
     * @type {Mongo}
     */
    const MongoDB = await (new Mongo(DB))();
    const user = new UserService(MongoDB); // Auth service requires this service
    return {
        client: MongoDB,
        services: {
            auth: new AuthService(MongoDB, user),
            user: user,
            product: new ProductService(MongoDB),
            order: undefined, // TODO Add order service
            cart: undefined // TODO Add cart service
        }
    }
};

/**
 * @typedef {object} MongoService
 * @property {Mongo} client
 * @property {object} services
 * @property {AuthService} services.auth
 * @property {UserService} services.user
 * @property {ProductService} services.product
 * @property {OrderService} services.order
 * @property {CartService} services.cart
 */

/**
 * @type {MongoService}
 */
module.exports.MongoService = {}; // Provides the MongoService type to other files