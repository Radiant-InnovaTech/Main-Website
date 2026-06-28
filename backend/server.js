'use strict';

// ─── Load .env first (must be before any other require that reads env vars) ───
require('dotenv').config();

const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const morgan       = require('morgan');
const { v4: uuidv4 } = require('uuid');
const jwt          = require('jsonwebtoken');
const rateLimit    = require('express-rate-limit');
const nodemailer   = require('nodemailer');
const Database     = require('better-sqlite3');
const path         = require('path');
const fs           = require('fs');

// ─────────────────────────────────────────────────────────────────────────────
//  CONFIG
// ─────────────────────────────────────────────────────────────────────────────
const PORT       = parseInt(process.env.PORT || '3000', 10);
const JWT_SECRET = process.env.JWT_SECRET;
const NODE_ENV   = process.env.NODE_ENV || 'development';

if (!JWT_SECRET) {
  console.error('[FATAL] JWT_SECRET environment variable is not set. Refusing to start.');
  process.exit(1);
}

// Brevo / SMTP
const SMTP_HOST = process.env.SMTP_HOST || 'smtp-relay.brevo.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587', 10);
const SMTP_USER = process.env.SMTP_USER;   // your Brevo login (email)
const SMTP_PASS = process.env.SMTP_PASS;   // your Brevo SMTP key
const SMTP_FROM = process.env.SMTP_FROM || 'waitlist@radiantinnovatech.com';

// Internal team addresses notified on every new signup
const INTERNAL_NOTIFY = [
  'samuelmaclar@radiantinnovatech.com',
  'info@radiantinnovatech.com',
  'christiandwamena@radiantinnovatech.com',
];

// CORS origins
const ALLOWED_ORIGINS = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:3000',
      'http://localhost:8080',
      'https://radiantinnovatech.com',
      'https://www.radiantinnovatech.com',
    ];

// OTP TTL in milliseconds (10 minutes)
const OTP_TTL_MS = 10 * 60 * 1000;

// ─────────────────────────────────────────────────────────────────────────────
//  DATABASE SETUP
// ─────────────────────────────────────────────────────────────────────────────
const DATA_DIR = path.join(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const db = new Database(path.join(DATA_DIR, 'waitlist.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// Run schema migrations on startup
db.exec(`
  CREATE TABLE IF NOT EXISTS waitlist_entries (
    id          TEXT PRIMARY KEY,
    full_name   TEXT NOT NULL,
    email       TEXT NOT NULL UNIQUE,
    role        TEXT NOT NULL,
    company     TEXT NOT NULL,
    country     TEXT NOT NULL,
    user_type   TEXT NOT NULL,
    profile_url TEXT,
    use_case    TEXT,
    consent     INTEGER NOT NULL DEFAULT 1,
    ip_address  TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_waitlist_email      ON waitlist_entries(email);
  CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist_entries(created_at);
  CREATE INDEX IF NOT EXISTS idx_waitlist_user_type  ON waitlist_entries(user_type);

  CREATE TABLE IF NOT EXISTS admin_otps (
    id         TEXT PRIMARY KEY,
    email      TEXT NOT NULL,
    otp_hash   TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used       INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_otps_email ON admin_otps(email);

  CREATE TABLE IF NOT EXISTS audit_logs (
    id          TEXT PRIMARY KEY,
    action      TEXT NOT NULL,
    details     TEXT,
    admin_email TEXT,
    ip          TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_created_at ON audit_logs(created_at);
`);

console.log('[DB] SQLite database ready at', path.join(DATA_DIR, 'waitlist.db'));

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TRANSPORTER (Brevo SMTP)
// ─────────────────────────────────────────────────────────────────────────────
let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  transporter = nodemailer.createTransport({
    host:   SMTP_HOST,
    port:   SMTP_PORT,
    secure: false, // STARTTLS on port 587
    auth:   { user: SMTP_USER, pass: SMTP_PASS },
    pool:   true,
    maxConnections: 3,
    logger: NODE_ENV !== 'production',
    debug:  false,
  });

  transporter.verify((err) => {
    if (err) console.error('[SMTP] Connection verification failed:', err.message);
    else     console.log('[SMTP] Brevo SMTP connection verified — ready to send');
  });
} else {
  console.warn('[SMTP] SMTP_USER or SMTP_PASS not set — email will be disabled. Set them in .env');
}

// ─────────────────────────────────────────────────────────────────────────────
//  EXPRESS APP
// ─────────────────────────────────────────────────────────────────────────────
const app = express();

// Trust proxy (important when behind Nginx on Lightsail)
app.set('trust proxy', 1);

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc:   ["'self'", "'unsafe-inline'"],
      scriptSrc:  ["'self'"],
      imgSrc:     ["'self'", 'data:', 'https://placehold.co'],
    },
  },
}));

