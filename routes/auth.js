const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

// GET /login
router.get('/login', (req, res) => {
  if (req.session?.authenticated) return res.redirect('/dashboard');
  res.render('login', { error: null });
});

// POST /login
router.post('/login', async (req, res) => {
  const { password } = req.body;

  if (!password) {
    return res.render('login', { error: 'Password required' });
  }

  try {
    const hash = process.env.DASHBOARD_PASSWORD_HASH;
    if (!hash) {
      return res.render('login', { error: 'Server misconfigured — no password hash set' });
    }

    const match = await bcrypt.compare(password, hash);

    if (match) {
      req.session.authenticated = true;
      req.session.loginTime = Date.now();
      return res.redirect('/dashboard');
    } else {
      // Artificial delay to slow brute force even with rate limiting
      await new Promise(r => setTimeout(r, 1000));
      return res.render('login', { error: 'Invalid password' });
    }
  } catch (err) {
    console.error('[Auth] Login error:', err.message);
    return res.render('login', { error: 'Internal error' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.redirect('/login');
  });
});

module.exports = router;
