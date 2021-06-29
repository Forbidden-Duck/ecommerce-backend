const cryptojs = require("crypto-js");
const { CRYPTO } = require("../../config");

/**
 * Create a new SALT + HASH with the inputted PASSWORD
 * @param {string} password 
 * @returns {string}
 */
module.exports.create = password => {
    const salt = cryptojs.lib.WordArray.random(128).toString();
    const cfg = CRYPTO.cfg;
    const hash = cryptojs.PBKDF2(password, salt, cfg);
    return salt + hash.toString();
};

/**
 * Compare a SALT + HASH against a PASSWORD
 * @param {string} password 
 * @param {string} salthash 
 * @returns {boolean}
 */
module.exports.compare = (password, salthash) => {
    const cfg = CRYPTO.cfg;
    const salt = salthash.substring(0, 256);
    const hash = salt.substr(256);
    return hash === cryptojs.PBKDF2(password, salt, cfg).toString();
};