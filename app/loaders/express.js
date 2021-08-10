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

module.exports = (app) => {
    app.use(cors({ credentials: true, origin: true }));
    app.use(helmet());
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
    return app;
};
