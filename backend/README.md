# Radiant Nexus Backend v2

Production-ready Express.js API for the Radiant Nexus waitlist and admin dashboard.

---

## What's in this backend

| Feature | Implementation |
|---|---|
| **Waitlist submissions** | POST endpoint with validation, honeypot, duplicate detection |
| **SQLite persistence** | `better-sqlite3` — data stored in `data/waitlist.db` (survives restarts) |
| **Brevo email (applicant)** | Branded HTML confirmation email sent to the person who signed up |
| **Brevo email (team)** | Notification email to samuelmaclar, info, and christiandwamena on every signup |
| **Admin OTP login** | OTP stored in DB with 10-minute expiry — fixed and working |
| **JWT sessions** | 24-hour tokens for admin dashboard |
| **Rate limiting** | 5 waitlist submissions per 15 min per IP, 5 OTP requests per 5 min |
| **Audit logs** | All admin actions written to `audit_logs` table |
| **CSV export** | Admin can export filtered waitlist to CSV with BOM for Excel |
| **Systemd service** | Starts on boot, restarts on crash |
| **Nginx reverse proxy** | Routes `/api/*` to Node.js, serves static files, handles gzip + caching |

---

## Prerequisites (on the Lightsail server)

- Ubuntu 22.04 LTS
- Node.js 18+ (script installs it)
- Nginx (script installs it)
- A domain pointed at the Lightsail instance IP
- A Brevo account for transactional email

---

## Step 1 — Get your Brevo SMTP credentials

