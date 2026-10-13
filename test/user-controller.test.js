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

    assert.equal(selectedFields, '_id full_name email role createdAt');
    assert.deepEqual(sortCriteria, { createdAt: -1 });
    assert.deepEqual(responseBody, { data: expectedUsers });
  } finally {
    User.find = originalFind;
  }
});
