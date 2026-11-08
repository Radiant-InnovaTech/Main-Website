'use strict';
// Storage for form entries, admin one-time codes and the audit log.
//
//   DATA_STORE=firestore   production: Google Firestore, so nothing is lost when Cloud Run starts a new
//                          revision. Needs FIRESTORE_DATABASE (default "(default)") and the service's
//                          identity must have the Cloud Datastore User role.
//   DATA_STORE=sqlite      default, for local work and tests: a file under backend/data.
//   DATA_STORE=memory      tests only: process memory, discarded when the process exits.
//
// Both backends expose the same few operations. Searching, sorting and paging happen here, in plain
// JavaScript, so the two behave the same. That is fine at this volume (a few hundred rows at most,
// and the retention job deletes anything older than 12 months).
const path = require('path');
const fs   = require('fs');

const TABLES = ['waitlist_entries', 'contact_requests', 'admin_otps', 'audit_logs'];

function memoryBackend() {
  if (process.env.NODE_ENV !== 'test') throw new Error('DATA_STORE=memory is allowed only in tests');
  const tables = Object.fromEntries(TABLES.map(t => [t, new Map()]));
  const ok = (t) => { if (!TABLES.includes(t)) throw new Error('Unknown table ' + t); return tables[t]; };
  return {
    name: 'memory (test only)',
    async all(t) { return [...ok(t).values()].map(row => ({ ...row })); },
    async get(t, id) { const row = ok(t).get(id); return row ? { ...row } : null; },
    async put(t, row) { ok(t).set(row.id, { ...row }); },
    async patch(t, id, fields) { const row = ok(t).get(id); if (row) ok(t).set(id, { ...row, ...fields }); },
    async remove(t, id) { ok(t).delete(id); },
    async count(t) { return ok(t).size; },
    async removeOlderThan(t, iso) {
      let deleted = 0;
      for (const [id, row] of ok(t)) if (row.created_at < iso) { ok(t).delete(id); deleted++; }
      return deleted;
    },
  };
}

