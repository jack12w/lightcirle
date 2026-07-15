// lightcirle — Custom Quote Request Routes
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');

const router = express.Router();
const { notifySales } = require('../utils/mailer');

// Allowed lead statuses
const STATUSES = ['new', 'contacted', 'quoted', 'won', 'lost'];

// --- Public: submit a quote request (no auth) ---
// POST /api/quotes
router.post('/', (req, res) => {
  const db = getDb();
  const d = req.body || {};

  // Required field validation (mirrors the front-end wizard)
  const required = ['name', 'company', 'email', 'whatsapp', 'category', 'qty'];
  const missing = required.filter(f => !String(d[f] || '').trim());
  if (missing.length) {
    return res.status(422).json({
      title: 'Validation Error',
      status: 422,
      detail: 'Missing required fields: ' + missing.join(', '),
    });
  }

  // Basic email sanity check
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(d.email).trim())) {
    return res.status(422).json({
      title: 'Validation Error',
      status: 422,
      detail: 'Invalid email format',
    });
  }

  const customization = Array.isArray(d.customization) ? d.customization : [];
  const status = STATUSES.includes(d.status) ? d.status : 'new';

  try {
    const info = db.prepare(`
      INSERT INTO quote_requests
        (name, company, email, whatsapp, category, qty, color, color_hex, fabric, customization, delivery, budget, notes, status)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      String(d.name).trim(),
      String(d.company).trim(),
      String(d.email).trim(),
      String(d.whatsapp).trim(),
      String(d.category).trim(),
      String(d.qty).trim(),
      String(d.color || '').trim(),
      String(d.colorHex || '').trim(),
      String(d.fabric || '').trim(),
      JSON.stringify(customization),
      String(d.delivery || '').trim(),
      String(d.budget || '').trim(),
      String(d.notes || '').trim(),
      status
    );

    const id = info.lastInsertRowid;
    const saved = {
      id,
      name: String(d.name).trim(),
      company: String(d.company).trim(),
      email: String(d.email).trim(),
      whatsapp: String(d.whatsapp).trim(),
      category: String(d.category).trim(),
      qty: String(d.qty).trim(),
      color: String(d.color || '').trim(),
      colorHex: String(d.colorHex || '').trim(),
      fabric: String(d.fabric || '').trim(),
      customization,
      delivery: String(d.delivery || '').trim(),
      budget: String(d.budget || '').trim(),
      notes: String(d.notes || '').trim(),
    };
    // Fire-and-forget sales notification. Never blocks the response and never
    // affects the submission result even if mail is unconfigured or fails.
    notifySales(saved).catch((e) => console.error('[mailer] notify error:', e.message));

    res.status(201).json({ id, message: 'Quote request submitted' });
  } catch (e) {
    console.error('quote insert error:', e.message);
    res.status(500).json({ title: 'Server Error', status: 500, detail: e.message });
  }
});

// --- Admin: list quote requests ---
// GET /api/quotes?status=new
router.get('/', authenticate, (req, res) => {
  const db = getDb();
  let rows;
  const status = req.query.status;
  if (status && STATUSES.includes(status)) {
    rows = db.prepare('SELECT * FROM quote_requests WHERE status = ? ORDER BY created_at DESC').all(status);
  } else {
    rows = db.prepare('SELECT * FROM quote_requests ORDER BY created_at DESC').all();
  }
  const result = rows.map(r => ({
    id: r.id,
    name: r.name,
    company: r.company,
    email: r.email,
    whatsapp: r.whatsapp,
    category: r.category,
    qty: r.qty,
    color: r.color,
    colorHex: r.color_hex,
    fabric: r.fabric,
    customization: JSON.parse(r.customization || '[]'),
    delivery: r.delivery,
    budget: r.budget,
    notes: r.notes,
    status: r.status,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  }));
  res.json(result);
});

// --- Admin: update status ---
// PATCH /api/quotes/:id  { status: 'quoted' }
router.patch('/:id', authenticate, (req, res) => {
  const db = getDb();
  const id = parseInt(req.params.id, 10);
  if (!Number.isInteger(id)) {
    return res.status(400).json({ title: 'Bad Request', status: 400, detail: 'Invalid id' });
  }
  const existing = db.prepare('SELECT id FROM quote_requests WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Quote request not found' });
  }
  const status = req.body && req.body.status;
  if (!STATUSES.includes(status)) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Invalid status' });
  }
  db.prepare("UPDATE quote_requests SET status = ?, updated_at = datetime('now') WHERE id = ?").run(status, id);
  res.json({ id, status, message: 'Status updated' });
});

module.exports = router;
