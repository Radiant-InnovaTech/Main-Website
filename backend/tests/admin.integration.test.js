'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const PORT = 39123;
const BASE = `http://127.0.0.1:${PORT}`;
let child;

async function json(route, options = {}) {
  const response = await fetch(BASE + route, {
    ...options,
    headers: { 'content-type': 'application/json', ...(options.headers || {}) },
  });
  const body = await response.json().catch(() => ({}));
  return { response, body };
}

async function waitForServer() {
  for (let i = 0; i < 50; i++) {
    try {
      const response = await fetch(BASE + '/api/health');
      if (response.ok) return;
    } catch { /* still starting */ }
    await new Promise(resolve => setTimeout(resolve, 100));
  }
  throw new Error('test server did not start');
}

test.before(async () => {
  child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env,
      PORT: String(PORT),
      NODE_ENV: 'test',
      DATA_STORE: 'memory',
      FORMS_ENABLED: 'true',
      JWT_SECRET: 'test-only-secret-with-enough-entropy',
      ADMIN_EMAILS: 'samuelmaclar@radiantinnovatech.com',
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await waitForServer();
});

test.after(() => {
  if (child && !child.killed) child.kill('SIGTERM');
});

test('public forms write records and protected admin routes read, filter, export and delete them', async () => {
  const denied = await json('/api/admin/waitlist');
  assert.equal(denied.response.status, 401);

  const waitlist = await json('/api/waitlist/submit', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Test Analyst', email: 'analyst@example.com', role: 'SOC Analyst', company: 'Example Bank',
      country: 'Ghana', user_type: 'Security analyst', use_case: 'Alert triage', consent: true, _hp: '',
    }),
  });
  assert.equal(waitlist.response.status, 200);
  assert.match(waitlist.body.entry_id, /^[0-9a-f-]{36}$/);

  const contact = await json('/api/contact/submit', {
    method: 'POST',
    body: JSON.stringify({
      full_name: 'Test Contact', email: 'contact@example.com', company: 'Example Bank', role: 'CISO',
      monitoring: 'Wazuh', message: 'Please contact me.', consent: true, _hp: '',
    }),
  });
  assert.equal(contact.response.status, 200);

  const forbiddenOtp = await json('/api/admin/auth/request-otp', {
    method: 'POST', body: JSON.stringify({ email: 'info@radiantinnovatech.com' }),
  });
  assert.equal(forbiddenOtp.response.status, 403);

  const otp = await json('/api/admin/auth/request-otp', {
    method: 'POST', body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com' }),
  });
  assert.equal(otp.response.status, 200);
  assert.match(otp.body.test_code, /^\d{6}$/);

  const login = await json('/api/admin/auth/verify-otp', {
    method: 'POST', body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com', code: otp.body.test_code }),
  });
  assert.equal(login.response.status, 200);
  const auth = { authorization: `Bearer ${login.body.token}` };

  const list = await json('/api/admin/waitlist?page=1&limit=50&typeFilter=Security%20analyst', { headers: auth });
  assert.equal(list.body.total, 1);
  assert.equal(list.body.week, 1);
  assert.equal(list.body.rows[0].email, 'analyst@example.com');

  const wrongType = await json('/api/admin/waitlist?page=1&limit=50&typeFilter=Other', { headers: auth });
  assert.equal(wrongType.body.total, 0);

  const contacts = await json('/api/admin/contact?page=1&limit=50&search=Example%20Bank', { headers: auth });
  assert.equal(contacts.body.total, 1);
  assert.equal(contacts.body.week, 1);

  const exportResponse = await fetch(BASE + '/api/admin/waitlist/export?typeFilter=Other', { headers: auth });
  const csv = await exportResponse.text();
  assert.equal(exportResponse.status, 200);
  assert.equal(csv.trim().split('\n').length, 1);

  const contactExportResponse = await fetch(BASE + '/api/admin/contact/export?search=Example%20Bank', { headers: auth });
  const contactCsv = await contactExportResponse.text();
  assert.equal(contactExportResponse.status, 200);
  const contactCsvLines = contactCsv.trim().split('\n');
  assert.equal(contactCsvLines.length, 2);
  assert.equal(contactCsvLines[0].split(',').length, contactCsvLines[1].split(',').length);

  const logs = await json('/api/admin/logs?limit=200', { headers: auth });
  const submissionLog = logs.body.rows.find(row => row.action === 'waitlist_submit');
  assert.ok(submissionLog);
  assert.equal(submissionLog.details, JSON.stringify({ entry_id: waitlist.body.entry_id }));
  assert.equal(submissionLog.ip, null);

  const removed = await json(`/api/admin/waitlist/${waitlist.body.entry_id}`, { method: 'DELETE', headers: auth });
  assert.equal(removed.response.status, 200);
  const afterDelete = await json('/api/admin/waitlist?page=1&limit=50', { headers: auth });
  assert.equal(afterDelete.body.total, 0);
});

test('admin page script compiles and uses current form categories and audit field names', () => {
  const html = fs.readFileSync(path.join(__dirname, '..', '..', 'admin', 'index.html'), 'utf8');
  const scripts = [...html.matchAll(/<script>([\s\S]*?)<\/script>/g)];
  assert.ok(scripts.length);
  assert.doesNotThrow(() => new Function(scripts.at(-1)[1]));
  for (const value of ['Security analyst', 'Security engineer', 'Threat hunter', 'Head of security or CISO', 'Managed security provider']) {
    assert.match(html, new RegExp(`<option>${value}</option>`));
  }
  assert.match(html, /row\.details/);
  assert.match(html, /typeFilter/);
  assert.match(html, /toggleDetail\(\\'/);
});
