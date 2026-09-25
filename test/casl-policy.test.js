const test = require('node:test');
const assert = require('node:assert/strict');
const { subject } = require('@casl/ability');

const { policyfor } = require('../utils');
const { police_check } = require('../middlewares');

test('user can update their own delivery address', () => {
  const user = { _id: 'u-1', role: 'user' };
  const ability = policyfor(user);

  assert.equal(ability.can('update', subject('DeliveryAddress', { user_id: 'u-1' })), true);
  assert.equal(ability.can('update', subject('DeliveryAddress', { user_id: 'u-2' })), false);
});

test('police_check blocks update when the resource belongs to another user', async () => {
  const user = { _id: 'u-1', role: 'user' };
  let statusCode = null;

  const req = {
    user,
    params: { id: 'address-1' }
  };

  const res = {
    status(code) {
      statusCode = code;
      return this;
    },
    json(payload) {
      this.payload = payload;
      return this;
    }
  };

  const next = () => {
    throw new Error('next should not be called for unauthorized access');
  };

  const middleware = police_check('update', 'DeliveryAddress', async () => ({ user_id: 'u-2' }));

  await middleware(req, res, next);

  assert.equal(statusCode, 403);
});
