const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');
const { sanitize, sanitizeJson } = require('../lib/sanitize');

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const hits = db.prepare(
    'SELECT * FROM hits ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);

  const safeHits = hits.map(h => ({
    id: h.id,
    created_at: h.created_at,
    ip: sanitize(h.ip),
    user_agent: sanitize(h.user_agent),
    origin_url: sanitize(h.origin_url),
    referer: sanitize(h.referer),
    cookies: h.cookies,
    local_storage: h.local_storage,
    dom: h.dom,
  }));

  const { total } = db.prepare('SELECT COUNT(*) as total FROM hits').get();
  const totalPages = Math.ceil(total / limit);

  res.render('dashboard', {
    hits: safeHits,
    page,
    totalPages,
    total,
  });
});

// GET /dashboard/hit/:id
router.get('/hit/:id', requireAuth, (req, res) => {
  const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(req.params.id);
  if (!hit) return res.status(404).send('Hit not found');

  const safeHit = {
    id: hit.id,
    created_at: hit.created_at,
    ip: sanitize(hit.ip),
    user_agent: sanitize(hit.user_agent),
    origin_url: sanitize(hit.origin_url),
    referer: sanitize(hit.referer),
    cookies: sanitizeJson(hit.cookies),
    local_storage: sanitizeJson(hit.local_storage),
    session_storage: sanitizeJson(hit.session_storage),
    dom: sanitize(hit.dom),
    screenshot: hit.screenshot,
    extra: sanitizeJson(hit.extra),
  };

  res.render('hit-detail', { hit: safeHit });
});

// DELETE /dashboard/hit/:id
router.post('/hit/:id/delete', requireAuth, (req, res) => {
  db.prepare('DELETE FROM hits WHERE id = ?').run(req.params.id);
  res.redirect('/dashboard');
});

// DELETE all hits
router.post('/clear', requireAuth, (req, res) => {
  db.prepare('DELETE FROM hits').run();
  res.redirect('/dashboard');
});

module.exports = router;
