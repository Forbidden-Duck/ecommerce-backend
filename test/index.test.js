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
 * @type {import("../app/db/schemas/products")[]}
 */
let products = []; // Used for cart and orders
/**
 * @type {import("../app/db/schemas/orders")}
 */
let order; // Order when the cart is checked out
let orderLogin; // Login used to create the order

/**
 * Create a new user
 * @param {import("../app/db/schemas/users")} userObj 
 * @returns
 */
const createUser = async userObj => {
    const res = await supertest(testApp.app)
        .post("/auth/register")
        .set("Accept", "application/json")
        .send(userObj);
    return res;
};

/**
 * Login a user
 * @param {supertest.SuperTest<supertest.Test> | supertest.SuperAgentTest} req
 * @param {import("../app/db/schemas/users")} userObj 
 * @returns
 */
const loginUser = async (req, userObj) => {
    const res = await req
        .post("/auth/login")
        .set("Accept", "application/json")
        .send(userObj);
    return res;
};

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
    const userData = {
        email: "WeirdEmail@email.com",
        firstname: "Harold",
        lastname: "Jenkins"
    };
    let register;
    let login;
    let previousLogin;

    describe("POST /register", () => {
        it("should respond with status 400 when missing data", async () => {
            const res = await createUser({});
            expect(res.statusCode).toBe(400);
        });
        it("should respond with the user", async () => {
            const res = await createUser({ ...userData, password: "password123" });
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject(userData);
            register = res.body;
        });
        it("should add the user to the database", async () => {
            expect(await testApp.service.services.user.find({ email: userData.email })).toMatchObject(userData);
        });
        it("should remove key value pairs not on the schema", async () => {
            const newUserData = {
                email: "AnotherWeirdEmail@email.com",
                firstname: "Leroy",
                lastname: "Jenkins"
            };
            const res = await createUser({ ...newUserData, password: "password123", badKey: "badValue" });
            expect(res.statusCode).toBe(201);
            expect(res.body).not.toMatchObject({ ...newUserData, password: "password123", badKey: "badValue" });
        });
    });

    describe("POST /login", () => {
        it("should respond with status 400 when missing data", async () => {
            const res = await loginUser(supertest(testApp.app), {});
            expect(res.statusCode).toBe(400);
        });
        it("should respond with status 404 with an invalid user", async () => {
            const res = await loginUser(supertest(testApp.app), { email: "1", password: "1" });
            expect(res.statusCode).toBe(404);
        });
        it("should respond with status 401 when using incorrect password", async () => {
            const res = await loginUser(supertest(testApp.app), { ...userData, password: "wrongpassword123" });
            expect(res.statusCode).toBe(401);
        });
        it("should respond with correct data and cookies", async () => {
            const res = await loginUser(request, { ...userData, password: "password123" });
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject({ userid: register._id });
            expect(typeof res.body.expiresIn).toBe("string");
            expect(typeof res.body.token).toBe("string");
            expect(typeof res.body.refreshtoken).toBe("string");
            expect(res.headers["set-cookie"][0]).toContain("refresh_token=");
            login = res.body;
            previousLogin = Object.assign({}, login); // Save it twice (when login gets updated we still have previous)
        });
        it("should add the refreshtoken to the database", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(login.refreshtoken))
                .toMatchObject({ _id: login.refreshtoken, userid: register._id });
        });
    });

    describe("POST /refresh_token", () => {
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
            expect(res.body).toMatchObject({ userid: register._id });
            expect(typeof res.body.expiresIn).toBe("string");
            expect(typeof res.body.token).toBe("string");
            expect(typeof res.body.refreshtoken).toBe("string");
            expect(res.headers["set-cookie"][0]).toContain("refresh_token=");
            login = res.body;
        });
        it("should delete previous token", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(previousLogin.refreshtoken))
                .not.toMatchObject({ _id: previousLogin.refreshtoken, userid: register._id });
        });
        it("should add the new token to the database", async () => {
            expect(await testApp.service.services.auth.getRefreshToken(login.refreshtoken))
                .toMatchObject({ _id: login.refreshtoken, userid: register._id });
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
            expect(await testApp.service.services.auth.getRefreshToken(login.refreshtoken))
                .not.toMatchObject({ _id: login.refreshtoken, userid: register._id });
        });
    });
});

