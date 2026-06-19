#!/usr/bin/env bash
# =============================================================================
#  Radiant Nexus Backend — Ubuntu / AWS Lightsail Setup Script
#  Run this ONCE on a fresh Ubuntu 22.04 LTS instance as a non-root user
#  with sudo privileges (e.g. the default "ubuntu" user on Lightsail).
#
#  Usage:
#    chmod +x setup.sh
#    sudo ./setup.sh
# =============================================================================
set -euo pipefail

# ── Configuration (edit these before running) ─────────────────────────────────
APP_USER="radiant"                        # non-root user that will run the app
APP_DIR="/var/www/radiant-nexus/backend"  # where the backend code lives
DOMAIN="radiantinnovatech.com"            # your domain (for Nginx & Certbot)
NODE_VERSION="20"                         # Node.js LTS major version

# ─────────────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  Radiant Nexus Backend — Lightsail Setup"
echo "  Domain: $DOMAIN"
echo "  App dir: $APP_DIR"
echo "======================================================"
echo ""

# ── 1. System updates ─────────────────────────────────────────────────────────
echo "[1/8] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Node.js 20 LTS via NodeSource ──────────────────────────────────────────
echo "[2/8] Installing Node.js ${NODE_VERSION} LTS..."
if ! command -v node &>/dev/null || [[ "$(node -e 'process.stdout.write(process.version.split(".")[0].slice(1))')" != "$NODE_VERSION" ]]; then
  curl -fsSL "https://deb.nodesource.com/setup_${NODE_VERSION}.x" | bash -
  apt-get install -y nodejs
fi
echo "  Node.js: $(node --version)  npm: $(npm --version)"

# ── 3. Nginx ──────────────────────────────────────────────────────────────────
echo "[3/8] Installing Nginx..."
apt-get install -y nginx
systemctl enable nginx

# ── 4. Create app user ────────────────────────────────────────────────────────
echo "[4/8] Setting up app user: $APP_USER..."
if ! id "$APP_USER" &>/dev/null; then
  useradd --system --shell /bin/false --create-home --home-dir "/home/$APP_USER" "$APP_USER"
  echo "  Created user $APP_USER"
else
  echo "  User $APP_USER already exists — skipping"
fi

# ── 5. Create app directory & set ownership ───────────────────────────────────
echo "[5/8] Creating application directory at $APP_DIR..."
mkdir -p "$APP_DIR/data"
mkdir -p "$APP_DIR/deploy"

# If you're deploying via git clone, do it here:
# git clone https://github.com/RadiantSeraph1/Radiant-Nexus.git /tmp/radiant-repo
# cp -r /tmp/radiant-repo/backend/* "$APP_DIR/"

chown -R "$APP_USER":"$APP_USER" "$(dirname "$APP_DIR")"
echo "  Ownership set to $APP_USER"

# ── 6. Install npm dependencies ───────────────────────────────────────────────
echo "[6/8] Installing Node.js dependencies..."
if [ -f "$APP_DIR/package.json" ]; then
  cd "$APP_DIR"
  sudo -u "$APP_USER" npm install --omit=dev
  echo "  Dependencies installed"
else
  echo "  WARNING: No package.json found at $APP_DIR — copy your backend files first, then re-run."
fi

# ── 7. Install & enable systemd service ──────────────────────────────────────
echo "[7/8] Installing systemd service..."
cat > /etc/systemd/system/radiant-nexus.service <<EOF
[Unit]
Description=Radiant Nexus Backend API
Documentation=https://radiantinnovatech.com
After=network.target

[Service]
Type=simple
User=${APP_USER}
WorkingDirectory=${APP_DIR}
EnvironmentFile=${APP_DIR}/.env
ExecStart=/usr/bin/node ${APP_DIR}/server.js
Restart=always
RestartSec=5
StandardOutput=journal
StandardError=journal
SyslogIdentifier=radiant-nexus

# Security hardening
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ReadWritePaths=${APP_DIR}/data

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable radiant-nexus
echo "  Service installed and enabled (start it after placing .env)"

# ── 8. Configure Nginx ────────────────────────────────────────────────────────
echo "[8/8] Configuring Nginx reverse proxy..."
cat > /etc/nginx/sites-available/radiant-nexus <<EOF
# Radiant Nexus — Nginx configuration
# Proxies API calls to the Node.js backend
# Static files (HTML/CSS/JS) are served directly by Nginx
# Run: sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN  (after DNS is pointed here)

server {
    listen 80;
    server_name $DOMAIN www.$DOMAIN;

    # Static website root
    root /var/www/radiant-nexus/public;
    index index.html;

    # ── API → Node.js backend ────────────────────────────────
    location /api/ {
        proxy_pass         http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header   Upgrade \$http_upgrade;
        proxy_set_header   Connection 'upgrade';
        proxy_set_header   Host \$host;
        proxy_set_header   X-Real-IP \$remote_addr;
        proxy_set_header   X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header   X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;

        # Timeouts
        proxy_connect_timeout 10s;
        proxy_send_timeout    30s;
        proxy_read_timeout    30s;

        # Rate limit headers passthrough
        add_header X-RateLimit-Limit \$upstream_http_x_ratelimit_limit always;
    }

    # ── Static pages ──────────────────────────────────────────
    location / {
        try_files \$uri \$uri/ \$uri.html =404;
    }

    # ── Security headers ──────────────────────────────────────
    add_header X-Content-Type-Options  "nosniff"         always;
    add_header X-Frame-Options         "DENY"            always;
    add_header X-XSS-Protection        "1; mode=block"   always;
    add_header Referrer-Policy         "strict-origin-when-cross-origin" always;

    # ── Gzip ──────────────────────────────────────────────────
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json image/svg+xml;

    # ── Cache static assets ───────────────────────────────────
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff2?)$ {
        expires 30d;
        add_header Cache-Control "public, no-transform";
    }

    # ── Block .env and hidden files ───────────────────────────
    location ~ /\. {
        deny all;
        return 404;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/radiant-nexus /etc/nginx/sites-enabled/radiant-nexus
rm -f /etc/nginx/sites-enabled/default

# Test config
if nginx -t; then
  systemctl reload nginx
  echo "  Nginx configured and reloaded"
else
  echo "  ERROR: Nginx config test failed — check /etc/nginx/sites-available/radiant-nexus"
fi

# ── Done ──────────────────────────────────────────────────────────────────────
echo ""
echo "======================================================"
echo "  Setup complete!"
echo "======================================================"
echo ""
echo "  Next steps:"
echo "  1. Copy your website files to: /var/www/radiant-nexus/public/"
echo "  2. Copy backend files to:      $APP_DIR"
echo "  3. Copy & fill in .env:        cp $APP_DIR/.env.example $APP_DIR/.env"
echo "  4. Generate JWT_SECRET:        node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
echo "  5. Install npm deps:           cd $APP_DIR && sudo -u $APP_USER npm install --omit=dev"
echo "  6. Start the backend:          sudo systemctl start radiant-nexus"
echo "  7. Check status:               sudo systemctl status radiant-nexus"
echo "  8. View logs:                  sudo journalctl -u radiant-nexus -f"
echo "  9. Install SSL (Certbot):      sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN"
echo ""
echo "  Lightsail firewall: open ports 80 and 443 in the Lightsail console."
echo ""
