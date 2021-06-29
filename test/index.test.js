const request = require("supertest");
const seeds = require("./seeds");

beforeAll(async () => {
    process.env.NODE_ENV = "test";
    require("../app");
});

// TODO Test suite