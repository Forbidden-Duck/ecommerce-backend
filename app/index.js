// Load environment variables
require("dotenv").config({ path: __dirname + "/../process.env" });

const app = require("express")();
const loaders = require("./loaders");
const { PORT } = require("../config");

(() => {
    loaders(app);
    app.listen(PORT, () => {
        console.log(`Server listening on ${PORT}`);
    });
})();