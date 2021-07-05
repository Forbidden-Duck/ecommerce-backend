const Mongo = require("../app/db");
const { Collection } = require("mongodb");


/**
 * Delete all documents (Deletes and create the collections)
 * @param {Mongo} MongoDB 
 */
module.exports.clearDB = async (MongoDB) => {
    // Get all collections
    const colls = await MongoDB.db.collections();

    // Drop the collections
    // Create the collection again
    for (const coll of colls) {
        await MongoDB.db.dropCollection(coll.collectionName);

        const collection = await MongoDB.db.createCollection(coll.collectionName);
        if (collection.collectionName === "refresh_tokens") { // Refresh_tokens has an expiry
            collection.createIndex({ createdAt: 1 }, { expireAfterSeconds: 2592000 });
        }
    }
};

/**
 * Product Seeds
 * @returns {import("../app/db/schemas/products")[]}
 */
module.exports.products = () => {
    return ([{
        _id: "100",
        name: "Hat",
        description: "Some really cool hat you could be wearing",
        price: 15
    }, {
        _id: "200",
        name: "Shirt",
        description: "A cool looking shirt I'm wearing tonight",
        price: 15
    }, {
        _id: "300",
        name: "Pants",
        description: "Pants you wish you could afford",
        price: 999
    }]);
}

// TODO Order seeds