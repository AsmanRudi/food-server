const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';
const { subject } = require('@casl/ability');

const CartItem = require('../app/cart-item/model');
const DeliveryAddress = require('../app/DeliveryAddress/model');
const Invoice = require('../app/invoice/model');
const Order = require('../app/order/model');
const OrderItem = require('../app/order-item/model');
const Product = require('../app/product/model');
const orderController = require('../app/order/controller');
const { policyfor } = require('../utils');

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

test('users can read their own orders and the listing is scoped to the logged-in user', async () => {
  const originals = {
    countDocuments: Order.countDocuments,
    find: Order.find
  };
  const user = { _id: 'user-1', role: 'user' };
  const order = {
    _id: 'order-1',
    status: 'in_delivery',
    toJSON: () => ({ _id: 'order-1', status: 'in_delivery' })
  };
  let countFilter;
  let findFilter;
  let responseBody;

  Order.countDocuments = async (filter) => {
    countFilter = filter;
    return 1;
  };
  Order.find = (filter) => {
    findFilter = filter;
    return {
      skip() { return this; },
      limit() { return this; },
      populate() { return this; },
      sort: async () => [order]
    };
  };

  try {
    await orderController.index(
      { user, query: {} },
      { json(payload) { responseBody = payload; return payload; } },
      (error) => { throw error; }
    );

    assert.deepEqual(countFilter, { user: user._id });
    assert.deepEqual(findFilter, { user: user._id });
    assert.equal(responseBody.data[0].status, 'in_delivery');
    assert.equal(policyfor(user).can('read', subject('Order', { user_id: 'user-1' })), true);
    assert.equal(policyfor(user).can('read', subject('Order', { user_id: 'user-2' })), false);
  } finally {
    Order.countDocuments = originals.countDocuments;
    Order.find = originals.find;
  }
});

test('order creation atomically deducts aggregated product quantities from stock', async () => {
  const originals = {
    cartFind: CartItem.find,
    cartDeleteMany: CartItem.deleteMany,
    addressFindOne: DeliveryAddress.findOne,
    stockFindOneAndUpdate: Product.findOneAndUpdate,
    orderItemInsertMany: OrderItem.insertMany,
    orderSave: Order.prototype.save,
    invoiceFindOne: Invoice.findOne
  };
  let stock = 5;
  let stockUpdate;
  let statusCode;
  let responseBody;
  const items = [
    { product: { _id: 'product-1', name: 'Meal', price: 12000 }, qty: 1 },
    { product: { _id: 'product-1', name: 'Meal', price: 12000 }, qty: 2 }
  ];

  CartItem.find = () => ({ populate: async () => items });
  CartItem.deleteMany = async () => ({ deletedCount: items.length });
  DeliveryAddress.findOne = async () => ({
    provinsi: 'Provinsi',
    kabupaten: 'Kabupaten',
    kecamatan: 'Kecamatan',
    kelurahan: 'Kelurahan',
    detail: 'Alamat'
  });
  Product.findOneAndUpdate = async (filter, update) => {
    stockUpdate = { filter, update };
    if (stock < filter.stock.$gte) return null;
    stock += update.$inc.stock;
    return { _id: filter._id, stock };
  };
  OrderItem.insertMany = async () => [{ _id: 'order-item-1' }];
  Order.prototype.save = async function() {};
  Invoice.findOne = async () => ({ save: async function() {} });

  try {
    await orderController.store(
      {
        body: { delivery_address: 'address-1', payment_method: 'cod' },
        user: { _id: 'user-1' }
      },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 201);
    assert.equal(stock, 2);
    assert.equal(stockUpdate.filter.stock.$gte, 3);
    assert.equal(stockUpdate.update.$inc.stock, -3);
    assert.equal(responseBody.payment_method, 'cod');
  } finally {
    CartItem.find = originals.cartFind;
    CartItem.deleteMany = originals.cartDeleteMany;
    DeliveryAddress.findOne = originals.addressFindOne;
    Product.findOneAndUpdate = originals.stockFindOneAndUpdate;
    OrderItem.insertMany = originals.orderItemInsertMany;
    Order.prototype.save = originals.orderSave;
    Invoice.findOne = originals.invoiceFindOne;
  }
});

