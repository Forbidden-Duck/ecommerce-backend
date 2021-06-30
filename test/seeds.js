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
 * Seed users
 * @param {Mongo} MongoDB 
 */
module.exports.users = MongoDB => {
    // TODO User seeds
};

// TODO Product seeds

// TODO Order seeds

// TODO Cart seeds