describe("User routes", () => {
    const usersData = [{
        email: "Batman@wayneind.com",
        firstname: "Bat",
        lastname: "man"
    }, {
        email: "Superman@wayneind.com",
        firstname: "Super",
        lastname: "man"
    }];
    let registers = [];
    let logins = [];

    beforeAll(async () => { // Create new users for testing
        registers[0] = (await createUser({ ...usersData[0], password: "iambatman" })).body;
        registers[1] = (await createUser({ ...usersData[1], password: "superman123" })).body;
        logins[0] = (await loginUser(supertest(testApp.app), { ...usersData[0], password: "iambatman" })).body;
        logins[1] = (await loginUser(supertest(testApp.app), { ...usersData[1], password: "superman123" })).body;
    });

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
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with the correct user", async () => {
            const res = await supertest(testApp.app)
                .get(`/api/user/${registers[0]._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(registers[0]);
        });
    });

    describe("PUT /:userid", () => {
        const putData = {
            email: "Notstrong@wayneind.com",
            firstname: "Suck it",
            lastname: "-BM"
        };

        it("should respond with 404 if an invalid user was provided", async () => {
            const res = await supertest(testApp.app)
                .put("/api/user/notauserid")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 when trying to edit other users", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/user/${registers[0]._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should send back the new user object", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/user/${registers[1]._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send(putData);
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(putData);
        });
        it("should update the database with the new data", async () => {
            expect(await testApp.service.services.user.find({ _id: registers[1]._id })).toMatchObject(putData);
        });
    });

    describe("DELETE /:userid", () => {
        it("should respond with 404 if an invalid user was provided", async () => {
            const res = await supertest(testApp.app)
                .put("/api/user/notauserid")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 when trying to delete other users", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/user/${registers[0]._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should delete the user from the database", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/user/${registers[0]._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(204);
            expect(await testApp.service.services.user.find({ _id: registers[0]._id }))
                .not.toMatchObject(registers[0]);
        });
    });
});

describe("Product routes", () => {
    const userData = {
        email: "Producttester@company.com",
        firstname: "John",
        lastname: "Doe"
    };
    let register;
    let login; // New user for testing products

    beforeAll(async () => {
        register = (await createUser({ ...userData, password: "mypassword" })).body;
        login = (await loginUser(supertest(testApp.app), { ...userData, password: "mypassword" })).body;

        const tempProducts = seeds.products();
        for (const product of tempProducts) {
            products.push(await testApp.service.services.product.create(product));
        }
    });

    it("should respond with 401 when an unauthorized user makes a request", async () => {
        const res = await supertest(testApp.app)
            .get("/api/product")
            .set("authorization", "Bearer notatoken")
            .send();
        expect(res.statusCode).toBe(401);
    });


    describe("GET /", () => {
        it("should return all products if no query is provided", async () => {
            const res = await supertest(testApp.app)
                .get("/api/product")
                .set("authorization", `Bearer ${login.token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(products);
        });
        it("should return products related to the query", async () => {
            const matchProducts = products.filter(product => product.price === 15);
            const res = await supertest(testApp.app)
                .get("/api/product")
                .set("authorization", `Bearer ${login.token}`)
                .send({ price: 15 });
            expect(res.statusCode).toBe(200);
            expect(res.body.length).toBe(matchProducts.length);
            expect(res.body).toMatchObject(matchProducts);
        });
    });
});