test('order creation rejects insufficient stock and restores earlier stock deductions', async () => {
  const originals = {
    cartFind: CartItem.find,
    addressFindOne: DeliveryAddress.findOne,
    stockFindOneAndUpdate: Product.findOneAndUpdate,
    stockUpdateOne: Product.updateOne
  };
  const stock = new Map([['product-1', 4], ['product-2', 1]]);
  const items = [
    { product: { _id: 'product-1', name: 'Meal 1' }, qty: 2 },
    { product: { _id: 'product-2', name: 'Meal 2' }, qty: 2 }
  ];
  let statusCode;
  let responseBody;

  CartItem.find = () => ({ populate: async () => items });
  DeliveryAddress.findOne = async () => ({
    provinsi: 'Provinsi',
    kabupaten: 'Kabupaten',
    kecamatan: 'Kecamatan',
    kelurahan: 'Kelurahan'
  });
  Product.findOneAndUpdate = async (filter, update) => {
    const currentStock = stock.get(filter._id);
    if (currentStock < filter.stock.$gte) return null;
    stock.set(filter._id, currentStock + update.$inc.stock);
    return { _id: filter._id };
  };
  Product.updateOne = async (filter, update) => {
    stock.set(filter._id, stock.get(filter._id) + update.$inc.stock);
  };

  try {
    await orderController.store(
      {
        body: { delivery_address: 'address-1', payment_method: 'cod' },
        user: { _id: 'user-1' }
      },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 409);
    assert.match(responseBody.message, /Meal 2/);
    assert.equal(stock.get('product-1'), 4);
    assert.equal(stock.get('product-2'), 1);
  } finally {
    CartItem.find = originals.cartFind;
    DeliveryAddress.findOne = originals.addressFindOne;
    Product.findOneAndUpdate = originals.stockFindOneAndUpdate;
    Product.updateOne = originals.stockUpdateOne;
  }
});

test('order creation restores reserved stock if saving the order invoice fails', async () => {
  const originals = {
    cartFind: CartItem.find,
    addressFindOne: DeliveryAddress.findOne,
    stockFindOneAndUpdate: Product.findOneAndUpdate,
    stockUpdateOne: Product.updateOne,
    orderItemInsertMany: OrderItem.insertMany,
    orderItemDeleteMany: OrderItem.deleteMany,
    orderSave: Order.prototype.save,
    orderDeleteOne: Order.deleteOne,
    invoiceFindOne: Invoice.findOne,
    invoiceDeleteOne: Invoice.deleteOne
  };
  let stock = 5;
  let nextError;
  const items = [{ product: { _id: 'product-1', name: 'Meal' }, qty: 2 }];

  CartItem.find = () => ({ populate: async () => items });
  DeliveryAddress.findOne = async () => ({
    provinsi: 'Provinsi',
    kabupaten: 'Kabupaten',
    kecamatan: 'Kecamatan',
    kelurahan: 'Kelurahan'
  });
  Product.findOneAndUpdate = async (filter, update) => {
    if (stock < filter.stock.$gte) return null;
    stock += update.$inc.stock;
    return { _id: filter._id, stock };
  };
  Product.updateOne = async (filter, update) => {
    stock += update.$inc.stock;
  };
  OrderItem.insertMany = async () => [{ _id: 'order-item-1' }];
  OrderItem.deleteMany = async () => ({ deletedCount: 1 });
  Order.prototype.save = async function() {};
  Order.deleteOne = async () => ({ deletedCount: 1 });
  Invoice.findOne = async () => ({
    save: async () => { throw new Error('invoice write failed'); }
  });
  Invoice.deleteOne = async () => ({ deletedCount: 1 });

  try {
    await orderController.store(
      {
        body: { delivery_address: 'address-1', payment_method: 'cod' },
        user: { _id: 'user-1' }
      },
      {
        status() { return this; },
        json(payload) { return payload; }
      },
      (error) => { nextError = error; }
    );

    assert.equal(nextError.message, 'invoice write failed');
    assert.equal(stock, 5);
  } finally {
    CartItem.find = originals.cartFind;
    DeliveryAddress.findOne = originals.addressFindOne;
    Product.findOneAndUpdate = originals.stockFindOneAndUpdate;
    Product.updateOne = originals.stockUpdateOne;
    OrderItem.insertMany = originals.orderItemInsertMany;
    OrderItem.deleteMany = originals.orderItemDeleteMany;
    Order.prototype.save = originals.orderSave;
    Order.deleteOne = originals.orderDeleteOne;
    Invoice.findOne = originals.invoiceFindOne;
    Invoice.deleteOne = originals.invoiceDeleteOne;
  }
});
