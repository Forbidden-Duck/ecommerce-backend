// Load environment variables
require("dotenv").config({ path: __dirname + "/../process.env" });

const supertest = require("supertest");
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
/**
 * @type {import("supertest").SuperAgentTest}
 */
let request; // Persist cookies
/**
 * User created
 * @type {import("../app/db/schemas/users")}
 */
let user;
/**
 * Used for /api routes
 * @type {string}
 */
let jwttoken;

// Used to check a user
const checkData = { // Password is either encrypted or removed
    email: "SomeWeirdEmail@email.com",
    firstname: "Super",
    lastname: "Man"
};
// Used to authenticate a user
const sendData = Object.assign({}, checkData);
sendData.password = "password123";

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    testApp = await app();
    request = supertest.agent(testApp.app);
    await seeds.clearDB(testApp.service.client); // Clear database before
});

afterAll(async () => {
    //await seeds.clearDB(testApp.service.client); // Clear database after
    testApp.server.close();
    testApp.service.client.client.close();
});

describe("/auth", () => {
    let refreshtoken;

    describe("POST /register", () => {
        it("should respond with status 400 when missing data", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/register")
                .set("Accept", "application/json")
                .send({});
            expect(res.statusCode).toBe(400);
        });
        it("should respond with the user", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/register")
                .set("Accept", "application/json")
                .send(sendData);
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject(checkData);
            user = res.body;
        });
        it("should add the user to the database", async () => {
            expect(await testApp.service.services.user.find({ email: sendData.email })).toMatchObject(checkData);
        });
        it("should remove key value pairs not on the schema", async () => {
            const tempData = Object.assign({}, sendData);
            delete tempData.email;
            const res = await supertest(testApp.app)
                .post("/auth/register")
                .set("Accept", "application/json")
                // Need a new email
                .send({ ...tempData, email: "AnotherWeirdEmail@email.com", badKey: "badValue" });
            expect(res.statusCode).toBe(201);
            expect(res.body).not.toMatchObject({ ...checkData, badKey: "badValue" });
        });
    });

    describe("POST /login", () => {
        it("should respond with status 400 when missing data", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/login")
                .set("Accept", "application/json")
                .send({});
            expect(res.statusCode).toBe(400);
        });
        it("should respond with status 404 with an invalid user", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/login")
                .set("Accept", "application/json")
                .send({ email: "1", password: "1" });
            expect(res.statusCode).toBe(404);
        });
        it("should respond with status 401 when using incorrect password", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/login")
                .set("Accept", "application/json")
                .send({ ...checkData, password: "wrongpassword123" });
            expect(res.statusCode).toBe(401);
        });
        it("should respond with correct data and cookies", async () => {
            const res = await request
                .post("/auth/login")
                .set("Accept", "application/json")
                .send(sendData);
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject({ userid: user._id });
            expect(typeof res.body.expiresIn).toBe("string");
            expect(typeof res.body.token).toBe("string");
            expect(typeof res.body.refreshtoken).toBe("string");
            expect(res.headers["set-cookie"][0]).toContain("refresh_token=");
            refreshtoken = res.body.refreshtoken;
            jwttoken = res.body.token;
        });
        it("should add the refreshtoken to the database", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(refreshtoken))
                .toMatchObject({ _id: refreshtoken, userid: user._id });
        });
    });

    describe("POST /refresh_token", () => {
        const previousToken = refreshtoken;
        it("should respond with 401 if an invalid token was provided", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/refresh_token")
                .send();
            expect(res.statusCode).toBe(401);
        });
        it("should respond with correct data and cookies", async () => {
            const res = await request
                .post("/auth/refresh_token")
                .set("Accept", "application/json")
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject({ userid: user._id });
            expect(typeof res.body.expiresIn).toBe("string");
            expect(typeof res.body.token).toBe("string");
            expect(typeof res.body.refreshtoken).toBe("string");
            expect(res.headers["set-cookie"][0]).toContain("refresh_token=");
            refreshtoken = res.body.refreshtoken;
        });
        it("should delete previous token", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(previousToken))
                .not.toMatchObject({ _id: previousToken, userid: user._id });
        });
        it("should add the new token to the database", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(refreshtoken))
                .toMatchObject({ _id: refreshtoken, userid: user._id });
        });
    });

    describe("POST /logout", () => {
        it("should respond with 401 if an invalid token was provided", async () => {
            const res = await supertest(testApp.app)
                .post("/auth/logout")
                .send();
            expect(res.statusCode).toBe(401);
        });
        it("should respond with 200", async () => {
            const res = await request
                .post("/auth/logout")
                .send();
            expect(res.statusCode).toBe(200);
        });
        it("should delete the refresh_token", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(refreshtoken))
                .not.toMatchObject({ _id: refreshtoken, userid: user._id });
        });
    });
});

describe("User routes", () => {
    it("should respond with 401 when an unauthorized user makes a request", async () => {
        const res = await supertest(testApp.app)
            .get("/api/user")
            .set("authorization", "Bearer notatoken")
            .send();
        expect(res.statusCode).toBe(401);
    });

    describe("GET /:userid", () => {
        it("should respond with 404 if an invalid user was provided", async () => {
            const res = await supertest(testApp.app)
                .get("/api/user/notauserid")
                .set("authorization", `Bearer ${jwttoken}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should send back the user", async () => {
            const res = await supertest(testApp.app)
                .get(`/api/user/${user._id}`)
                .set("authorization", `Bearer ${jwttoken}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(checkData);
        });
    });

    describe("PUT /:userid", () => {
        const updateData = {
            email: "MyNewWeirdEmail@email.com",
            firstname: "Mush",
            lastname: "room"
        };

        it("should respond with 404 if an invalid user was provided", async () => {
            const res = await supertest(testApp.app)
                .put("/api/user/notauserid")
                .set("authorization", `Bearer ${jwttoken}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should send back the new user object", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/user/${user._id}`)
                .set("authorization", `Bearer ${jwttoken}`)
                .send(updateData);
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(updateData);
        });
        it("should update the database with the new data", async () => {
            expect(await testApp.service.services.user.find({ _id: user._id })).toMatchObject(updateData);
        });

        afterAll(async () => {
            const res = await supertest(testApp.app)
                .put(`/api/user/${user._id}`)
                .set("authorization", `Bearer ${jwttoken}`)
                .send(checkData); // Revert back to original data
        });
    });

    describe("DELETE /:userid", () => {
        const newData = {
            email: "Batman@wayneind.com",
            firstname: "Bat",
            lastname: "man"
        };
        let newUser;
        let newJwtToken;

        beforeAll(async () => { // Create a new user to delete
            const regRes = await supertest(testApp.app)
                .post("/auth/register")
                .set("Accept", "application/json")
                .send({ ...newData, password: "password123" });
            const logRes = await supertest(testApp.app)
                .post("/auth/login")
                .set("Accept", "application/json")
                .send({ ...newData, password: "password123" });
            newUser = regRes.body;
            newJwtToken = logRes.body.token;
        });

        it("should respond with 404 if an invalid user was provided", async () => {
            const res = await supertest(testApp.app)
                .put("/api/user/notauserid")
                .set("authorization", `Bearer ${jwttoken}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 when trying to delete other users", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/user/${user._id}`)
                .set("authorization", `Bearer ${newJwtToken}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should delete the user from the database", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/user/${newUser._id}`)
                .set("authorization", `Bearer ${newJwtToken}`)
                .send();
            expect(res.statusCode).toBe(204);
            expect(await testApp.service.services.user.find({ _id: newUser._id }))
                .not.toMatchObject(newData);
        });
    });
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