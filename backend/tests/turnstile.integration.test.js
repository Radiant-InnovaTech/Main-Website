'use strict';

// The forms refuse submissions without a valid Cloudflare Turnstile token when both keys are set.
// A local stand-in plays Cloudflare's siteverify endpoint: token "good" passes, anything else fails.
const test = require('node:test');
const assert = require('node:assert/strict');
const http = require('node:http');
const { spawn } = require('node:child_process');
const path = require('node:path');

const PORT = 39124;
const VERIFY_PORT = 39125;
const BASE = `http://127.0.0.1:${PORT}`;
let child, verifier;
const seen = [];

async function post(route, body) {
  const response = await fetch(BASE + route, {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: JSON.stringify(body),
  });
  return { response, body: await response.json().catch(() => ({})) };
}

test.before(async () => {
  verifier = http.createServer((req, res) => {
    let raw = ''; req.on('data', c => { raw += c; });
    req.on('end', () => {
      const b = JSON.parse(raw); seen.push(b);
      const ok = b.secret === 'test-secret' && b.response === 'good';
      res.setHeader('content-type', 'application/json');
      res.end(JSON.stringify(ok ? { success: true } : { success: false, 'error-codes': ['invalid-input-response'] }));
    });
  });
  await new Promise(r => verifier.listen(VERIFY_PORT, '127.0.0.1', r));

  child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env, PORT: String(PORT), NODE_ENV: 'test', DATA_STORE: 'memory',
      FORMS_ENABLED: 'true', JWT_SECRET: 'test-only-secret-with-enough-entropy',
      TURNSTILE_SITE_KEY: 'test-site-key', TURNSTILE_SECRET_KEY: 'test-secret',
      TURNSTILE_VERIFY_URL: `http://127.0.0.1:${VERIFY_PORT}/siteverify`,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(BASE + '/api/health')).ok) return; } catch { /* starting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('test server did not start');
});

test.after(() => {
  if (child && !child.killed) child.kill('SIGTERM');
  verifier.close();
});

const contact = { full_name: 'Test Contact', email: 'contact@example.com', company: 'Example Bank', role: 'CISO', message: 'Hi', consent: true };

test('forms config publishes the site key and the CSP allows the widget', async () => {
  const response = await fetch(BASE + '/api/forms/config');
  assert.deepEqual(await response.json(), { turnstile_site_key: 'test-site-key' });
  const csp = response.headers.get('content-security-policy');
  assert.match(csp, /script-src [^;]*https:\/\/challenges\.cloudflare\.com/);
  assert.match(csp, /frame-src https:\/\/challenges\.cloudflare\.com/);
});

test('submissions without a valid token are refused, a valid one is accepted', async () => {
  const none = await post('/api/contact/submit', contact);
  assert.equal(none.response.status, 400);
  assert.match(none.body.error, /robot/);

  const bad = await post('/api/waitlist/submit', { full_name: 'A B', email: 'a@example.com', role: 'x', company: 'y', country: 'Ghana', user_type: 'Security analyst', consent: true, 'cf-turnstile-response': 'forged' });
  assert.equal(bad.response.status, 400);

  const good = await post('/api/contact/submit', { ...contact, 'cf-turnstile-response': 'good' });
  assert.equal(good.response.status, 200);
  assert.equal(seen.at(-1).secret, 'test-secret');
  assert.ok(seen.at(-1).remoteip);
});
