/**
 * @typedef {object} Users
 * @property {string} [_id]
 * @property {string} [email]
 * @property {string} [password]
 * @property {boolean} [authedGoogle]
 * @property {string} [firstname]
 * @property {string} [lastname]
 * @property {boolean} [admin]
 * @property {string} [createdAt]
 * @property {string} [modifiedAt]
 */

/**
 * @type {Users}
 */
module.exports = {
    _id: undefined,
    email: undefined,
    password: undefined,
    authedGoogle: false,
    firstname: undefined,
    lastname: undefined,
    admin: false,
    createdAt: undefined,
    modifiedAt: undefined,
};
