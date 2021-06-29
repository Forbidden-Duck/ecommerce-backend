/**
 * @typedef {object} Orders
 * @property {string} [_id]
 * @property {string} [userid]
 * @property {string} [status]
 * @property {number} [total]
 * @property {OrderItem[]} [items]
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
    total: undefined,
    items: [],
    createdAt: undefined,
    modifiedAt: undefined
};

/**
 * @type {OrderItem}
 */
module.exports.OrderItemSchema = {
    _id: undefined,
    productid: undefined,
    quantity: undefined,
    price: undefined,
    createdAt: undefined,
    modifiedAt: undefined
};