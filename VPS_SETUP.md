# Hosting on Contabo VPS (Ubuntu 22.04 / 24.04)

This guide guarantees a **100% working deployment** of your IPTV Stream Relay & Multi-Playlist Studio on your Contabo Ubuntu VPS.

---

## Method 1: 1-Click Automated Setup (Recommended)

1. **Connect to your Contabo VPS via SSH:**
   ```bash
   ssh root@YOUR_CONTABO_SERVER_IP
   ```

2. **Clone or transfer your project files to the VPS:**
   ```bash
   mkdir -p /var/www/iptv-relay
   cd /var/www/iptv-relay
   # Upload your files here via git clone, scp, or rsync
   ```

3. **Run the 1-Click deploy script:**
   ```bash
   chmod +x deploy.sh
   ./deploy.sh
   ```

`deploy.sh` will automatically:
- Install Node.js 22 LTS, build tools, and PM2.
- Open firewall port 3000 (`ufw allow 3000/tcp`).
- Install dependencies and build production assets.
- Start the server with PM2 and configure auto-restart on system reboot.

---

## Method 2: Docker / Docker Compose Setup

If you prefer Docker on your Contabo VPS:

1. **Install Docker & Docker Compose on Ubuntu:**
   ```bash
   sudo apt-get update
   sudo apt-get install -y docker.io docker-compose
   sudo systemctl enable --now docker
   ```

2. **Start the container in detached mode:**
   ```bash
   docker-compose up -d --build
   ```

3. **View logs or check container status:**
   ```bash
   docker-compose logs -f
   docker-compose ps
   ```

All channel customizations, groups, and playlist cache will be persistently saved in `./data` on your host VPS!

---

## Available IPTV Endpoints

Replace `YOUR_SERVER_IP` with your Contabo VPS Public IP (e.g. `194.163.xxx.xxx`):

### 1. Combined Playlist (All 3+ Playlists Merged into 1 Master List)
- **M3U Playlist URL (TiviMate & OTT Navigator):**
  ```
  http://YOUR_SERVER_IP:3000/api/playlist/all.m3u
  ```
- **JSON Endpoint:**
  ```
  http://YOUR_SERVER_IP:3000/api/playlist/all.json
  ```

---

### 2. Separate Individual Playlists

| Provider | Dedicated M3U URL | Dedicated JSON URL |
| :--- | :--- | :--- |
| **Plugx VIP Playlist** | `http://YOUR_SERVER_IP:3000/api/playlist/plugx.m3u` | `http://YOUR_SERVER_IP:3000/api/playlist/plugx.json` |
| **Vaathala & Hotstar Live** | `http://YOUR_SERVER_IP:3000/api/playlist/server-lrl45.m3u` | `http://YOUR_SERVER_IP:3000/api/playlist/server-lrl45.json` |
| **SunNXT & StreamX Live** | `http://YOUR_SERVER_IP:3000/api/playlist/zeotv.m3u` | `http://YOUR_SERVER_IP:3000/api/playlist/zeotv.json` |

---

## How to Configure in IPTV Players

### In OTT Navigator IPTV:
1. Open **OTT Navigator** on your Android TV, FireStick, or Mobile.
2. Go to **Settings** &gt; **Provider** &gt; **Add Provider** &gt; **Playlist**.
3. Choose **Enter URL** and paste your URL (e.g. `http://YOUR_SERVER_IP:3000/api/playlist/all.m3u`).
4. Set **Auto-reload playlist** to **Every 30 minutes** or **Every hour**.
5. Save. All channels with ClearKey DRM will play smoothly.

### In TiviMate IPTV:
1. Open **TiviMate**.
2. Go to **Settings** &gt; **Playlists** &gt; **Add Playlist** &gt; **M3U playlist**.
3. Enter URL: `http://YOUR_SERVER_IP:3000/api/playlist/all.m3u`.
4. Enable **Auto-update playlist on app start** and **Update playlist on interval (e.g. 1 hour)**.
5. Finish.

---

## Setting up Domain & Free SSL (Optional)

If you have a domain (e.g. `iptv.yourdomain.com`):

1. **Install Nginx & Certbot:**
   ```bash
   sudo apt-get install -y nginx certbot python3-certbot-nginx
   ```

2. **Copy the Nginx configuration:**
   ```bash
   sudo cp nginx.conf.example /etc/nginx/sites-available/iptv-relay
   sudo sed -i 's/YOUR_DOMAIN_OR_IP/iptv.yourdomain.com/g' /etc/nginx/sites-available/iptv-relay
   sudo ln -s /etc/nginx/sites-available/iptv-relay /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

3. **Get free Let's Encrypt SSL certificate:**
   ```bash
   sudo certbot --nginx -d iptv.yourdomain.com
   ```

Now your secure M3U URL will be:
```
https://iptv.yourdomain.com/api/playlist/all.m3u
```
