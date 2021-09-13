const config = require("../../config");

// Basic parsers, security and log modules
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const helmet = require("helmet");

// Rate-limit specific
const expressRateLimit = require("express-rate-limit");
const mongoRateLimitStore = require("rate-limit-mongo");
const rateLimitExpiry = 15 * 60 * 1000; // 15 minutes

// Production
const express = require("express");
const path = require("path");

// Logging
const onHeaders = require("on-headers");
const isFinished = require("on-finished");
const moment = require("moment");

/**
 *
 * @param {express.Express} app
 * @returns
 */
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
    app.use(async (req, res, next) => {
        function padString(str, len) {
            if (typeof str === "string" && typeof len === "number") {
                while (str.length < len) {
                    str += " ";
                }
            }
            return str;
        }

        const reqStart = process.hrtime();
        let resStart;

        onHeaders(res, () => {
            resStart = process.hrtime();
        });
        isFinished(res, () => {
            const url = req.originalUrl || req.url;
            const colour =
                res.statusCode >= 500
                    ? 31 // Red
                    : res.statusCode >= 400
                    ? 33 // Gold
                    : res.statusCode >= 300
                    ? 36 // Cyan
                    : res.statusCode >= 200
                    ? 32 // Green
                    : 0; // None
            const status = `\x1b[${colour}m${res.statusCode}\x1b[0m`;
            const responseTime =
                (resStart[0] - reqStart[0]) * 1e3 +
                (resStart[1] - reqStart[1]) * 1e-6;

            const lines = [
                padString(moment().format("DD/MM/YYYY h:mma", 19)),
                `${padString(req.method, 6)} ${padString(url, 83)} ${status}`,
                `${responseTime.toFixed(3)} ms`,
            ];
            console.log(`\x1b[0m${lines.join(" | ")}\x1b[0m`);
        });
        next();
    });
    if (process.env.NODE_ENV === "production") {
        app.use(express.static(path.resolve(__dirname, "../../build")));
    }
    return app;
};
