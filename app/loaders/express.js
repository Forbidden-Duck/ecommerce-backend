const config = require("../../config");

// Basic parsers, security and log modules
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");
const morgan = require("morgan");

// Rate-limit specific
const expressRateLimit = require("express-rate-limit");
const mongoRateLimitStore = require("rate-limit-mongo");
const rateLimitExpiry = 15 * 60 * 1000; // 15 minutes

// Production
const express = require("express");
const path = require("path");

module.exports = (app) => {
    app.use(cors({ credentials: true, origin: true }));
    app.use(
        helmet({
            contentSecurityPolicy: {
                directives: {
                    defaultSrc: ["'self'"],
                    scriptSrc: ["'self'", "https://apis.google.com"],
                    styleSrc: [
                        "'self'",
                        "https://fonts.googleapis.com",
                        "'unsafe-inline'",
                    ],
                    imgSrc: ["'self'", "data:"],
                    fontSrc: ["'self'", "https://fonts.gstatic.com"],
                    objectSrc: ["'self'"],
                    mediaSrc: ["'self'"],
                    frameSrc: ["https://accounts.google.com/"],
                },
            },
        })
    );
    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.set("trust proxy", 1);
    app.use(morgan("dev"));
    app.use(
        new expressRateLimit({
            store: new mongoRateLimitStore({
                uri: `mongodb://${config.DB.host}/${config.DB.name}`,
                collectionName: "rate-limit",
                user: config.DB.auth.username,
                password: config.DB.auth.password,
                expireTimeMs: rateLimitExpiry,
            }),
            windowMs: rateLimitExpiry,
            max: 1500,
        })
    );
    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.resolve(__dirname, "../../build")));
    }
    return app;
};
