// Load environment variables
require("dotenv").config({ path: __dirname + "/../process.env" });

const superagent = require("superagent");
const seeds = require("./seeds");
const { PORT } = require("../config");
const config = require("../config");

/**
 * @typedef {object} app
 * @property {import("express").Express} app
 * @property {import("http").Server} server
 * @property {import("../app/loaders/mongodb").MongoService} service
 */

const app = async () => {
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
        app,
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
    await seeds.clearDB(testApp.service.client); // Clear database before
});

afterAll(async () => {
    await seeds.clearDB(testApp.service.client); // Clear database after
    testApp.server.close();
    testApp.service.client.client.close();
});

describe("/auth", () => {
    const checkData = { // Password is either encrypted or removed
        email: "SomeWeirdEmail@email.com",
        firstname: "Super",
        lastname: "Man"
    };
    const sendData = Object.assign({}, checkData);
    sendData.password = "password123";

    describe("POST /register", () => {
        it("should respond with the user", async () => {
            const res = await superagent
                .post(`http://localhost:${PORT}/auth/register`)
                .set("Accept", "application/json")
                .send(sendData);

            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject(checkData);
        });
        it("should add the user to the database", async () => {
            expect(await testApp.service.services.user.find({ email: sendData.email })).toMatchObject(checkData);
        });
    });
});

describe("User routes", () => {
    // TODO User Routes
});

describe("Product routes", () => {
    // TODO Product Routes
});

describe("Order routes", () => {
    // TODO Order Routes
});

describe("Cart routes", () => {
    // TODO Cart Routes
});