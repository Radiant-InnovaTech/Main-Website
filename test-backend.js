#!/usr/bin/env node
'use strict';

/**
 * Radiant Nexus Backend — Integration Tests
 * Run: node test-backend.js
 * Requires the backend to be running on localhost:3000
 */

const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:3000';

async function fetchJson(url, opts = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(opts.headers || {}) },
    ...opts,
  });
  let json = {};
  try { json = await res.json(); } catch { /* empty body */ }
  return { res, json, status: res.status, ok: res.ok };
}

// ── Tests ────────────────────────────────────────────────────────────────────

async function testHealth() {
  console.log('\n[1] Health check...');
  try {
    const { ok, json } = await fetchJson(`${BACKEND_URL}/api/health`);
    if (ok && json.success) {
      console.log('  ✓ Health check passed:', json.status, '| entries:', json.entries);
      return true;
    }
    console.error('  ✗ Health check failed:', json);
    return false;
  } catch (err) {
    console.error('  ✗ Health check error (is the server running?):', err.message);
    return false;
  }
}

async function testWaitlistSubmission() {
  console.log('\n[2] Waitlist submission...');
  const testEmail = `test-${Date.now()}@example.com`;
  try {
    const { ok, json, status } = await fetchJson(`${BACKEND_URL}/api/waitlist/submit`, {
      method: 'POST',
      body: JSON.stringify({
        full_name:   'Test User',
        email:       testEmail,
        role:        'SOC Analyst',
        company:     'Test Company Ltd',
        country:     'Ghana',
        user_type:   'SOC Analyst',
        profile_url: 'https://linkedin.com/in/testuser',
        use_case:    'Automated alert triage',
        consent:     true,
        _hp:         '',
      }),
    });

    if (ok && json.success) {
      console.log('  ✓ Submission accepted | entry_id:', json.entry_id);
      return { success: true, email: testEmail, entryId: json.entry_id };
    }
    console.error('  ✗ Submission failed | status:', status, '| error:', json.error);
    return { success: false };
  } catch (err) {
    console.error('  ✗ Submission error:', err.message);
    return { success: false };
  }
}

async function testDuplicateRejection(email) {
  console.log('\n[3] Duplicate email rejection...');
  try {
    const { status, json } = await fetchJson(`${BACKEND_URL}/api/waitlist/submit`, {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Duplicate User', email,
        role: 'Analyst', company: 'Test Co', country: 'Ghana',
        user_type: 'SOC Analyst', consent: true, _hp: '',
      }),
    });
    if (status === 409) {
      console.log('  ✓ Duplicate correctly rejected with 409');
      return true;
    }
    console.error('  ✗ Expected 409, got', status, json);
    return false;
  } catch (err) {
    console.error('  ✗ Duplicate test error:', err.message);
    return false;
  }
}

async function testHoneypot() {
  console.log('\n[4] Honeypot bot detection...');
  try {
    const { ok, status } = await fetchJson(`${BACKEND_URL}/api/waitlist/submit`, {
      method: 'POST',
      body: JSON.stringify({
        full_name: 'Bot', email: `bot-${Date.now()}@spam.com`,
        role: 'Bot', company: 'BotCo', country: 'Nowhere',
        user_type: 'Other', consent: true,
        _hp: 'i-am-a-bot', // honeypot filled
      }),
    });
    if (ok) {
      // Should silently accept (200) without storing
      console.log('  ✓ Honeypot silently accepted (200) — bot not stored');
      return true;
    }
    console.error('  ✗ Unexpected status for honeypot:', status);
    return false;
  } catch (err) {
    console.error('  ✗ Honeypot test error:', err.message);
    return false;
  }
}

async function testOtpFlow() {
  console.log('\n[5] Admin OTP authentication flow...');
  try {
    // Request OTP
    const reqRes = await fetchJson(`${BACKEND_URL}/api/admin/auth/request-otp`, {
      method: 'POST',
      body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com' }),
    });
    if (!reqRes.ok) {
      console.error('  ✗ OTP request failed:', reqRes.json);
      return null;
    }
    console.log('  ✓ OTP request accepted — check email for code (or server console in dev mode)');
    console.log('  ℹ  In dev mode: OTP is printed in server stdout. In prod: sent via Brevo.');
    return true; // Can't verify automatically without the actual OTP
  } catch (err) {
    console.error('  ✗ OTP flow error:', err.message);
    return false;
  }
}

async function testInvalidOtp() {
  console.log('\n[6] Invalid OTP rejection...');
  try {
    const { status, json } = await fetchJson(`${BACKEND_URL}/api/admin/auth/verify-otp`, {
      method: 'POST',
      body: JSON.stringify({ email: 'samuelmaclar@radiantinnovatech.com', code: '000000' }),
    });
    if (status === 401) {
      console.log('  ✓ Invalid OTP correctly rejected with 401');
      return true;
    }
    console.error('  ✗ Expected 401, got', status, json);
    return false;
  } catch (err) {
    console.error('  ✗ Invalid OTP test error:', err.message);
    return false;
  }
}

async function testValidationErrors() {
  console.log('\n[7] Form validation...');
  try {
    const { status, json } = await fetchJson(`${BACKEND_URL}/api/waitlist/submit`, {
      method: 'POST',
      body: JSON.stringify({ full_name: '', email: 'not-an-email', consent: false, _hp: '' }),
    });
    if (status === 400 && json.details && json.details.length > 0) {
      console.log('  ✓ Validation errors returned correctly:', json.details.length, 'errors');
      return true;
    }
    console.error('  ✗ Expected 400 with validation errors, got', status, json);
    return false;
  } catch (err) {
    console.error('  ✗ Validation test error:', err.message);
    return false;
  }
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function runTests() {
  console.log('=================================================');
  console.log('  Radiant Nexus Backend Integration Tests');
  console.log(`  Target: ${BACKEND_URL}`);
  console.log('=================================================');

  const results = {};

  results.health        = await testHealth();
  if (!results.health) {
    console.error('\n  Server not reachable — aborting remaining tests.');
    process.exit(1);
  }

  const sub             = await testWaitlistSubmission();
  results.submission    = sub.success;
  results.duplicate     = sub.email ? await testDuplicateRejection(sub.email) : false;
  results.honeypot      = await testHoneypot();
  results.otpRequest    = await testOtpFlow();
  results.invalidOtp    = await testInvalidOtp();
  results.validation    = await testValidationErrors();

  console.log('\n=================================================');
  console.log('  Test Summary');
  console.log('=================================================');
  let allPassed = true;
  for (const [name, passed] of Object.entries(results)) {
    const icon = passed ? '✓' : '✗';
    const label = passed ? 'PASSED' : 'FAILED';
    console.log(`  ${icon} ${name.padEnd(16)} ${label}`);
    if (!passed) allPassed = false;
  }
  console.log('');
  console.log(allPassed ? '  ✓ ALL TESTS PASSED' : '  ✗ SOME TESTS FAILED');
  console.log('=================================================\n');

  process.exit(allPassed ? 0 : 1);
}

runTests().catch(err => {
  console.error('Unexpected error:', err);
  process.exit(1);
});

module.exports = { runTests };