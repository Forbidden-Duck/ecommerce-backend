const cryptojs = require("crypto-js");

/**
 * Create a new SHA512 REFRESH TOKEN
 * @param {string} str 
 * @returns {string}
 */
module.exports.create = str => {
    const randomNum = Math.floor(Math.random() * 999999);
    const currentTime = new Date().getTime();
    return cryptojs.SHA512((randomNum + currentTime).toString() + str).toString();
};