1. Go to [app.brevo.com](https://app.brevo.com) → **SMTP & API** → **SMTP**
2. Note your **SMTP login** (your Brevo account email)
3. Click **Generate a new SMTP key** → copy the key (starts with `xsmtp-...`)
4. Verify `waitlist@radiantinnovatech.com` as a sender in Brevo → **Senders & IP** → **Senders**

---

## Step 2 — Lightsail firewall ports

In the Lightsail console → **Instances** → your instance → **Networking** tab:

Add these rules under **IPv4 firewall**:
| Application | Port | Protocol |
|---|---|---|
| HTTP | 80 | TCP |
| HTTPS | 443 | TCP |

> **Do NOT expose port 3000** — Nginx proxies API traffic, Node.js never needs to be public.

---

## Step 3 — Upload files to the server

Connect via SSH (Lightsail console → **Connect using SSH** or your own key):

```bash
# Option A — clone from GitHub
git clone https://github.com/RadiantSeraph1/Radiant-Nexus.git /tmp/radiant-repo
sudo mkdir -p /var/www/radiant-nexus
sudo cp -r /tmp/radiant-repo/backend /var/www/radiant-nexus/backend
sudo cp -r /tmp/radiant-repo/index.html /tmp/radiant-repo/pages /tmp/radiant-repo/css \
           /tmp/radiant-repo/js /tmp/radiant-repo/assets /tmp/radiant-repo/waitlist \
           /tmp/radiant-repo/admin /var/www/radiant-nexus/public/

# Option B — upload via SFTP (FileZilla / WinSCP)
# Upload the entire project to /var/www/radiant-nexus/
```

---

## Step 4 — Run the setup script

```bash
cd /var/www/radiant-nexus/backend/deploy
chmod +x setup.sh
sudo ./setup.sh
```

This installs Node.js 20, Nginx, creates the `radiant` service user, installs npm dependencies, registers the systemd service, and configures Nginx.

---

## Step 5 — Create your .env file

```bash
# Copy the template
sudo cp /var/www/radiant-nexus/backend/.env.example /var/www/radiant-nexus/backend/.env

# Generate a strong JWT secret
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# Edit .env with your values
sudo nano /var/www/radiant-nexus/backend/.env
```

Your `.env` should look like:

```env
PORT=3000
NODE_ENV=production
JWT_SECRET=<paste the 128-char hex string from the command above>
ALLOWED_ORIGINS=https://radiantinnovatech.com,https://www.radiantinnovatech.com
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-account@email.com
SMTP_PASS=xsmtp-xxxxxxxxxxxxxxxxxxxxxxxx
SMTP_FROM=waitlist@radiantinnovatech.com
```

```bash
# Lock down the file so only the service user can read it
sudo chown radiant:radiant /var/www/radiant-nexus/backend/.env
sudo chmod 640 /var/www/radiant-nexus/backend/.env
```

---

## Step 6 — Start the backend service

```bash
sudo systemctl start radiant-nexus
sudo systemctl status radiant-nexus
```

You should see `active (running)`. Test the health endpoint:

```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{"success":true,"status":"healthy","uptime":3.2,"entries":0,"env":"production"}
```

---

## Step 7 — Install SSL with Certbot

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d radiantinnovatech.com -d www.radiantinnovatech.com
```

Certbot will automatically modify the Nginx config to add HTTPS and set up auto-renewal.

---

## Step 8 — Verify the full flow

1. Open `https://radiantinnovatech.com/waitlist` in a browser
2. Fill out the form and submit
3. The applicant should receive a confirmation email within 1–2 minutes
4. Check `samuelmaclar@radiantinnovatech.com`, `info@radiantinnovatech.com`, and `christiandwamena@radiantinnovatech.com` for the team notification
5. Open `https://radiantinnovatech.com/admin/`
6. Enter `samuelmaclar@radiantinnovatech.com` → receive OTP → log in → see the entry

---

## Useful commands

```bash
# View live logs
sudo journalctl -u radiant-nexus -f

# Restart after code changes
sudo systemctl restart radiant-nexus

# Check Nginx status
sudo systemctl status nginx
sudo nginx -t  # test config syntax

# Reload Nginx (after config changes, without downtime)
sudo systemctl reload nginx

# Run integration tests (with server already running)
node /var/www/radiant-nexus/test-backend.js

# Backup the database
cp /var/www/radiant-nexus/backend/data/waitlist.db ~/waitlist-backup-$(date +%Y%m%d).db
```

---

## Admin Dashboard

The admin panel at `/admin/` connects to:
- `POST /api/admin/auth/request-otp` — sends OTP to `@radiantinnovatech.com` email
- `POST /api/admin/auth/verify-otp`  — verifies OTP, returns JWT
- `GET  /api/admin/waitlist`         — paginated + searchable waitlist (JWT required)
- `DELETE /api/admin/waitlist/:id`   — delete entry (JWT required)
- `GET  /api/admin/waitlist/export`  — download CSV (JWT required)
- `GET  /api/admin/logs`             — audit log (JWT required)

JWT tokens expire after 24 hours.

---

## Database location

```
/var/www/radiant-nexus/backend/data/waitlist.db
```

You can inspect it with any SQLite client:

```bash
sqlite3 /var/www/radiant-nexus/backend/data/waitlist.db
.tables
SELECT COUNT(*) FROM waitlist_entries;
SELECT full_name, email, company, created_at FROM waitlist_entries ORDER BY created_at DESC LIMIT 10;
.quit
```

---

## Upgrading

```bash
# Pull latest code
cd /tmp && git clone https://github.com/RadiantSeraph1/Radiant-Nexus.git radiant-update

# Update backend files (preserves .env and data/)
sudo rsync -av --exclude='.env' --exclude='data/' \
  /tmp/radiant-update/backend/ \
  /var/www/radiant-nexus/backend/

# Reinstall dependencies
cd /var/www/radiant-nexus/backend && sudo -u radiant npm install --omit=dev

# Restart service
sudo systemctl restart radiant-nexus
```

---

## Support

- Email: support@radiantinnovatech.com
- GitHub: https://github.com/RadiantSeraph1/Radiant-Nexus

---

*Radiant InnovaTech — Version 2.0.0 — 2026*