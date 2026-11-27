'use strict';
// The Axis Sprint pilot form: what the server accepts, what the admin panel shows, and that the built page
// asks exactly the questions in backend/pilot-form.json.

const test = require('node:test');
const assert = require('node:assert/strict');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');

const SPEC = require('../pilot-form.json');
const FIELDS = SPEC.sections.flatMap(s => s.fields);
const PAGE = path.join(__dirname, '..', '..', 'public-site', 'pilot', 'axis-sprint', 'index.html');

const servers = [];
function start(port, extraEnv) {
  const child = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: {
      ...process.env, PORT: String(port), NODE_ENV: 'test', DATA_STORE: 'memory',
      JWT_SECRET: 'test-only-secret-with-enough-entropy', ADMIN_EMAILS: 'samuelmaclar@radiantinnovatech.com',
      TURNSTILE_SITE_KEY: '', TURNSTILE_SECRET_KEY: '', ...extraEnv,
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  servers.push(child);
  return `http://127.0.0.1:${port}`;
}
async function ready(base) {
  for (let i = 0; i < 50; i++) {
    try { if ((await fetch(base + '/api/health')).ok) return; } catch { /* still starting */ }
    await new Promise(r => setTimeout(r, 100));
  }
  throw new Error('test server did not start');
}
async function json(base, route, options = {}) {
  const response = await fetch(base + route, { ...options, headers: { 'content-type': 'application/json', ...(options.headers || {}) } });
  return { response, body: await response.json().catch(() => ({})) };
}
const post = (base, body) => json(base, '/api/pilot/submit', { method: 'POST', body: JSON.stringify(body) });

// A complete, valid application.
function application(overrides = {}) {
  return {
    startup_name: 'Kente Pay', full_name: 'Ama Mensah', email: 'Ama@KentePay.example', is_founder: 'Yes',
    pilot_contact_name: 'Kofi Owusu', pilot_contact_email: 'kofi@kentepay.example', pilot_contact_phone: '+233 20 000 0000',
    security_lead_status: 'Yes, a founder or engineer alongside other work', security_lead_name: 'Kofi Owusu', security_lead_email: 'kofi@kentepay.example',
    hosting: ['Amazon Web Services', 'Google Cloud'], sign_in: ['Google Workspace'], tools: ['Wazuh', 'Cloudflare'], tools_other: '',
    alerts_central: 'Partly', alert_volume: '10 to 100', alert_handling: 'Developers or IT, when they have time', coverage: '25 to 100',
    incidents: 'None that we know of', goals: ['Read alerts we do not have time for'], success: 'Fewer alerts left unread.',
    start_when: 'Within a month', weekly_time: 'One to two hours', feedback_calls: 'Yes', naming: 'Ask us first', notes: '',
    consent: true, _hp: '',
    ...overrides,
  };
}

let BASE, CLOSED;
test.before(async () => {
  BASE = start(39125, { PILOT_FORM_ENABLED: 'true' });
  CLOSED = start(39126, {});
  await Promise.all([ready(BASE), ready(CLOSED)]);
});
test.after(() => { for (const s of servers) if (!s.killed) s.kill('SIGTERM'); });

test('rejects incomplete or invented answers and keeps only known questions', async () => {
  const noTools = await post(BASE, application({ tools: [] }));
  assert.equal(noTools.response.status, 400);
  assert.match(noTools.body.error, /security tools/);

  const invented = await post(BASE, application({ alert_volume: 'A million' }));
  assert.equal(invented.response.status, 400);
  assert.match(invented.body.error, /choose from the options/);

  const inventedBox = await post(BASE, application({ hosting: ['Amazon Web Services', 'Mars'] }));
  assert.equal(inventedBox.response.status, 400);

  const badEmail = await post(BASE, application({ pilot_contact_email: 'not-an-email' }));
  assert.equal(badEmail.response.status, 400);
  assert.match(badEmail.body.error, /Pilot contact's email/);

  const noConsent = await post(BASE, application({ consent: false }));
  assert.equal(noConsent.response.status, 400);

  const tooLong = await post(BASE, application({ success: 'x'.repeat(2001) }));
  assert.equal(tooLong.response.status, 400);

  const notAString = await post(BASE, application({ full_name: { $gt: '' } }));
  assert.equal(notAString.response.status, 400);

  // A security lead's name and email are needed unless the answer was "Not yet".
  const leadMissing = await post(BASE, application({ security_lead_name: '' }));
  assert.equal(leadMissing.response.status, 400);
  assert.match(leadMissing.body.error, /Security lead's name/);
  const noLeadYet = await post(BASE, application({ security_lead_status: 'Not yet', security_lead_name: '', security_lead_email: '', startup_name: 'Second Startup' }));
  assert.equal(noLeadYet.response.status, 200);

  const bot = await post(BASE, application({ _hp: 'filled by a bot' }));
  assert.equal(bot.response.status, 200);
  assert.equal(bot.body.entry_id, undefined);
});

test('a valid application is stored, listed, exported and deleted by an admin', async () => {
  const sent = await post(BASE, application({ is_admin: true, tools: 'Wazuh' }));
  assert.equal(sent.response.status, 200);
  assert.match(sent.body.entry_id, /^[0-9a-f-]{36}$/);

  const denied = await json(BASE, '/api/admin/pilot');
  assert.equal(denied.response.status, 401);

  const otp = await json(BASE, '/api/admin/auth/request-otp', { method: 'POST', body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com' }) });
  const login = await json(BASE, '/api/admin/auth/verify-otp', { method: 'POST', body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com', code: otp.body.test_code }) });
  const auth = { authorization: `Bearer ${login.body.token}` };

  const list = await json(BASE, '/api/admin/pilot?search=Kente%20Pay', { headers: auth });
  assert.equal(list.body.total, 1);
  const row = list.body.rows[0];
  assert.equal(row.id, sent.body.entry_id);
  assert.equal(row.email, 'ama@kentepay.example');
  assert.deepEqual(row.answers.tools, ['Wazuh']);
  assert.deepEqual(row.answers.hosting, ['Amazon Web Services', 'Google Cloud']);
  assert.equal(row.answers.is_admin, undefined);
  assert.deepEqual(Object.keys(row.answers).sort(), FIELDS.map(f => f.name).sort());
  assert.equal(list.body.sections.length, SPEC.sections.length);

  const exported = await fetch(BASE + '/api/admin/pilot/export?search=Kente%20Pay', { headers: auth });
  const csv = await exported.text();
  assert.equal(exported.status, 200);
  const lines = csv.trim().split('\n');
  assert.equal(lines.length, 2);
  assert.match(lines[0], /Pilot contact's email/);
  assert.match(lines[1], /Amazon Web Services; Google Cloud/);

  const logs = await json(BASE, '/api/admin/logs?limit=200', { headers: auth });
  const submitted = logs.body.rows.find(r => r.action === 'pilot_submit' && r.details.includes(sent.body.entry_id));
  assert.ok(submitted);
  assert.equal(submitted.ip, null);

  const removed = await json(BASE, `/api/admin/pilot/${sent.body.entry_id}`, { method: 'DELETE', headers: auth });
  assert.equal(removed.response.status, 200);
  const after = await json(BASE, '/api/admin/pilot?search=Kente%20Pay', { headers: auth });
  assert.equal(after.body.total, 0);
});

test('the form is refused when its switch is off', async () => {
  const closed = await post(CLOSED, application());
  assert.equal(closed.response.status, 503);
});

test('the pilot page is not indexed and asks exactly the questions the server checks', async () => {
  const page = await fetch(BASE + '/pilot/axis-sprint/');
  assert.equal(page.status, 200);
  assert.equal(page.headers.get('x-robots-tag'), 'noindex, nofollow');

  const html = fs.readFileSync(PAGE, 'utf8');
  assert.match(html, /<meta name="robots" content="noindex, nofollow">/);
  assert.match(html, /data-endpoint="\/api\/pilot\/submit"/);
  const unescape = s => s.replace(/&#x27;/g, "'").replace(/&quot;/g, '"').replace(/&amp;/g, '&');
  for (const f of FIELDS) {
    assert.match(html, new RegExp(`name="${f.name}"`), `page is missing ${f.name}`);
    for (const o of f.options || []) {
      const values = [...html.matchAll(new RegExp(`name="${f.name}"[^>]*value="([^"]*)"|<option value="([^"]*)"`, 'g'))].map(m => unescape(m[1] || m[2]));
      assert.ok(values.includes(o), `page is missing option "${o}" for ${f.name}`);
    }
  }
  assert.match(html, /name="consent" required/);
  // Unlisted: no other page links to it, and it is not in the sitemap.
  const sitemap = fs.readFileSync(path.join(__dirname, '..', '..', 'public-site', 'sitemap.xml'), 'utf8');
  assert.doesNotMatch(sitemap, /pilot/);
});