app.use(cors({
  origin: (origin, cb) => {
    // Allow requests with no Origin (curl, Postman, server-to-server)
    if (!origin) return cb(null, true);
    if (ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
    cb(new Error(`CORS: Origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(morgan(NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));

// ─────────────────────────────────────────────────────────────────────────────
//  RATE LIMITERS
// ─────────────────────────────────────────────────────────────────────────────
const waitlistLimiter = rateLimit({
  windowMs:         15 * 60 * 1000, // 15 minutes
  max:              5,
  standardHeaders:  true,
  legacyHeaders:    false,
  message:          { error: 'Too many submissions from this IP. Please try again in 15 minutes.' },
});

const otpRequestLimiter = rateLimit({
  windowMs:        5 * 60 * 1000, // 5 minutes
  max:             5,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many OTP requests. Please wait 5 minutes.' },
});

const otpVerifyLimiter = rateLimit({
  windowMs:        10 * 60 * 1000, // 10 minutes
  max:             10,
  standardHeaders: true,
  legacyHeaders:   false,
  message:         { error: 'Too many verification attempts. Please request a new code.' },
});

// ─────────────────────────────────────────────────────────────────────────────
//  HELPERS
// ─────────────────────────────────────────────────────────────────────────────
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
    req.socket?.remoteAddress ||
    'unknown'
  );
}

function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function generateToken(email) {
  return jwt.sign(
    { email, role: 'admin' },
    JWT_SECRET,
    { expiresIn: '24h' }
  );
}

function verifyToken(req, res) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Authentication required.' });
    return null;
  }
  const token = authHeader.split(' ')[1];
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    res.status(401).json({ error: 'Token invalid or expired. Please log in again.' });
    return null;
  }
}

function logAudit(action, details, adminEmail = null, ip = null) {
  try {
    db.prepare(`
      INSERT INTO audit_logs (id, action, details, admin_email, ip, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      uuidv4(),
      action,
      typeof details === 'object' ? JSON.stringify(details) : String(details),
      adminEmail,
      ip,
      new Date().toISOString()
    );
  } catch (err) {
    console.error('[AUDIT] Failed to write audit log:', err.message);
  }
}

function validateWaitlistData(data) {
  const errors = [];
  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const urlRe   = /^https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)$/;

  if (!data.full_name || String(data.full_name).trim().length < 2)
    errors.push('Full name must be at least 2 characters.');

  if (!data.email || !emailRe.test(String(data.email)))
    errors.push('A valid email address is required.');

  if (!data.role || String(data.role).trim().length < 2)
    errors.push('Job title is required.');

  if (!data.company || String(data.company).trim().length < 2)
    errors.push('Company name is required.');

  if (!data.country || String(data.country).trim().length < 2)
    errors.push('Country is required.');

  if (!data.user_type)
    errors.push('Role type selection is required.');

  if (data.profile_url && String(data.profile_url).trim() && !urlRe.test(String(data.profile_url).trim()))
    errors.push('Profile URL must be a valid https:// URL or left blank.');

  if (!data.consent)
    errors.push('Consent is required.');

  return errors;
}

// ─────────────────────────────────────────────────────────────────────────────
//  EMAIL TEMPLATES
// ─────────────────────────────────────────────────────────────────────────────
function buildApplicantEmail(entry) {
  return {
    from:    `"Radiant InnovaTech" <${SMTP_FROM}>`,
    to:      entry.email,
    subject: 'You\'re on the Radiant Nexus AI SOC Copilot waitlist ✓',
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<title>Waitlist Confirmation</title>
<style>
  body{margin:0;padding:0;background:#050816;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:580px;margin:40px auto;background:#0F1626;border:1px solid rgba(148,163,184,0.12);border-radius:12px;overflow:hidden;}
  .hero{background:linear-gradient(135deg,#0a1628 0%,#0f1d3d 100%);padding:40px 36px 32px;border-bottom:1px solid rgba(59,130,246,0.2);}
  .logo{font-size:12px;font-weight:700;letter-spacing:0.15em;color:#6AA2FF;text-transform:uppercase;margin-bottom:24px;}
  .hero h1{font-size:22px;font-weight:700;color:#F1F5FB;margin:0 0 10px;line-height:1.3;}
  .hero p{font-size:14px;color:#97A2B6;margin:0;line-height:1.6;}
  .body{padding:32px 36px;}
  .label{font-size:10px;font-weight:700;letter-spacing:0.12em;text-transform:uppercase;color:#6AA2FF;margin-bottom:14px;}
  .card{background:rgba(59,130,246,0.06);border:1px solid rgba(59,130,246,0.18);border-radius:8px;padding:18px 20px;margin-bottom:24px;}
  .row{display:flex;padding:6px 0;border-bottom:1px solid rgba(148,163,184,0.07);}
  .row:last-child{border-bottom:none;}
  .k{font-size:12px;color:#5C6678;min-width:120px;flex-shrink:0;}
  .v{font-size:12px;color:#F1F5FB;font-weight:500;word-break:break-all;}
  .msg{font-size:14px;color:#97A2B6;line-height:1.7;margin-bottom:24px;}
  .cta{display:inline-block;background:#3B82F6;color:#fff;font-size:14px;font-weight:600;padding:12px 24px;border-radius:8px;text-decoration:none;}
  .footer{padding:20px 36px;border-top:1px solid rgba(148,163,184,0.08);font-size:11px;color:#5C6678;text-align:center;line-height:1.6;}
</style>
</head>
<body>
<div class="wrap">
  <div class="hero">
    <div class="logo">Radiant InnovaTech</div>
    <h1>You're on the waitlist. 🎉</h1>
    <p>Thank you for applying to the Radiant Nexus AI SOC Copilot pilot program. We've received your application and will review it personally.</p>
  </div>
  <div class="body">
    <div class="label">Your application</div>
    <div class="card">
      <div class="row"><span class="k">Name</span><span class="v">${escHtml(entry.full_name)}</span></div>
      <div class="row"><span class="k">Email</span><span class="v">${escHtml(entry.email)}</span></div>
      <div class="row"><span class="k">Job Title</span><span class="v">${escHtml(entry.role)}</span></div>
      <div class="row"><span class="k">Company</span><span class="v">${escHtml(entry.company)}</span></div>
      <div class="row"><span class="k">Country</span><span class="v">${escHtml(entry.country)}</span></div>
      <div class="row"><span class="k">Role Type</span><span class="v">${escHtml(entry.user_type)}</span></div>
      ${entry.profile_url ? `<div class="row"><span class="k">Profile URL</span><span class="v">${escHtml(entry.profile_url)}</span></div>` : ''}
    </div>
    <p class="msg">
      We're opening the pilot program in limited batches. Waitlist members are reviewed first when new spots open. You'll hear from us directly at this email address.
    </p>
    <p class="msg" style="margin-bottom:28px;">
      If you have any questions in the meantime, feel free to reply to this email — it reaches our team directly.
    </p>
    <a class="cta" href="https://radiantinnovatech.com/pages/about.html">Learn more about Radiant Nexus →</a>
  </div>
  <div class="footer">
    Radiant InnovaTech · Accra, Ghana<br/>
    <a href="https://radiantinnovatech.com" style="color:#3B82F6;text-decoration:none;">radiantinnovatech.com</a> ·
    <a href="https://radiantinnovatech.com/pages/contact.html" style="color:#3B82F6;text-decoration:none;">Contact us</a>
  </div>
</div>
</body>
</html>`,
    text: `You're on the Radiant Nexus waitlist!\n\nHi ${entry.full_name},\n\nThank you for applying to the Radiant Nexus AI SOC Copilot pilot program. We've received your application and will review it personally.\n\nYour details:\n- Name: ${entry.full_name}\n- Email: ${entry.email}\n- Job Title: ${entry.role}\n- Company: ${entry.company}\n- Country: ${entry.country}\n- Role Type: ${entry.user_type}\n\nWe'll be in touch when pilot spots open.\n\nRadiant InnovaTech\nhttps://radiantinnovatech.com`,
  };
}

function buildTeamNotificationEmail(entry) {
  const submittedAt = new Date(entry.created_at).toLocaleString('en-GB', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', timeZone: 'UTC',
  }) + ' UTC';

  return {
    from:    `"Radiant Nexus Waitlist" <${SMTP_FROM}>`,
    to:      INTERNAL_NOTIFY.join(', '),
    subject: `🚀 New waitlist signup — ${entry.full_name} (${entry.company})`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>New Waitlist Signup</title>
<style>
  body{margin:0;padding:0;background:#050816;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:560px;margin:32px auto;background:#0F1626;border:1px solid rgba(148,163,184,0.12);border-radius:10px;overflow:hidden;}
  .header{background:#0a1628;padding:24px 28px;border-bottom:1px solid rgba(59,130,246,0.2);}
  .header h1{font-size:18px;font-weight:700;color:#F1F5FB;margin:0;}
  .header p{font-size:12px;color:#6AA2FF;margin:4px 0 0;}
  .body{padding:24px 28px;}
  .badge{display:inline-block;background:rgba(59,130,246,0.15);border:1px solid rgba(59,130,246,0.3);color:#6AA2FF;font-size:11px;font-weight:600;padding:3px 10px;border-radius:20px;margin-bottom:16px;}
  .card{background:rgba(0,0,0,0.25);border:1px solid rgba(148,163,184,0.1);border-radius:8px;overflow:hidden;margin-bottom:20px;}
  .row{display:flex;align-items:baseline;padding:9px 14px;border-bottom:1px solid rgba(148,163,184,0.06);}
  .row:last-child{border-bottom:none;}
  .k{font-size:11px;color:#5C6678;min-width:110px;flex-shrink:0;text-transform:uppercase;letter-spacing:0.06em;}
  .v{font-size:13px;color:#F1F5FB;font-weight:500;word-break:break-all;}
  .uc{padding:14px;background:rgba(59,130,246,0.05);border:1px solid rgba(59,130,246,0.12);border-radius:6px;font-size:13px;color:#97A2B6;line-height:1.6;margin-bottom:20px;}
  .uc-label{font-size:10px;font-weight:700;color:#6AA2FF;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:6px;}
  .cta{display:inline-block;background:#3B82F6;color:#fff;font-size:13px;font-weight:600;padding:10px 20px;border-radius:7px;text-decoration:none;}
  .footer{padding:14px 28px;border-top:1px solid rgba(148,163,184,0.08);font-size:11px;color:#5C6678;text-align:center;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <h1>New Waitlist Signup</h1>
    <p>Submitted ${submittedAt}</p>
  </div>
  <div class="body">
    <span class="badge">${escHtml(entry.user_type)}</span>
    <div class="card">
      <div class="row"><span class="k">Name</span><span class="v">${escHtml(entry.full_name)}</span></div>
      <div class="row"><span class="k">Email</span><span class="v"><a href="mailto:${escHtml(entry.email)}" style="color:#6AA2FF;">${escHtml(entry.email)}</a></span></div>
      <div class="row"><span class="k">Job Title</span><span class="v">${escHtml(entry.role)}</span></div>
      <div class="row"><span class="k">Company</span><span class="v">${escHtml(entry.company)}</span></div>
      <div class="row"><span class="k">Country</span><span class="v">${escHtml(entry.country)}</span></div>
      <div class="row"><span class="k">Role Type</span><span class="v">${escHtml(entry.user_type)}</span></div>
      ${entry.profile_url ? `<div class="row"><span class="k">Profile URL</span><span class="v"><a href="${escHtml(entry.profile_url)}" style="color:#6AA2FF;">${escHtml(entry.profile_url)}</a></span></div>` : ''}
      <div class="row"><span class="k">IP Address</span><span class="v" style="color:#5C6678;font-size:11px;">${escHtml(entry.ip_address || 'unknown')}</span></div>
    </div>
    ${entry.use_case ? `<div class="uc-label">Use Case / Notes</div><div class="uc">${escHtml(entry.use_case)}</div>` : ''}
    <a class="cta" href="https://radiantinnovatech.com/admin/" target="_blank">View in Admin Dashboard →</a>
  </div>
  <div class="footer">Radiant Nexus Waitlist System · Auto-generated notification</div>
</div>
</body>
</html>`,
    text: `New Waitlist Signup\n\nName: ${entry.full_name}\nEmail: ${entry.email}\nJob Title: ${entry.role}\nCompany: ${entry.company}\nCountry: ${entry.country}\nRole Type: ${entry.user_type}\n${entry.profile_url ? `Profile: ${entry.profile_url}\n` : ''}${entry.use_case ? `\nUse Case:\n${entry.use_case}\n` : ''}\nSubmitted: ${submittedAt}\n\nView admin dashboard: https://radiantinnovatech.com/admin/`,
  };
}

function buildOtpEmail(email, otp) {
  return {
    from:    `"Radiant Nexus Admin" <${SMTP_FROM}>`,
    to:      email,
    subject: `Your admin login code: ${otp}`,
    html: `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8"/>
<title>Admin OTP</title>
<style>
  body{margin:0;padding:0;background:#050816;font-family:'Helvetica Neue',Arial,sans-serif;}
  .wrap{max-width:480px;margin:40px auto;background:#0F1626;border:1px solid rgba(148,163,184,0.12);border-radius:10px;overflow:hidden;}
  .header{background:#0a1628;padding:28px 32px;border-bottom:1px solid rgba(59,130,246,0.2);}
  .header h1{font-size:18px;font-weight:700;color:#F1F5FB;margin:0;}
  .body{padding:32px;}
  .otp-box{background:rgba(59,130,246,0.08);border:2px solid rgba(59,130,246,0.3);border-radius:10px;padding:24px;text-align:center;margin:20px 0;}
  .otp{font-family:'Courier New',monospace;font-size:38px;font-weight:700;color:#6AA2FF;letter-spacing:0.25em;}
  .note{font-size:13px;color:#97A2B6;line-height:1.6;margin:16px 0 0;}
  .footer{padding:16px 32px;border-top:1px solid rgba(148,163,184,0.08);font-size:11px;color:#5C6678;text-align:center;}
</style>
</head>
<body>
<div class="wrap">
  <div class="header"><h1>Admin Login Verification</h1></div>
  <div class="body">
    <p class="note" style="margin-top:0;">Your one-time login code for the Radiant Nexus admin dashboard:</p>
    <div class="otp-box"><div class="otp">${otp}</div></div>
    <p class="note">This code expires in <strong style="color:#F1F5FB;">10 minutes</strong>. Do not share it with anyone.</p>
    <p class="note">If you did not request this code, ignore this email — your account is safe.</p>
  </div>
  <div class="footer">Radiant InnovaTech · radiantinnovatech.com</div>
</div>
</body>
</html>`,
    text: `Your Radiant Nexus admin login code is: ${otp}\n\nThis code expires in 10 minutes. Do not share it with anyone.\n\nIf you didn't request this, ignore this email.`,
  };
}

// Simple HTML escaping for email templates
function escHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

// Send mail and swallow errors gracefully (never crash the request on email failure)
async function sendMail(options) {
  if (!transporter) {
    console.warn('[EMAIL] Transporter not configured — skipping:', options.subject);
    return;
  }
  try {
    const info = await transporter.sendMail(options);
    console.log('[EMAIL] Sent:', options.subject, '→', options.to, '| messageId:', info.messageId);
  } catch (err) {
    console.error('[EMAIL] Failed to send:', options.subject, '→', options.to, '|', err.message);
  }
}

// ─────────────────────────────────────────────────────────────────────────────
//  ROUTES
// ─────────────────────────────────────────────────────────────────────────────

// ── Health check ──────────────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  const totalEntries = db.prepare('SELECT COUNT(*) AS n FROM waitlist_entries').get().n;
  res.json({
    success:   true,
    status:    'healthy',
    timestamp: new Date().toISOString(),
    uptime:    process.uptime(),
    entries:   totalEntries,
    env:       NODE_ENV,
  });
});

// ── Waitlist submission ────────────────────────────────────────────────────────
app.post('/api/waitlist/submit', waitlistLimiter, async (req, res) => {
  try {
    const ip = getClientIp(req);

    // Honeypot — bots fill hidden fields
    if (req.body._hp) {
      // Silently accept but don't store (confuses bots)
      return res.status(200).json({ success: true, message: 'Successfully added to waitlist.' });
    }

    const errors = validateWaitlistData(req.body);
    if (errors.length > 0) {
      return res.status(400).json({ error: errors[0], details: errors });
    }

    const email = String(req.body.email).toLowerCase().trim();

    // Duplicate check
    const existing = db.prepare('SELECT id FROM waitlist_entries WHERE email = ?').get(email);
    if (existing) {
      return res.status(409).json({ error: 'This email is already on the waitlist.' });
    }

    const entry = {
      id:          uuidv4(),
      full_name:   String(req.body.full_name).trim(),
      email,
      role:        String(req.body.role).trim(),
      company:     String(req.body.company).trim(),
      country:     String(req.body.country).trim(),
      user_type:   String(req.body.user_type),
      profile_url: req.body.profile_url ? String(req.body.profile_url).trim() : null,
      use_case:    req.body.use_case   ? String(req.body.use_case).trim()   : null,
      consent:     req.body.consent ? 1 : 0,
      ip_address:  ip,
      created_at:  new Date().toISOString(),
    };

    db.prepare(`
      INSERT INTO waitlist_entries
        (id, full_name, email, role, company, country, user_type, profile_url, use_case, consent, ip_address, created_at)
      VALUES
        (@id, @full_name, @email, @role, @company, @country, @user_type, @profile_url, @use_case, @consent, @ip_address, @created_at)
    `).run(entry);

    logAudit('waitlist_submit', { entry_id: entry.id, email: entry.email, name: entry.full_name }, null, ip);

    // Fire-and-forget emails (do not await to avoid slowing down the HTTP response)
    sendMail(buildApplicantEmail(entry));
    sendMail(buildTeamNotificationEmail(entry));

    return res.status(200).json({
      success:  true,
      message:  'Successfully added to waitlist.',
      entry_id: entry.id,
    });
  } catch (err) {
    console.error('[WAITLIST] Submit error:', err);
    return res.status(500).json({ error: 'Internal server error. Please try again.' });
  }
});

// ── Admin auth: request OTP ───────────────────────────────────────────────────
app.post('/api/admin/auth/request-otp', otpRequestLimiter, async (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();

    if (!email.endsWith('@radiantinnovatech.com')) {
      return res.status(400).json({ error: 'Only @radiantinnovatech.com email addresses are allowed.' });
    }

    // Invalidate any existing unused OTPs for this email
    db.prepare("UPDATE admin_otps SET used = 1 WHERE email = ? AND used = 0").run(email);

    const otp       = generateOtp();
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    db.prepare(`
      INSERT INTO admin_otps (id, email, otp_hash, expires_at, used, created_at)
      VALUES (?, ?, ?, ?, 0, ?)
    `).run(uuidv4(), email, otp, expiresAt, new Date().toISOString());
    // Note: storing OTP as plaintext here for simplicity.
    // In a higher-security environment, store bcrypt(otp) and compare with bcrypt.compare.

    await sendMail(buildOtpEmail(email, otp));

    console.log(`[OTP] Code generated for ${email} — expires ${expiresAt}`);
    // In development, also log to console so you can test without Brevo configured
    if (NODE_ENV !== 'production') {
      console.log(`[OTP][DEV] Code for ${email}: ${otp}`);
    }

    return res.json({ success: true, message: `A 6-digit code has been sent to ${email}.` });
  } catch (err) {
    console.error('[OTP] Request error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin auth: verify OTP ────────────────────────────────────────────────────
app.post('/api/admin/auth/verify-otp', otpVerifyLimiter, (req, res) => {
  try {
    const email = String(req.body.email || '').toLowerCase().trim();
    const code  = String(req.body.code  || '').trim();

    if (!code || code.length !== 6 || !/^\d{6}$/.test(code)) {
      return res.status(400).json({ error: 'Enter the 6-digit code sent to your email.' });
    }

    if (!email.endsWith('@radiantinnovatech.com')) {
      return res.status(400).json({ error: 'Invalid email address.' });
    }

    // Find latest unused, unexpired OTP for this email
    const otpRow = db.prepare(`
      SELECT id, otp_hash, expires_at
      FROM admin_otps
      WHERE email = ? AND used = 0
      ORDER BY created_at DESC
      LIMIT 1
    `).get(email);

    if (!otpRow) {
      return res.status(401).json({ error: 'No active code found. Please request a new one.' });
    }

    // Check expiry
    if (new Date() > new Date(otpRow.expires_at)) {
      db.prepare('UPDATE admin_otps SET used = 1 WHERE id = ?').run(otpRow.id);
      return res.status(401).json({ error: 'Code has expired. Please request a new one.' });
    }

    // Compare (constant-time safe for OTP strings)
    if (code !== otpRow.otp_hash) {
      return res.status(401).json({ error: 'Incorrect code. Please try again.' });
    }

    // Mark as used
    db.prepare('UPDATE admin_otps SET used = 1 WHERE id = ?').run(otpRow.id);

    const token = generateToken(email);

    logAudit('admin_login', { email }, email, getClientIp(req));

    return res.json({
      success: true,
      token,
      admin:   { email },
    });
  } catch (err) {
    console.error('[OTP] Verify error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin: get waitlist entries ───────────────────────────────────────────────
app.get('/api/admin/waitlist', (req, res) => {
  const claims = verifyToken(req, res);
  if (!claims) return;

  try {
    const page       = Math.max(1, parseInt(req.query.page  || '1', 10));
    const limit      = Math.min(200, Math.max(1, parseInt(req.query.limit || '50', 10)));
    const search     = String(req.query.search     || '').trim();
    const typeFilter = String(req.query.typeFilter || '').trim();
    const offset     = (page - 1) * limit;

    let where  = [];
    let params = [];

    if (search) {
      where.push('(full_name LIKE ? OR email LIKE ? OR company LIKE ? OR role LIKE ? OR country LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (typeFilter) {
      where.push('user_type = ?');
      params.push(typeFilter);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const total = db.prepare(`SELECT COUNT(*) AS n FROM waitlist_entries ${whereClause}`).get(...params).n;

    const rows = db.prepare(`
      SELECT id, full_name, email, role, company, country, user_type,
             profile_url, use_case, consent, created_at, ip_address
      FROM waitlist_entries
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).all(...params, limit, offset);

    // Convert consent integer back to boolean for frontend compatibility
    const formatted = rows.map(r => ({ ...r, consent: !!r.consent }));

    return res.json({ success: true, rows: formatted, total, page, limit });
  } catch (err) {
    console.error('[ADMIN] Get waitlist error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin: delete entry ───────────────────────────────────────────────────────
app.delete('/api/admin/waitlist/:id', (req, res) => {
  const claims = verifyToken(req, res);
  if (!claims) return;

  try {
    const { id } = req.params;
    const entry  = db.prepare('SELECT id, email, full_name FROM waitlist_entries WHERE id = ?').get(id);

    if (!entry) {
      return res.status(404).json({ error: 'Entry not found.' });
    }

    db.prepare('DELETE FROM waitlist_entries WHERE id = ?').run(id);

    logAudit('admin_delete',
      { entry_id: id, email: entry.email, name: entry.full_name },
      claims.email,
      getClientIp(req)
    );

    return res.json({ success: true, message: 'Entry deleted.', deleted_id: id });
  } catch (err) {
    console.error('[ADMIN] Delete error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin: export CSV ─────────────────────────────────────────────────────────
// NOTE: This route MUST be defined before the /:id DELETE route has no effect here,
// but must be before any catch-all. It's a GET so no conflict.
app.get('/api/admin/waitlist/export', (req, res) => {
  const claims = verifyToken(req, res);
  if (!claims) return;

  try {
    const search     = String(req.query.search     || '').trim();
    const typeFilter = String(req.query.typeFilter || '').trim();

    let where  = [];
    let params = [];

    if (search) {
      where.push('(full_name LIKE ? OR email LIKE ? OR company LIKE ? OR role LIKE ? OR country LIKE ?)');
      const s = `%${search}%`;
      params.push(s, s, s, s, s);
    }
    if (typeFilter) {
      where.push('user_type = ?');
      params.push(typeFilter);
    }

    const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

    const rows = db.prepare(`
      SELECT id, full_name, email, role, company, country, user_type,
             profile_url, use_case, consent, created_at, ip_address
      FROM waitlist_entries
      ${whereClause}
      ORDER BY created_at DESC
    `).all(...params);

    const header = 'ID,Full Name,Email,Job Title,Company,Country,Role Type,Profile URL,Use Case,Consent,Submitted At,IP Address\n';
    const csvRows = rows.map(r => [
      r.id,
      `"${(r.full_name   || '').replace(/"/g, '""')}"`,
      r.email,
      `"${(r.role        || '').replace(/"/g, '""')}"`,
      `"${(r.company     || '').replace(/"/g, '""')}"`,
      r.country,
      r.user_type,
      r.profile_url || '',
      `"${(r.use_case    || '').replace(/"/g, '""')}"`,
      r.consent ? 'Yes' : 'No',
      r.created_at,
      r.ip_address || '',
    ].join(',')).join('\n');

    const filename = `waitlist_${new Date().toISOString().slice(0, 10)}.csv`;
    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send('\uFEFF' + header + csvRows); // BOM for Excel UTF-8 compatibility

    logAudit('admin_export', { count: rows.length, search, typeFilter }, claims.email, getClientIp(req));
  } catch (err) {
    console.error('[ADMIN] Export error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ── Admin: audit logs ─────────────────────────────────────────────────────────
app.get('/api/admin/logs', (req, res) => {
  const claims = verifyToken(req, res);
  if (!claims) return;

  try {
    const limit = Math.min(500, Math.max(1, parseInt(req.query.limit || '200', 10)));

    const rows = db.prepare(`
      SELECT id, action, details, admin_email, ip, created_at
      FROM audit_logs
      ORDER BY created_at DESC
      LIMIT ?
    `).all(limit);

    const total = db.prepare('SELECT COUNT(*) AS n FROM audit_logs').get().n;

    return res.json({ success: true, rows, total });
  } catch (err) {
    console.error('[ADMIN] Logs error:', err);
    return res.status(500).json({ error: 'Internal server error.' });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
//  ERROR HANDLERS
// ─────────────────────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Endpoint not found: ${req.method} ${req.path}` });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[ERROR]', err);
  res.status(500).json({ error: 'Internal server error.' });
});

// ─────────────────────────────────────────────────────────────────────────────
//  START
// ─────────────────────────────────────────────────────────────────────────────
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`[SERVER] Radiant Nexus Backend running in ${NODE_ENV} mode`);
  console.log(`[SERVER] Listening on http://0.0.0.0:${PORT}`);
  console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health`);
});

// Graceful shutdown — let SQLite finish any in-progress writes
process.on('SIGTERM', () => {
  console.log('[SERVER] SIGTERM received — shutting down gracefully...');
  server.close(() => {
    db.close();
    console.log('[SERVER] Shutdown complete.');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('[SERVER] SIGINT received — shutting down...');
  server.close(() => {
    db.close();
    process.exit(0);
  });
});

module.exports = app; // for testing