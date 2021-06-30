// Load environment variables
require("dotenv").config({ path: __dirname + "/../process.env" });

const app = require("express")();
const loaders = require("./loaders");
const { PORT } = require("../config");

(async () => {
    await loaders(app);
    app.listen(PORT, err => {
        if (err) {
            console.log("Error while listening for connections\n", err);
            process.exit(10);
        }
        console.log(`Server listening on ${PORT}`);
    });
})();