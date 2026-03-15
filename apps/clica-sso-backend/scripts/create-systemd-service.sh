#!/bin/bash

# Generate systemd service file safely
cat > clica-sso.service << 'SYSTEMD_CONTENT'
[Unit]
Description=Clica SSO Backend API
Documentation=https://github.com/rssarti/clica-sso-backend
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/clica-sso-backend/current
ExecStart=/usr/bin/node dist/main.js
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=clica-sso
Environment=NODE_ENV=production
Environment=PORT=3000

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/var/www/clica-sso-backend
ReadWritePaths=/tmp

[Install]
WantedBy=multi-user.target
SYSTEMD_CONTENT

echo "✅ Systemd service file created successfully"
ls -la clica-sso.service

# Validate the service file
echo "🔍 Validating systemd service file content..."
if grep -q "ExecStart=" clica-sso.service; then
    echo "✅ ExecStart found in service file"
    grep "ExecStart=" clica-sso.service
else
    echo "❌ ERROR: ExecStart NOT found in service file!"
    echo "📄 Service file content:"
    cat clica-sso.service
    exit 1
fi

echo "📋 Complete service file content:"
cat clica-sso.service
