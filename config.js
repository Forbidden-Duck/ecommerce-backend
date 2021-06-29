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
    STRIPE: process.env.SKSECRET
}