// ── SQLite backend ───────────────────────────────────────────────────────────
function sqliteBackend() {
  const Database = require('better-sqlite3');
  const dataDir = path.join(__dirname, 'data');
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  const db = new Database(path.join(dataDir, 'waitlist.db'));
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE IF NOT EXISTS waitlist_entries (
      id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL UNIQUE, role TEXT NOT NULL,
      company TEXT NOT NULL, country TEXT NOT NULL, user_type TEXT NOT NULL, profile_url TEXT, use_case TEXT,
      consent INTEGER NOT NULL DEFAULT 1, ip_address TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_waitlist_email      ON waitlist_entries(email);
    CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_entries(created_at);
    CREATE INDEX IF NOT EXISTS idx_waitlist_user_type  ON waitlist_entries(user_type);
    CREATE TABLE IF NOT EXISTS admin_otps (
      id TEXT PRIMARY KEY, email TEXT NOT NULL, otp_hash TEXT NOT NULL, expires_at TEXT NOT NULL,
      used INTEGER NOT NULL DEFAULT 0, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_otps_email ON admin_otps(email);
    CREATE TABLE IF NOT EXISTS contact_requests (
      id TEXT PRIMARY KEY, full_name TEXT NOT NULL, email TEXT NOT NULL, company TEXT NOT NULL,
      company_size TEXT, soc_maturity TEXT, deployment_preference TEXT, ip_address TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_contact_created_at ON contact_requests(created_at);
    CREATE TABLE IF NOT EXISTS audit_logs (
      id TEXT PRIMARY KEY, action TEXT NOT NULL, details TEXT, admin_email TEXT, ip TEXT, created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
  `);
  // Columns added for the Talk to us form. SQLite has no "ADD COLUMN IF NOT EXISTS".
  const have = new Set(db.prepare('PRAGMA table_info(contact_requests)').all().map(c => c.name));
  for (const [col, type] of [['role', 'TEXT'], ['monitoring', 'TEXT'], ['message', 'TEXT'], ['consent', 'INTEGER']]) {
    if (!have.has(col)) db.exec(`ALTER TABLE contact_requests ADD COLUMN ${col} ${type}`);
  }
  const ok = (t) => { if (!TABLES.includes(t)) throw new Error('Unknown table ' + t); return t; };
  return {
    name: 'sqlite (' + path.join(dataDir, 'waitlist.db') + ')',
    async all(t)        { return db.prepare(`SELECT * FROM ${ok(t)}`).all(); },
    async get(t, id)    { return db.prepare(`SELECT * FROM ${ok(t)} WHERE id = ?`).get(id) || null; },
    async put(t, row)   {
      const cols = Object.keys(row);
      db.prepare(`INSERT OR REPLACE INTO ${ok(t)} (${cols.join(',')}) VALUES (${cols.map(c => '@' + c).join(',')})`).run(row);
    },
    async patch(t, id, f) {
      const cols = Object.keys(f);
      db.prepare(`UPDATE ${ok(t)} SET ${cols.map(c => c + ' = @' + c).join(', ')} WHERE id = @id`).run({ ...f, id });
    },
    async remove(t, id) { db.prepare(`DELETE FROM ${ok(t)} WHERE id = ?`).run(id); },
    async count(t)      { return db.prepare(`SELECT COUNT(*) AS n FROM ${ok(t)}`).get().n; },
    async removeOlderThan(t, iso) { return db.prepare(`DELETE FROM ${ok(t)} WHERE created_at < ?`).run(iso).changes; },
  };
}

// ── Firestore backend ────────────────────────────────────────────────────────
function firestoreBackend() {
  const { Firestore } = require('@google-cloud/firestore');
  const database = process.env.FIRESTORE_DATABASE || '(default)';
  const fsdb = new Firestore({
    projectId: process.env.GOOGLE_CLOUD_PROJECT || undefined,
    databaseId: database,
    ignoreUndefinedProperties: true,
  });
  const col = (t) => { if (!TABLES.includes(t)) throw new Error('Unknown table ' + t); return fsdb.collection(t); };
  return {
    name: 'firestore (' + database + ')',
    async all(t) { const s = await col(t).get(); return s.docs.map(d => ({ id: d.id, ...d.data() })); },
    async get(t, id) { const d = await col(t).doc(id).get(); return d.exists ? { id: d.id, ...d.data() } : null; },
    async put(t, row) { await col(t).doc(row.id).set(row); },
    async patch(t, id, f) { await col(t).doc(id).update(f); },
    async remove(t, id) { await col(t).doc(id).delete(); },
    async count(t) { return (await col(t).count().get()).data().count; },
    async removeOlderThan(t, iso) {
      let deleted = 0;
      for (;;) {
        const s = await col(t).where('created_at', '<', iso).limit(400).get();
        if (s.empty) return deleted;
        const batch = fsdb.batch(); s.docs.forEach(d => batch.delete(d.ref)); await batch.commit(); deleted += s.size;
      }
    },
  };
}

const kind = (process.env.DATA_STORE || 'sqlite').toLowerCase();
const backend = kind === 'firestore' ? firestoreBackend() : kind === 'memory' ? memoryBackend() : sqliteBackend();

// ── Shared helpers, same for both backends ───────────────────────────────────
const newestFirst = (a, b) => (a.created_at < b.created_at ? 1 : a.created_at > b.created_at ? -1 : 0);

// Case-insensitive substring search across `fields`, exact match on `equals`, newest first, optional paging.
async function search(table, { term = '', fields = [], equals = {}, limit = null, offset = 0 } = {}) {
  let rows = await backend.all(table);
  const t = String(term).trim().toLowerCase();
  if (t) rows = rows.filter(r => fields.some(f => String(r[f] == null ? '' : r[f]).toLowerCase().includes(t)));
  for (const [k, v] of Object.entries(equals)) if (v) rows = rows.filter(r => r[k] === v);
  rows.sort(newestFirst);
  const total = rows.length;
  const weekCutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const week = rows.filter(r => new Date(r.created_at).getTime() > weekCutoff).length;
  if (limit != null) rows = rows.slice(offset, offset + limit);
  return { rows, total, week };
}

async function findWaitlistByEmail(email) {
  return (await backend.all('waitlist_entries')).find(r => r.email === email) || null;
}

// Admin one-time codes.
async function invalidateOtps(email) {
  const rows = (await backend.all('admin_otps')).filter(r => r.email === email && !r.used);
  for (const r of rows) await backend.patch('admin_otps', r.id, { used: 1 });
}
async function latestOtp(email) {
  const rows = (await backend.all('admin_otps')).filter(r => r.email === email && !r.used);
  rows.sort(newestFirst);
  return rows[0] || null;
}

// Retention: delete form entries older than `months`, and spent one-time codes older than a day.
async function purge(months) {
  const cutoff = new Date(); cutoff.setMonth(cutoff.getMonth() - months);
  const iso = cutoff.toISOString();
  const contacts = await backend.removeOlderThan('contact_requests', iso);
  const waitlist = await backend.removeOlderThan('waitlist_entries', iso);
  const audits = await backend.removeOlderThan('audit_logs', iso);
  await backend.removeOlderThan('admin_otps', new Date(Date.now() - 24 * 3600 * 1000).toISOString());
  return { contacts, waitlist, audits };
}

// Public submissions used to copy names, emails and IP addresses into the audit log. Keep the event and entry id,
// but remove that duplicate personal data so deleting or expiring a form record actually removes the contact details.
async function scrubAuditPii() {
  const actions = new Set(['waitlist_submit', 'contact_submit', 'admin_delete', 'admin_delete_contact']);
  let changed = 0;
  for (const row of await backend.all('audit_logs')) {
    if (!actions.has(row.action)) continue;
    let parsed = {};
    try { parsed = JSON.parse(row.details || '{}'); } catch { /* replace malformed legacy details below */ }
    const details = JSON.stringify({ entry_id: parsed.entry_id || null });
    if (row.details === details && !row.ip) continue;
    await backend.patch('audit_logs', row.id, { details, ip: null });
    changed++;
  }
  return changed;
}

module.exports = {
  name: backend.name,
  get: backend.get, put: backend.put, patch: backend.patch, remove: backend.remove, count: backend.count,
  search, findWaitlistByEmail, invalidateOtps, latestOtp, purge, scrubAuditPii,
};
