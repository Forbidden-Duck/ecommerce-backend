const CryptoJS = require("crypto-js");

process.env.NODE_ENV = process.env.NODE_ENV || process.env.ENV;
module.exports = {
    PORT: process.env.PORT,
    DB: {
        name: process.env.DBNAME,
        host: process.env.DBHOST,
        auth: {
            username: process.env.DBUSERNAME,
            password: process.env.DBPASSWORD,
        },
    },
    STRIPE: process.env.SKSECRET,
    CRYPTO: {
        cfg: {
            keySize: 512 / 32,
            iterations: 10000,
            mode: CryptoJS.mode.OFB,
        },
        jwtkey: process.env.JWTKEY,
    },
};
