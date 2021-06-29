module.exports = {
    PORT: process.env.PORT,
    DB: {
        name: process.env.DBNAME,
        host: process.env.DBHOST,
        auth: {
            username: process.env.DBUSERNAME,
            password: process.env.DBPASSWORD
        }
    },
    STRIPE: process.env.SKSECRET,
    CRYPTO: {
        cfg: {
            keySize: 512 / 32,
            iterations: 10000,
            mode: CryptoJS.mode.OFB
        }
    }
}