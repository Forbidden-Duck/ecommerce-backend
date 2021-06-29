const moment = require("moment");

module.exports = () => {
    return moment.utc().toISOString();
}