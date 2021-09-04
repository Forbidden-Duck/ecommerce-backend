// Load environment variables
require("dotenv").config({ path: __dirname + "/../process.env" });

const app = require("express")();
const https = require("https");
const loaders = require("./loaders");
const { PORT } = require("../config");

(async () => {
    await loaders(app);
    if (process.env.PROTOCOL === "https") {
        const fs = require("fs");
        const httpsOptions = {
            key: fs.readFileSync(__dirname + "/../cert/key.pem"),
            cert: fs.readFileSync(__dirname + "/../cert/cert.pem"),
        };
        https.createServer(httpsOptions, app).listen(PORT);
        console.log(`Server listening on https/${PORT}`);
    } else {
        app.listen(PORT, (err) => {
            if (err) {
                console.log("Error while listening for connections\n", err);
                process.exit(10);
            }
            console.log(`Server listening on http/${PORT}`);
        });
    }
})();
