require('dotenv').config();
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const bcrypt = require('bcrypt');
const path = require('path');
const SQLiteStore = require('connect-sqlite3')(session);
const fs = require('fs');

// Ensure data dir exists
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

// ─── Bootstrap: hash the plain-text password on first run ───────────────────
async function ensurePasswordHash() {
  if (!process.env.DASHBOARD_PASSWORD_HASH) {
    if (!process.env.DASHBOARD_PASSWORD) {
      console.error('ERROR: Set DASHBOARD_PASSWORD in your .env file');
      process.exit(1);
    }
    const hash = await bcrypt.hash(process.env.DASHBOARD_PASSWORD, 12);
    // Write hash back into .env so next boot uses it directly
    const envPath = path.join(__dirname, '.env');
    let envContent = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
    if (envContent.includes('DASHBOARD_PASSWORD_HASH=')) {
      envContent = envContent.replace(/^DASHBOARD_PASSWORD_HASH=.*/m, `DASHBOARD_PASSWORD_HASH=${hash}`);
    } else {
      envContent += `\nDASHBOARD_PASSWORD_HASH=${hash}\n`;
    }
    fs.writeFileSync(envPath, envContent);
    process.env.DASHBOARD_PASSWORD_HASH = hash;
    console.log('[Boot] Password hashed and saved to .env');
  }
}

const app = express();
const PORT = process.env.PORT || 3000;

// ─── Security headers ────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"], // needed for EJS inline scripts
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:"],
      connectSrc: ["'self'"],
    },
  },
}));

// ─── Trust proxy (needed behind CloudPanel / nginx) ──────────────────────────
app.set('trust proxy', 1);

// ─── View engine ─────────────────────────────────────────────────────────────
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// ─── Body parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '2mb' }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));
app.use(express.text({ type: "text/plain", limit: "2mb" }));

// ─── Session ─────────────────────────────────────────────────────────────────
app.use(session({
  store: new SQLiteStore({ db: 'sessions.db', dir: dataDir }),
  secret: process.env.SESSION_SECRET || 'changeme-set-SESSION_SECRET-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production', // requires HTTPS in prod
    sameSite: 'strict',
    maxAge: 1000 * 60 * 60 * 8, // 8 hours
  },
  name: 'sid', // don't leak that we use express-session
}));

// ─── Rate limiting ─────────────────────────────────────────────────────────────
const callbackLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 min
  max: 60,
  standardHeaders: true,
  legacyHeaders: false,
});

// ─── Payload — served with SERVER_URL injected ───────────────────────────────
// Accessible as /t (primary), /x, /c, or /payload.js (all identical)
app.get(['/api/*', '/t', '/x', '/c', '/payload.js'], (req, res) => {
  const payloadPath = path.join(__dirname, 'public', 'payload.js');
  let src = fs.readFileSync(payloadPath, 'utf8');
  src = src.replace('{{SERVER_URL}}', process.env.SERVER_URL || `https://${req.hostname}`);
  res.setHeader('Content-Type', 'application/javascript');
  res.setHeader('Cache-Control', 'no-store');
  // Allow cross-origin loading (that's the whole point)
  res.setHeader('Cross-Origin-Resource-Policy', 'cross-origin');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.send(src);
});

// ─── Routes ──────────────────────────────────────────────────────────────────
app.use('/callback', callbackLimiter, require('./routes/callback'));
app.use('/ssrf', callbackLimiter, require('./routes/ssrf'));
app.use('/', require('./routes/auth'));
app.use('/dashboard',                 require('./routes/dashboard'));

// Root redirect
app.get('/', (req, res) => res.redirect('/dashboard'));

// 404
app.use((req, res) => res.status(404).send('Not found'));

// ─── Start ───────────────────────────────────────────────────────────────────
ensurePasswordHash().then(() => {
  app.listen(PORT, '127.0.0.1', () => {
    console.log(`[BXSS] Server running on port ${PORT}`);
    console.log(`[BXSS] Dashboard → ${process.env.SERVER_URL || 'http://localhost:' + PORT}/dashboard`);
    console.log(`[BXSS] Payload   → ${process.env.SERVER_URL || 'http://localhost:' + PORT}/payload.js`);
  });
});
