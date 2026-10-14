const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const User = require('../app/user/model');
const userController = require('../app/user/controller');

test('user index returns only safe profile fields', async () => {
  const originalFind = User.find;
  const expectedUsers = [{ _id: 'user-1', full_name: 'Test User', email: 'test@example.com', role: 'user' }];
  let selectedFields;
  let sortCriteria;
  let responseBody;

  const query = {
    select(fields) {
      selectedFields = fields;
      return this;
    },
    sort(criteria) {
      sortCriteria = criteria;
      return Promise.resolve(expectedUsers);
    }
  };

  User.find = () => query;

  try {
    await userController.index(
      {},
      { json(payload) { responseBody = payload; return payload; } },
      (error) => { throw error; }
    );

    assert.equal(selectedFields, '_id customer_id full_name email role createdAt');
    assert.deepEqual(sortCriteria, { createdAt: -1 });
    assert.deepEqual(responseBody, { data: expectedUsers });
  } finally {
    User.find = originalFind;
  }
});

test('admin user creation stores a regular user and returns safe fields', async () => {
  const originalSave = User.prototype.save;
  let savedUser;
  let responseBody;
  let statusCode;
  User.prototype.save = async function () {
    savedUser = this;
    this.customer_id = 12;
    this.createdAt = new Date('2026-01-01T00:00:00.000Z');
    return this;
  };

  try {
    await userController.store(
      { body: { full_name: '  New User  ', email: ' new@example.com ', password: 'secret' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 201);
    assert.equal(savedUser.full_name, 'New User');
    assert.equal(savedUser.email, 'new@example.com');
    assert.equal(savedUser.role, 'user');
    assert.equal(savedUser.password, 'secret');
    assert.equal(String(responseBody._id), String(savedUser._id));
    assert.equal(responseBody.password, undefined);
    assert.equal(responseBody.token, undefined);
  } finally {
    User.prototype.save = originalSave;
  }
});

test('admin can update a user role and revoke their existing tokens', async () => {
  const originalFindById = User.findById;
  let saved = false;
  const targetUser = {
    _id: 'user-2',
    full_name: 'Target User',
    email: 'target@example.com',
    role: 'user',
    token: ['old-token'],
    async save() { saved = true; }
  };
  let responseBody;
  User.findById = async () => targetUser;

  try {
    await userController.updateRole(
      { params: { id: 'user-2' }, body: { role: 'admin' }, user: { _id: 'admin-1' } },
      { json(payload) { responseBody = payload; return payload; } },
      (error) => { throw error; }
    );

    assert.equal(saved, true);
    assert.equal(targetUser.role, 'admin');
    assert.deepEqual(targetUser.token, []);
    assert.equal(responseBody.role, 'admin');
    assert.equal(responseBody.token, undefined);
  } finally {
    User.findById = originalFindById;
  }
});

test('admin cannot demote the last administrator', async () => {
  const originalFindById = User.findById;
  const originalCountDocuments = User.countDocuments;
  const targetUser = {
    _id: 'admin-2',
    role: 'admin',
    async save() { throw new Error('last admin must not be saved'); }
  };
  let statusCode;
  let responseBody;
  User.findById = async () => targetUser;
  User.countDocuments = async () => 1;

  try {
    await userController.updateRole(
      { params: { id: 'admin-2' }, body: { role: 'user' }, user: { _id: 'admin-1' } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { responseBody = payload; return payload; }
      },
      (error) => { throw error; }
    );

    assert.equal(statusCode, 409);
    assert.equal(responseBody.message, 'Role admin terakhir tidak dapat diubah');
    assert.equal(targetUser.role, 'admin');
  } finally {
    User.findById = originalFindById;
    User.countDocuments = originalCountDocuments;
  }
});
