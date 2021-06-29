const Mongo = require("../db");
const { DB } = require("../../config");

// TODO Auth service require("../services/AuthService")
// TODO User service require("../services/UserService")
// TODO Product service require("../services/ProductService")
// TODO Order service require("../services/OrderService")
// TODO Cart service require("../services/CartService")

module.exports = async () => {
    /**
     * @type {Mongo}
     */
    const MongoDB = await (new Mongo(DB))();
    // TODO Create a new user service
    return {
        client: MongoDB,
        services: {
            auth: undefined, // TODO Add auth service
            user: undefined, // TODO Add user service
            product: undefined, // TODO Add product service
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