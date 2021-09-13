/**
 * @typedef {object} Orders
 * @property {string} [_id]
 * @property {string} [userid]
 * @property {string} [status]
 * @property {number} [total]
 * @property {OrderItem[]} [items]
 * @property {object} [payment]
 * @property {string} [createdAt]
 * @property {string} [modifiedAt]
 */

/**
 * @typedef {object} OrderItem
 * @property {string} [_id]
 * @property {string} [productid]
 * @property {number} [quantity]
 * @property {number} [price]
 * @property {string} [createdAt]
 * @property {string} [modifiedAt]
 */

/**
 * @type {Orders}
 */
module.exports = {
    _id: undefined,
    userid: undefined,
    status: undefined,
    total: 0,
    items: [],
    payment: undefined,
    createdAt: undefined,
    modifiedAt: undefined,
};
