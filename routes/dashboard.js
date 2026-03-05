const express = require('express');
const router = express.Router();
const db = require('../db');
const { requireAuth } = require('../middleware/auth');

// GET /dashboard
router.get('/', requireAuth, (req, res) => {
  const page = Math.max(1, parseInt(req.query.page) || 1);
  const limit = 20;
  const offset = (page - 1) * limit;

  const hits = db.prepare(
    'SELECT * FROM hits ORDER BY created_at DESC LIMIT ? OFFSET ?'
  ).all(limit, offset);

  const { total } = db.prepare('SELECT COUNT(*) as total FROM hits').get();
  const totalPages = Math.ceil(total / limit);

  res.render('dashboard', {
    hits,
    page,
    totalPages,
    total,
  });
});

// GET /dashboard/hit/:id - full details for one hit
router.get('/hit/:id', requireAuth, (req, res) => {
  const hit = db.prepare('SELECT * FROM hits WHERE id = ?').get(req.params.id);
  if (!hit) return res.status(404).send('Hit not found');
  res.render('hit-detail', { hit });
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
