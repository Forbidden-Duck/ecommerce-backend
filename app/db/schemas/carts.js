/**
 * @typedef {object} Cart
 * @property {string} [_id]
 * @property {string} [userid]
 * @property {CartItem[]} [items]
 * @property {string} [createdAt]
 * @property {string} [modifiedAt]
 */

/**
 * @typedef {object} CartItem
 * @property {string} [_id]
 * @property {string} [productid]
 * @property {number} [quantity]
 * @property {number} [price]
 * @property {string} [createdAt]
 * @property {string} [modifiedAt]
 */

/**
 * @type {Cart}
 */
module.exports = {
    _id: undefined,
    userid: undefined,
    items: [],
    createdAt: undefined,
    modifiedAt: undefined
};

/**
 * @type {CartItem}
 */
module.exports.CartItemSchema = {
    _id: undefined,
    productid: undefined,
    quantity: undefined,
    price: undefined,
    createdAt: undefined,
    modifiedAt: undefined
};