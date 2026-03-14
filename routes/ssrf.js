const express = require('express');
const router = express.Router();
const db = require('../db');
const { sendSsrfAlert } = require('../lib/telegram');

// GET /ssrf/:id  — OOB callback, logs the hit
// Usage: inject https://yourserver.com/ssrf/UNIQUE_ID as a URL parameter in targets
router.get('/:id', (req, res) => {
  // Respond immediately with a 1x1 transparent gif so image-based probes also work
  const GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).send(GIF);

  // Log async so response is already sent
  try {
    const probeId = req.params.id || 'unknown';
    const ip =
      req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
      req.socket.remoteAddress ||
      'unknown';

    const stmt = db.prepare(`
      INSERT INTO ssrf_hits (probe_id, ip, user_agent, referer, host_header, all_headers)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    const result = stmt.run(
      probeId,
      ip,
      req.headers['user-agent'] || null,
      req.headers['referer'] || null,
      req.headers['host'] || null,
      JSON.stringify(req.headers)
    );

    const hit = db.prepare('SELECT * FROM ssrf_hits WHERE id = ?').get(result.lastInsertRowid);
    console.log(`[SSRF] #${hit.id} probe="${probeId}" from ${ip}`);
    sendSsrfAlert(hit).catch(console.error);

  } catch (err) {
    console.error('[SSRF] Error:', err.message);
  }
});

module.exports = router;
