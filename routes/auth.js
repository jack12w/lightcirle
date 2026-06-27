// lightcirle — Auth Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { getDb } = require('../db/schema');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'lightcirle-admin-secret-2026';
const TOKEN_EXPIRY = '24h';

// POST /api/auth/login
router.post('/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Username and password required' });
  }

  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username);
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    return res.status(401).json({ title: 'Auth Error', status: 401, detail: 'Invalid credentials' });
  }

  const token = jwt.sign({ userId: user.id, username: user.username }, JWT_SECRET, { expiresIn: TOKEN_EXPIRY });
  res.json({ token, user: { id: user.id, username: user.username } });
});

// GET /api/auth/verify — verify token
router.get('/verify', (req, res) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ valid: false });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], JWT_SECRET);
    res.json({ valid: true, user: { id: decoded.userId, username: decoded.username } });
  } catch(e) {
    res.status(401).json({ valid: false, detail: 'Token expired or invalid' });
  }
});

module.exports = router;
