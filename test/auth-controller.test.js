const test = require('node:test');
const assert = require('node:assert/strict');
process.env.SECRET_KEY = 'test-only-secret-key-long-enough-for-jwt';

const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');

const authController = require('../app/auth/controller');
const User = require('../app/user/model');
const config = require('../app/config');
const { decodeToken } = require('../middlewares');

test('register ignores client-supplied privileged fields', async () => {
  const originalSave = User.prototype.save;
  let savedUser;
  let response;
  let statusCode;
  User.prototype.save = async function () {
    savedUser = this;
    return this;
  };

  try {
    await authController.register(
      {
        body: {
          full_name: 'Test User',
          email: 'user@example.com',
          password: 'Password123',
          role: 'admin',
          token: ['attacker-token']
        }
      },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { response = payload; return payload; }
      },
      (error) => { throw error || new Error('next should not be called'); }
    );

    assert.equal(savedUser.role, 'user');
    assert.deepEqual(savedUser.token, []);
    assert.equal(statusCode, 201);
    assert.equal(response.password, undefined);
    assert.equal(response.token, undefined);
  } finally {
    User.prototype.save = originalSave;
  }
});

test('configuration rejects a missing or short JWT secret', () => {
  const configPath = require.resolve('../app/config');
  const originalSecret = process.env.SECRET_KEY;

  try {
    for (const invalidSecret of ['', 'short']) {
      process.env.SECRET_KEY = invalidSecret;
      delete require.cache[configPath];
      assert.throws(() => require('../app/config'), /at least 32 characters/);
    }
  } finally {
    process.env.SECRET_KEY = originalSecret;
    delete require.cache[configPath];
    require('../app/config');
  }
});

test('localStrategy compares passwords asynchronously and omits the hash', async () => {
  const originalFindOne = User.findOne;
  const hashedPassword = bcrypt.hashSync('Password123', 4);
  User.findOne = () => ({
    select: async () => ({
      _id: 'user-1',
      email: 'user@example.com',
      password: hashedPassword,
      role: 'user',
      toJSON() {
        return { ...this };
      }
    })
  });

  try {
    const result = await new Promise((resolve, reject) => {
      authController.localStrategy('user@example.com', 'Password123', (error, user) => {
        if (error) return reject(error);
        resolve(user);
      });
    });

    assert.equal(result.email, 'user@example.com');
    assert.equal(result.password, undefined);
  } finally {
    User.findOne = originalFindOne;
  }
});

test('login issues a JWT that expires within one hour', async () => {
  const originalAuthenticate = passport.authenticate;
  const originalFindByIdAndUpdate = User.findByIdAndUpdate;
  const user = { _id: 'user-1', email: 'user@example.com', role: 'user' };
  passport.authenticate = (strategy, options, callback) => (req, res, next) => callback(null, user);
  User.findByIdAndUpdate = async () => user;

  try {
    const result = await new Promise((resolve, reject) => {
      authController.login(
        {},
        {
          status() { return this; },
          json: resolve
        },
        reject
      );
    });

    const claims = jwt.verify(result.token, config.secretKey);
    assert.ok(claims.exp - claims.iat <= 60 * 60);
    assert.equal(result.user.email, user.email);
  } finally {
    passport.authenticate = originalAuthenticate;
    User.findByIdAndUpdate = originalFindByIdAndUpdate;
  }
});

test('me returns one 401 response when the request has no authenticated user', () => {
  let statusCode = null;
  const responses = [];

  const result = authController.me(
    { user: undefined },
    {
      status(code) {
        statusCode = code;
        return this;
      },
      json(payload) {
        responses.push(payload);
        return payload;
      }
    }
  );

  assert.equal(statusCode, 401);
  assert.deepEqual(responses, [{
    err: 1,
    message: 'you, are not login or token Expired'
  }]);
  assert.deepEqual(result, responses[0]);
});

test('logout returns one response when there is no matching token', async () => {
  const originalFindOneAndUpdate = User.findOneAndUpdate;
  const responses = [];
  User.findOneAndUpdate = async () => {
    throw new Error('database query should not run without a token');
  };

  try {
    const result = await authController.logout(
      { headers: {} },
      {
        json(payload) {
          responses.push(payload);
          return payload;
        }
      }
    );

    assert.deepEqual(responses, [{
      error: 0,
      message: 'Logout Anda Berhasil'
    }]);
    assert.deepEqual(result, responses[0]);
  } finally {
    User.findOneAndUpdate = originalFindOneAndUpdate;
  }
});

test('decodeToken returns 401 for an invalid token', async () => {
  let statusCode = null;
  let nextCalled = false;
  const middleware = decodeToken();

  await middleware(
    { headers: { authorization: 'Bearer invalid-token' } },
    {
      status(code) { statusCode = code; return this; },
      json(payload) { this.payload = payload; return payload; }
    },
    () => { nextCalled = true; }
  );

  assert.equal(statusCode, 401);
  assert.equal(nextCalled, false);
});

test('decodeToken returns 401 for an expired token', async () => {
  let statusCode = null;
  let nextCalled = false;
  const token = jwt.sign({ _id: 'user-1' }, config.secretKey, { expiresIn: -1 });

  await decodeToken()(
    { headers: { authorization: `Bearer ${token}` } },
    {
      status(code) { statusCode = code; return this; },
      json(payload) { this.payload = payload; return payload; }
    },
    () => { nextCalled = true; }
  );

  assert.equal(statusCode, 401);
  assert.equal(nextCalled, false);
});

test('decodeToken returns 401 for a revoked token', async () => {
  const originalFindOne = User.findOne;
  let statusCode = null;
  User.findOne = async () => null;
  const token = jwt.sign({ _id: 'user-1' }, config.secretKey);

  try {
    await decodeToken()(
      { headers: { authorization: `Bearer ${token}` } },
      {
        status(code) { statusCode = code; return this; },
        json(payload) { this.payload = payload; return payload; }
      },
      () => { throw new Error('next should not be called for revoked tokens'); }
    );
    assert.equal(statusCode, 401);
  } finally {
    User.findOne = originalFindOne;
  }
});
