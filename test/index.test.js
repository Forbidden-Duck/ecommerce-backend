const request = require("supertest");
const seeds = require("./seeds");

/**
 * @typedef {object} app
 * @property {import("http").Server} server
 * @property {import("../app/loaders/mongodb").MongoService} service
 */

const app = async () => {
    // Load environment variables
    require("dotenv").config({ path: __dirname + "/../process.env" });

    const app = require("express")();
    const loaders = require("../app/loaders");
    const { PORT } = require("../config");

    const loader = await loaders(app);
    let server;
    await new Promise(resolve => {
        server = app.listen(PORT, () => {
            console.log(`Server listening on ${PORT}`);
            resolve();
        });
    });
    return {
        server,
        service: loader
    };
};
/**
 * We run app independently of index.js so that we can have loader return information
 * this includes the pre-existing connection to the database without having to create
 * two connections to the same database, which will reduce the risk of damage to the
 * DB
 */

/**
 * @type {app}
 */
let testApp; // So we can close the connection

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    testApp = await app();
    await seeds.clearDB(testApp.service.client);
});

afterAll(() => {
    testApp.server.close();
    testApp.service.client.client.close();
});

// TODO Test suite