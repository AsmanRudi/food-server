const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const Category = require('../app/category/model');
const categoryController = require('../app/category/controller');

test('category creation trims the name and saves it to the database', async () => {
  const originalFindOne = Category.findOne;
  const originalSave = Category.prototype.save;
  let duplicateQuery;
  let savedCategory;
  let statusCode;
  let responseBody;

  Category.findOne = async (query) => {
    duplicateQuery = query;
    return null;
  };
  Category.prototype.save = async function () {
    savedCategory = this;
    return this;
  };

  try {
    await categoryController.store(
      { body: { name: '  Makanan Utama  ' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 201);
    assert.equal(savedCategory.name, 'Makanan Utama');
    assert.equal(responseBody.name, 'Makanan Utama');
    assert.deepEqual(duplicateQuery, {
      name: { $regex: '^Makanan Utama$', $options: 'i' }
    });
  } finally {
    Category.findOne = originalFindOne;
    Category.prototype.save = originalSave;
  }
});

test('category creation rejects duplicate names without saving', async () => {
  const originalFindOne = Category.findOne;
  const originalSave = Category.prototype.save;
  let statusCode;
  let responseBody;
  Category.findOne = async () => ({ name: 'Makanan Utama' });
  Category.prototype.save = async () => {
    throw new Error('duplicate category should not be saved');
  };

  try {
    await categoryController.store(
      { body: { name: 'makanan utama' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 409);
    assert.equal(responseBody.message, 'Kategori dengan nama tersebut sudah ada');
  } finally {
    Category.findOne = originalFindOne;
    Category.prototype.save = originalSave;
  }
});

test('invalid category names return a validation error status', async () => {
  const originalFindOne = Category.findOne;
  const originalSave = Category.prototype.save;
  let statusCode;
  let responseBody;
  Category.findOne = async () => null;
  Category.prototype.save = async function () {
    await this.validate();
    return this;
  };

  try {
    await categoryController.store(
      { body: { name: 'ab' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 400);
    assert.match(responseBody.message, /minimal 3 karakter/);
  } finally {
    Category.findOne = originalFindOne;
    Category.prototype.save = originalSave;
  }
});
