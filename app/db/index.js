const mongodb = require("mongodb");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

/**
 * @typedef {Object} Mongo
 * @property {String} host Host Address
 * @property {String} name Host Name
 * @property {Object} [auth] Auth (Not required)
 * @property {String} auth.username Auth Username
 * @property {String} auth.password Auth Password
 */
const MongoOptions = { useUnifiedTopology: true };

module.exports = class MongoDB {
    /**
     * 
     * @param {Mongo} mongo 
     */
    constructor(mongo) {
        this.mongo = mongo;
        if (this.mongo.auth != undefined) {
            this.url =
                `mongodb://${this.mongo.auth.username}:${this.mongo.auth.password}@${this.mongo.host}/`;
        } else {
            this.url =
                `mongodb://${this.mongo.host}/`;
        }

        this.schemas = {};
        // Requires all schemas
        const schemasFileName = fs.readdirSync(__dirname + "/schemas");
        schemasFileName.forEach(file => {
            this.schemas[path.parse(file).name] = require("./schemas/" + file);
        });

        return async () => {
            try {
                this.client = await (new mongodb.MongoClient(this.url + this.mongo.name, MongoOptions)).connect();
                if (!(this.client instanceof mongodb.MongoClient)) {
                    console.error("Failed to connect to MongoDB Database");
                    return;
                } else {
                    console.log("Connected to the MongoDB Database");
                }

                this.db = this.client.db(this.mongo.name);
                const collections = await this.db.collections();
                // Create a collection for every schema
                Object.keys(this.schemas).forEach(schemaName => {
                    if (collections.find(coll => coll.collectionName === schemaName) == undefined) {
                        this.db.createCollection(schemaName);
                    }
                });
            } catch (err) {
                console.error(err);
            }
            return this;
        };
    }

    static createID() {
        const randomNumber = Math.floor(Math.random() * 999999);
        const currentTime = new Date().getTime();
        return crypto.createHash("sha256").update((randomNumber + currentTime).toString()).digest("hex");
    }

    getCollection(name) {
        return this.db.collection(name);
    }

    getSchema(name) {
        return this.schemas[name];
    }

    /** 
     * @param {String} collName 
     * @param {Object} filter 
     * @param {mongodb.FindOneOptions} [options]
     * @param {Boolean} [useSchema]
     * @returns {Promise<Array<*>>}
    */
    async find(collName, filter, options, useSchema) {
        const collection = this.getCollection(collName);
        let documents = await collection.find(filter, options).toArray();
        if (useSchema == true) {
            if (documents.length != 0) {
                for (const documentIndex in documents) {
                    const schema = Object.assign({}, this.getSchema(collName));
                    const document = documents[documentIndex];
                    if (typeof document === "object") {
                        documents[documentIndex] = Object.assign(schema, document);
                    }
                }
            } else {
                const schema = Object.assign({}, this.getSchema(collName));
                documents[0] = schema;
            }
        }
        return documents;
    }

    /** 
     * @param {String} collName 
     * @param {String} id
     * @param {*} document 
     * @param {Boolean} [useSchema]
     * @returns {Promise<mongodb.InsertOneWriteOpResult>}
    */
    insert(collName, id, document, useSchema) {
        const collection = this.getCollection(collName);
        if (useSchema == true) {
            const schema = this.getSchema(collName);
            const oldSchema = schema;
            document = Object.assign(schema, document);
            Object.assign(schema, oldSchema);
        }
        document._id = id;
        return collection.insertOne(document);
    }

    /**
     * @param {String} collName 
     * @param {Object} filter 
     * @param {Object} update
     * @param {Boolean} [upsert]
     * @returns {Promise<mongodb.UpdateWriteOpResult>}
    */
    update(collName, filter, update, upsert) {
        const collection = this.getCollection(collName);
        return collection.updateOne(filter, update, { upsert: upsert });
    }

    /** 
     * @param {String} collName 
     * @param {Object} filter
     * @returns {Promise<mongodb.DeleteWriteOpResultObject>}
    */
    delete(collName, filter) {
        const collection = this.getCollection(collName);
        return collection.deleteOne(filter);
    }

    /** 
     * @param {String} collName 
     * @param {Object} filter
     * @returns {Promise<mongodb.DeleteWriteOpResultObject>}
    */
    deleteMany(collName, filter) {
        const collection = this.getCollection(collName);
        return collection.deleteMany(filter);
    }
}