#!/usr/bin/env bash
set -e

# ============================================================
# IPTV Multi-Playlist Relay Studio - Contabo Ubuntu 1-Click Setup
# ============================================================

echo "=========================================================="
echo " Starting IPTV Multi-Playlist Relay Deployment on Ubuntu"
echo "=========================================================="

# 1. Update APT packages and install prerequisites
echo "[1/6] Updating system packages & installing prerequisites..."
sudo apt-get update -y
sudo apt-get install -y curl wget git build-essential ca-certificates ufw

# 2. Install Node.js 22 LTS if not already installed
if ! command -v node >/dev/null 2>&1 || [[ $(node -v | cut -d'.' -f1 | tr -d 'v') -lt 20 ]]; then
  echo "[2/6] Installing Node.js 22 LTS..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
  sudo apt-get install -y nodejs
else
  echo "[2/6] Node.js is already installed: $(node -v)"
fi

# 3. Install PM2 process manager globally
if ! command -v pm2 >/dev/null 2>&1; then
  echo "[3/6] Installing PM2 process manager globally..."
  sudo npm install -g pm2
fi

# 4. Install dependencies and build project
echo "[4/6] Installing project npm packages..."
npm install

echo "[5/6] Building production bundle..."
npm run build

# Ensure persistent data directory exists
mkdir -p data

# 5. Configure firewall (UFW) to allow port 3000
echo "[6/6] Configuring Firewall (allowing port 3000)..."
if command -v ufw >/dev/null 2>&1; then
  sudo ufw allow 3000/tcp || true
fi

# 6. Start or restart with PM2
echo "Starting application with PM2..."
pm2 delete iptv-relay 2>/dev/null || true
pm2 start ecosystem.config.cjs
pm2 save

# Setup PM2 to auto-start on system reboot
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u $USER --hp $HOME || true

echo "=========================================================="
echo " SUCCESS! IPTV Multi-Playlist Relay is running!"
echo "=========================================================="
VPS_IP=$(curl -s -4 ifconfig.me || curl -s -4 icanhazip.com || echo "YOUR-SERVER-IP")
echo " Web Dashboard:   http://${VPS_IP}:3000"
echo " Combined M3U:    http://${VPS_IP}:3000/api/playlist/all.m3u"
echo " Combined JSON:   http://${VPS_IP}:3000/api/playlist/all.json"
echo ""
echo " Separate Playlists:"
echo " - Plugx VIP:     http://${VPS_IP}:3000/api/playlist/plugx.m3u"
echo " - Vaathala:      http://${VPS_IP}:3000/api/playlist/server-lrl45.m3u"
echo " - SunNXT:        http://${VPS_IP}:3000/api/playlist/zeotv.m3u"
echo "=========================================================="
