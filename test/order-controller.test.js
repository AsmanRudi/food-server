const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const CartItem = require('../app/cart-item/model');
const DeliveryAddress = require('../app/DeliveryAddress/model');
const orderController = require('../app/order/controller');

test('order creation only accepts an address owned by the requesting user', async () => {
  const originalCartFind = CartItem.find;
  const originalAddressFindOne = DeliveryAddress.findOne;
  let addressQuery;
  let statusCode;
  let responseBody;

  CartItem.find = () => ({
    populate: async () => [{ product: 'product-1', qty: 1 }]
  });
  DeliveryAddress.findOne = async (query) => {
    addressQuery = query;
    return null;
  };

  try {
    await orderController.store(
      {
        body: { delivery_address: 'address-1' },
        user: { _id: 'user-1' }
      },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.deepEqual(addressQuery, {
      _id: 'address-1',
      user: 'user-1'
    });
    assert.equal(statusCode, 404);
    assert.equal(responseBody.message, 'Alamat pengiriman tidak ditemukan');
  } finally {
    CartItem.find = originalCartFind;
    DeliveryAddress.findOne = originalAddressFindOne;
  }
});