describe("Cart routes", () => {
    const usersData = [{
        email: "andy@carttester.com",
        firstname: "Just",
        lastname: "Andy"
    }, {
        email: "bob@carttester.com",
        firstname: "Andy",
        lastname: "Sucks"
    }];
    let registers = [];
    let logins = [];
    let cart;
    let cartitem;

    beforeAll(async () => { // Create new users for testing
        registers[0] = (await createUser({ ...usersData[0], password: "iamjustandy" })).body;
        registers[1] = (await createUser({ ...usersData[1], password: "iwishicouldfireandy" })).body;
        logins[0] = (await loginUser(supertest(testApp.app), { ...usersData[0], password: "iamjustandy" })).body;
        logins[1] = (await loginUser(supertest(testApp.app), { ...usersData[1], password: "iwishicouldfireandy" })).body;
        orderLogin = logins[0]; // Save order login
    });

    it("should respond with 401 when an unauthorized user makes a request", async () => {
        const res = await supertest(testApp.app)
            .get("/api/product")
            .set("authorization", "Bearer notatoken")
            .send();
        expect(res.statusCode).toBe(401);
    });

    describe("POST /", () => {
        it("should respond with the cart", async () => {
            const res = await supertest(testApp.app)
                .post("/api/cart")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject({ userid: registers[0]._id, items: [] });
            cart = res.body;
        });
        it("should add the cart to the database", async () => {
            expect(await testApp.service.services.cart.find({ _id: cart._id })).toMatchObject(cart);
        });
    });

    describe("GET /:cartid", () => {
        it("should respond with 404 if an invalid cart is provided", async () => {
            const res = await supertest(testApp.app)
                .get("/api/cart/notanid")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 if a user trys to access another user's cart", async () => {
            const res = await supertest(testApp.app)
                .get(`/api/cart/${cart._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should respond with the correct cart", async () => {
            const res = await supertest(testApp.app)
                .get(`/api/cart/${cart._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(cart);
        });
    });

    describe("POST /:cartid/items", () => {
        const cartItemData = {
            productid: "100",
            quantity: 2,
            price: 15 * 2
        };

        it("should respond with 404 if an invalid cart is provided", async () => {
            const res = await supertest(testApp.app)
                .post("/api/cart/notanid/items")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 if a user trys to edit another user's cart", async () => {
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/items`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send(cartItemData);
            expect(res.statusCode).toBe(403);
        });
        it("should respond with the cart item added to the cart", async () => {
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/items`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send(cartItemData);
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject({ cart: {}, cartItem: cartItemData });
            cart = res.body.cart; // Update cart with new data
            cartitem = res.body.cartItem // Update cart item with new data
        });
        it("should update the database with new cart item", async () => {
            expect(await testApp.service.services.cart.find({ _id: cart._id })).toMatchObject(cart);
        });
    });

    describe("PUT /:cardid/items/:carditemid", () => {
        const cartItemData = {
            quantity: 3,
            price: 15 * 2
        };

        it("should respond 404 if an invalid cart is provided", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/cart/${cart._id}/items/notanid`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 if a user trys to edit another user's cart", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/cart/${cart._id}/items/${cartitem._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should respond with the cart item updated", async () => {
            const res = await supertest(testApp.app)
                .put(`/api/cart/${cart._id}/items/${cartitem._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send(cartItemData);
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject({ cart: {}, cartItem: cartItemData });
            cart = res.body.cart;
            cartitem = res.body.cartItem;
        });
        it("should update the database with updated cart item", async () => {
            expect(await testApp.service.services.cart.find({ _id: cart._id })).toMatchObject(cart);
        });
    });

    describe("DELETE /:cardid/items/:cartitemid", () => {
        it("should respond with 404 if an invalid cart item was provided", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/cart/${cart._id}/items/notanid`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 403 if a user trys to edit another user's cart", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/cart/${cart._id}/items/${cartitem._id}`)
                .set("authorization", `Bearer ${logins[1].token}`)
                .send();
            expect(res.statusCode).toBe(403);
        });
        it("should delete the cart item from the database", async () => {
            const res = await supertest(testApp.app)
                .delete(`/api/cart/${cart._id}/items/${cartitem._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(await testApp.service.services.cart.findItem(cart._id, { _id: cartitem._id })).toBe(undefined);
        });
    });

    describe("POST /:cartid/checkout", () => {
        let fakeItem;

        beforeAll(async () => {
            const fakeItemData = {
                _id: "1",
                productid: "1",
                quantity: 1,
                price: 1
            };
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/items`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send(fakeItemData);
            cart = res.body.cart; // Update cart with new data
            fakeItem = res.body.cartItem; // Update fake item
        });

        it("should respond with 404 if an invalid cart is provided", async () => {
            const res = await supertest(testApp.app)
                .post("/api/cart/notanid/checkout")
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with 404 if an invalid product is in the cart", async () => {
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/checkout`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(404);

            // Delete invalid product for next test
            await supertest(testApp.app)
                .delete(`/api/cart/${cart._id}/items/${fakeItem._id}`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
        });
        it("should respond with 400 if no products are in the cart", async () => {
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/checkout`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(400);

            // Add another cart item
            const res2 = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/items`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send({ productid: "100", quantity: 2, price: 15 * 2 });
            cart = res2.body.cart; // Update cart with new data
            cartitem = res2.body.cartItem // Update cart item with new data
        });
        it("should respond with the new order and charge", async () => {
            const res = await supertest(testApp.app)
                .post(`/api/cart/${cart._id}/checkout`)
                .set("authorization", `Bearer ${logins[0].token}`)
                .send();
            expect(res.statusCode).toBe(201);
            expect(res.body).toMatchObject({ order: {}, charge: "Not available" }); // TODO add new charge when stripe is implemented
            order = res.body.order;
        });
        it("should add the order to the database", async () => {
            expect(await testApp.service.services.order.find({ _id: order._id }))
                .toMatchObject(order);
        });
    });
});

describe("Order routes", () => {
    const userData = {
        email: "Ordertester@company.com",
        firstname: "Not a",
        lastname: "Tester"
    };
    let register;
    let login; // New user for testing orders

    beforeAll(async () => {
        register = (await createUser({ ...userData, password: "mypassword" })).body;
        login = (await loginUser(supertest(testApp.app), { ...userData, password: "mypassword" })).body;
    });

    it("should respond with 401 when an unauthorized user makes a request", async () => {
        const res = await supertest(testApp.app)
            .get("/api/product")
            .set("authorization", "Bearer notatoken")
            .send();
        expect(res.statusCode).toBe(401);
    });

    describe("GET /", () => {
        it("should respond 404 if the user has no orders", async () => {
            const res = await supertest(testApp.app)
                .get("/api/order")
                .set("authorization", `Bearer ${login.token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with all user orders", async () => {
            const res = await supertest(testApp.app)
                .get("/api/order")
                .set("authorization", `Bearer ${orderLogin.token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject([order]);
        });
    });

    describe("GET /:orderid", () => {
        it("should respond 404 if an invalid order was provided", async () => {
            const res = await supertest(testApp.app)
                .get("/api/order/notanid")
                .set("authorization", `Bearer ${orderLogin.token}`)
                .send();
            expect(res.statusCode).toBe(404);
        });
        it("should respond with the correct order", async () => {
            const res = await supertest(testApp.app)
                .get(`/api/order/${order._id}`)
                .set("authorization", `Bearer ${orderLogin.token}`)
                .send();
            expect(res.statusCode).toBe(200);
            expect(res.body).toMatchObject(order);
        });
    });
});