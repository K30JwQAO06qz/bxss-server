const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  message: 'Too many login attempts'
});

router.get('/login', (req, res) => {
  if (req.session && req.session.authenticated) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

router.post('/login', loginLimiter, async (req, res) => {
  const { password } = req.body;
  if (!password) return res.render('login', { error: 'Password required' });
  try {
    const hash = process.env.DASHBOARD_PASSWORD_HASH;
    if (!hash) return res.render('login', { error: 'Server misconfiguration' });
    const match = await bcrypt.compare(password, hash);
    if (match) {
      req.session.authenticated = true;
      return res.redirect('/dashboard');
    } else {
      return res.render('login', { error: 'Invalid password' });
    }
  } catch (err) {
    console.error('[Auth] Error:', err.message);
    return res.render('login', { error: 'Server error' });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(() => res.redirect('/login'));
});

module.exports = router;
