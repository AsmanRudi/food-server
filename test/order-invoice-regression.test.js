const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const Invoice = require('../app/invoice/model');
const Order = require('../app/order/model');
const cartController = require('../app/cart/controller');
const Product = require('../app/product/model');
const CartItem = require('../app/cart-item/model');
const orderController = require('../app/order/controller');
const invoiceController = require('../app/invoice/controller');

test('invoice schema exposes kelurahan and timestamps support', () => {
  const deliveryAddress = Invoice.schema.obj.delivery_address;

  assert.ok(deliveryAddress.kelurahan, 'delivery_address.kelurahan should exist');
  assert.equal(deliveryAddress.kelurahaan, undefined, 'typo field kelurahaan should not exist');
  assert.equal(Invoice.schema.options.timestamps, true, 'timestamps should be enabled');
});

test('order schema stores delivery_address with kelurahan field', () => {
  const addressSchema = Order.schema.obj.delivery_address;

  assert.ok(addressSchema.kelurahan, 'order.delivery_address.kelurahan should exist');
  assert.equal(addressSchema.kelurahaan, undefined, 'order schema should not expose typo kelurahaan');
  assert.deepEqual(Order.schema.path('payment_method').enumValues, ['cod', 'bank_transfer', 'midtrans']);
  assert.deepEqual(Invoice.schema.path('payment_method').enumValues, ['cod', 'bank_transfer', 'midtrans']);
});

test('admin cannot dispatch an unpaid bank transfer order', async () => {
  const originalFindById = Order.findById;
  const originalFindInvoice = Invoice.findOne;
  let statusCode = null;

  Order.findById = async () => ({ _id: 'o-1', payment_method: 'bank_transfer' });
  Invoice.findOne = async () => ({ payment_status: 'waiting_payment' });

  try {
    await orderController.updateAdminStatus(
      { params: { id: 'o-1' }, body: { status: 'in_delivery' } },
      {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      },
      (error) => { throw error || new Error('next should not be called'); }
    );

    assert.equal(statusCode, 409);
  } finally {
    Order.findById = originalFindById;
    Invoice.findOne = originalFindInvoice;
  }
});

test('admin cannot manually mark Midtrans orders as paid', async () => {
  const originalFindById = Order.findById;
  const originalFindInvoice = Invoice.findOne;
  let statusCode = null;

  Order.findById = async () => ({ _id: 'o-2', payment_method: 'midtrans' });
  Invoice.findOne = async () => { throw new Error('invoice lookup should not run'); };

  try {
    await orderController.markAdminPaymentPaid(
      { params: { id: 'o-2' } },
      {
        status(code) { statusCode = code; return this; },
        json() { return this; }
      },
      (error) => { throw error || new Error('next should not be called'); }
    );

    assert.equal(statusCode, 409);
  } finally {
    Order.findById = originalFindById;
    Invoice.findOne = originalFindInvoice;
  }
});

test('pending transfer endpoint paginates ten records per page', async () => {
  const originalCountDocuments = Invoice.countDocuments;
  const originalFind = Invoice.find;
  let skipValue = null;
  let limitValue = null;
  const invoices = [];
  const query = {
    populate() { return this; },
    sort() { return this; },
    skip(value) { skipValue = value; return this; },
    limit(value) { limitValue = value; return Promise.resolve(invoices); }
  };
  let responseBody;

  Invoice.countDocuments = async () => 25;
  Invoice.find = () => query;

  try {
    await invoiceController.pendingTransfers(
      { query: { page: '2', limit: '50' } },
      { json(payload) { responseBody = payload; return payload; } },
      (error) => { throw error || new Error('next should not be called'); }
    );

    assert.equal(skipValue, 10);
    assert.equal(limitValue, 10);
    assert.equal(responseBody.count, 25);
    assert.equal(responseBody.page, 2);
    assert.equal(responseBody.limit, 10);
  } finally {
    Invoice.countDocuments = originalCountDocuments;
    Invoice.find = originalFind;
  }
});

test('cart update resolves product ids and writes valid cart rows', async () => {
  const originalFind = Product.find;
  const originalDeleteMany = CartItem.deleteMany;
  const originalInsertMany = CartItem.insertMany;

  const product = {
    _id: 'p-1',
    name: 'Nasi Goreng',
    price: 25000,
    image_url: '/images/nasi.jpg'
  };

  Product.find = async () => [product];
  CartItem.deleteMany = async () => ({ deletedCount: 1 });
  CartItem.insertMany = async (documents) => documents;

  try {
    const req = {
      body: {
        items: [{ product: { _id: 'p-1' }, qty: 2 }]
      },
      user: { _id: 'u-1' }
    };

    const res = {
      json(payload) {
        return payload;
      }
    };

    const result = await cartController.update(req, res, () => {
      throw new Error('next should not be called for valid cart update');
    });

    assert.equal(result[0].product, 'p-1');
    assert.equal(result[0].qty, 2);
    assert.equal(result[0].price, 25000);
  } finally {
    Product.find = originalFind;
    CartItem.deleteMany = originalDeleteMany;
    CartItem.insertMany = originalInsertMany;
  }
});
