const http = require('http');

const BASE = 'http://localhost:3000';

function request({ method = 'GET', path = '/', body = null, headers = {} }) {
  return new Promise((resolve, reject) => {
    const data = body ? JSON.stringify(body) : null;
    const req = http.request(
      `${BASE}${path}`,
      { method, headers: { 'Content-Type': 'application/json', ...headers, ...(data ? { 'Content-Length': Buffer.byteLength(data) } : {}) } },
      (res) => {
        let raw = '';
        res.on('data', (chunk) => {
          raw += chunk.toString();
        });
        res.on('end', () => {
          let payload = null;
          try {
            payload = raw ? JSON.parse(raw) : null;
          } catch (err) {
            payload = raw;
          }

          resolve({ status: res.statusCode, headers: res.headers, body: payload });
        });
      }
    );

    req.on('error', reject);

    if (data) req.write(data);
    req.end();
  });
}

(async () => {
  const results = [];

  const push = async (label, fn) => {
    try {
      const result = await fn();
      results.push({ label, ...result });
    } catch (err) {
      results.push({ label, status: 'ERROR', body: err.message });
    }
  };

  await push('GET /', () => request({ path: '/' }));
  await push('GET /api/products', () => request({ path: '/api/products' }));
  await push('GET /api/categories', () => request({ path: '/api/categories' }));
  await push('GET /api/tags', () => request({ path: '/api/tags' }));
  await push('GET /api/delivery-addresses', () => request({ path: '/api/delivery-addresses' }));

  const uniqueEmail = `qa${Date.now()}@example.com`;
  const registerBody = {
    full_name: 'QA User',
    email: uniqueEmail,
    password: 'Password123',
    role: 'user'
  };

  await push('POST /auth/register', () => request({ method: 'POST', path: '/auth/register', body: registerBody }));

  const loginRes = await request({
    method: 'POST',
    path: '/auth/login',
    body: { email: uniqueEmail, password: 'Password123' }
  });

  results.push({ label: 'POST /auth/login', status: loginRes.status, body: loginRes.body });

  const token = loginRes.body && loginRes.body.token ? loginRes.body.token : null;
  const authHeaders = token ? { Authorization: `Bearer ${token}` } : {};

  await push('GET /auth/me', () => request({ path: '/auth/me', headers: authHeaders }));
  await push('POST /api/categories', () => request({ method: 'POST', path: '/api/categories', body: { name: 'QA Category' }, headers: authHeaders }));
  await push('POST /api/tags', () => request({ method: 'POST', path: '/api/tags', body: { name: 'QA Tag' }, headers: authHeaders }));
  await push('POST /api/delivery-addresses', () => request({ method: 'POST', path: '/api/delivery-addresses', body: { name: 'Rumah QA', kelurahan: 'K', kecamatan: 'C', kabupaten: 'B', provinsi: 'P', detail: 'jalan test' }, headers: authHeaders }));

  console.log('API_CHECK_RESULTS');
  for (const item of results) {
    console.log(JSON.stringify(item));
  }
})();
