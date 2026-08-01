// Newsletter subscribe API
const express = require('express');
const router = express.Router();
const { getDb } = require('../db/schema');

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// POST /api/subscribe  — store a newsletter subscriber
router.post('/', (req, res) => {
  try {
    const email = (req.body && req.body.email ? String(req.body.email) : '').trim().toLowerCase();
    if (!email || !EMAIL_RE.test(email)) {
      return res.status(400).json({ error: 'Please enter a valid email address.' });
    }
    const source = (req.body && req.body.source ? String(req.body.source) : 'homepage').slice(0, 40);
    const d = getDb();
    const existing = d.prepare('SELECT id FROM subscribers WHERE email = ?').get(email);
    if (existing) {
      return res.json({ success: true, alreadySubscribed: true });
    }
    d.prepare('INSERT INTO subscribers (email, source) VALUES (?, ?)').run(email, source);
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/subscribe — list subscribers (admin use; auth handled by caller middleware if mounted)
router.get('/', (req, res) => {
  try {
    const d = getDb();
    const rows = d.prepare('SELECT id, email, source, created_at FROM subscribers ORDER BY id DESC').all();
    res.json(rows);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

module.exports = router;
