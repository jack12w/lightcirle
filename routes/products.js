// lightcirle — Products CRUD Routes
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');
const { exportProducts } = require('../db/export');

const router = express.Router();

// Keep in sync with server.js slugify (60-char cap) to avoid 301 loops
function slugify(text) {
  return String(text).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').replace(/^(.{60})(?:-[^-]*|[^-\s])*$/, '$1').replace(/-$/, '');
}
// Generate a clean short id; never use the full title as id (prevents URL duplication)
function genProductId(data, db) {
  const proposed = String(data.id || '').trim();
  const titleSlug = slugify(data.name || '');
  const clean = /^[a-z0-9][a-z0-9-]{0,39}$/.test(proposed) && proposed !== titleSlug;
  if (clean && !db.prepare('SELECT 1 FROM products WHERE id = ?').get(proposed)) {
    return proposed;
  }
  let id;
  do { id = 'p-' + Math.random().toString(36).slice(2, 8); } while (db.prepare('SELECT 1 FROM products WHERE id = ?').get(id));
  return id;
}

// GET /api/products
router.get('/', (req, res) => {
  const db = getDb();
  const products = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC').all();

  const result = products.map(p => ({
    id: p.id,
    name: p.name,
    category: p.category,
    moq: p.moq,
    fabric: p.fabric,
    features: JSON.parse(p.features || '[]'),
    weight: p.weight,
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
    description: p.description,
    customization: JSON.parse(p.customization || '[]'),
    images: JSON.parse(p.images || '[]'),
    video: p.video || '',
    leadTime: p.lead_time,
    certifications: JSON.parse(p.certifications || '[]'),
    createdAt: p.created_at,
    updatedAt: p.updated_at,
  }));

  res.json(result);
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const p = db.prepare('SELECT * FROM products WHERE id = ?').get(req.params.id);
  if (!p) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Product not found' });

  res.json({
    id: p.id,
    name: p.name,
    category: p.category,
    moq: p.moq,
    fabric: p.fabric,
    features: JSON.parse(p.features || '[]'),
    weight: p.weight,
    sizes: JSON.parse(p.sizes || '[]'),
    colors: JSON.parse(p.colors || '[]'),
    description: p.description,
    customization: JSON.parse(p.customization || '[]'),
    images: JSON.parse(p.images || '[]'),
    video: p.video || '',
    leadTime: p.lead_time,
    certifications: JSON.parse(p.certifications || '[]'),
  });
});

// POST /api/products (auth required)
router.post('/', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body;

  if (!data.name) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Name is required' });
  }

  const id = genProductId(data, db);

  db.prepare(`
    INSERT INTO products (id, name, category, moq, fabric, features, weight, sizes, colors, description, customization, images, video, lead_time, certifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.name, data.category || 'yoga-pants', data.moq || 50, data.fabric || '',
    JSON.stringify(data.features || []), data.weight || '',
    JSON.stringify(data.sizes || []), JSON.stringify(data.colors || []),
    data.description || '', JSON.stringify(data.customization || []),
    JSON.stringify(data.images || []), data.video || '', data.leadTime || '15-25 days',
    JSON.stringify(data.certifications || [])
  );

  exportProducts();
  res.status(201).json({ id, message: 'Product created' });
});

// PUT /api/products/:id (auth required)
router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body;
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Product not found' });

  db.prepare(`
    UPDATE products SET name=?, category=?, moq=?, fabric=?, features=?, weight=?, sizes=?, colors=?, description=?, customization=?, images=?, video=?, lead_time=?, certifications=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    data.name, data.category, data.moq, data.fabric,
    JSON.stringify(data.features || []), data.weight,
    JSON.stringify(data.sizes || []), JSON.stringify(data.colors || []),
    data.description, JSON.stringify(data.customization || []),
    JSON.stringify(data.images || []), data.video || '',
    data.leadTime || '15-25 days',
    JSON.stringify(data.certifications || []),
    req.params.id
  );

  exportProducts();
  res.json({ message: 'Product updated' });
});

// DELETE /api/products/:id (auth required)
router.delete('/:id', authenticate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM products WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Product not found' });

  db.prepare('DELETE FROM products WHERE id = ?').run(req.params.id);
  exportProducts();
  res.json({ message: 'Product deleted' });
});

module.exports = router;
