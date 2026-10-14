const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const mongoose = require('mongoose');
const Category = require('../app/category/model');
const Product = require('../app/product/model');
const productController = require('../app/product/controller');

test('product creation stores category and stock and responds with created status', async () => {
  const originalFindById = Category.findById;
  const originalSave = Product.prototype.save;
  const categoryId = new mongoose.Types.ObjectId();
  let savedProduct;
  let statusCode;
  let responseBody;

  Category.findById = async () => ({ _id: categoryId });
  Product.prototype.save = async function () {
    await this.validate();
    savedProduct = this;
    return this;
  };

  try {
    await productController.store(
      {
        body: {
          name: 'Produk Test',
          description: 'Deskripsi produk',
          price: '12000',
          stock: '7',
          category: String(categoryId)
        }
      },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 201);
    assert.equal(String(savedProduct.category), String(categoryId));
    assert.equal(savedProduct.stock, 7);
    assert.equal(responseBody.name, 'Produk Test');
  } finally {
    Category.findById = originalFindById;
    Product.prototype.save = originalSave;
  }
});

test('product validation errors return a client error instead of a success response', async () => {
  const originalSave = Product.prototype.save;
  let statusCode;
  let responseBody;
  Product.prototype.save = async function () {
    await this.validate();
    return this;
  };

  try {
    await productController.store(
      { body: { name: 'Produk Tanpa Kategori', price: '10000', stock: '2' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 400);
    assert.match(responseBody.message, /Category Harus diisi/);
  } finally {
    Product.prototype.save = originalSave;
  }
});
