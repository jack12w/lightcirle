// lightcirle — Categories CRUD Routes
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');

const router = express.Router();

// GET /api/categories
router.get('/', (req, res) => {
  const db = getDb();
  const type = req.query.type; // optional filter: 'product' or 'article'
  let rows;
  if (type) {
    rows = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY sort_order ASC').all(type);
  } else {
    rows = db.prepare('SELECT * FROM categories ORDER BY sort_order ASC').all();
  }
  res.json(rows);
});

// POST /api/categories (auth required)
router.post('/', authenticate, (req, res) => {
  const db = getDb();
  const { id, name, type, image } = req.body;
  if (!id || !name) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID and name are required' });
  }

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (existing) {
    return res.status(409).json({ title: 'Conflict', status: 409, detail: 'Category ID already exists' });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories').get();
  db.prepare('INSERT INTO categories (id, name, type, sort_order, image) VALUES (?, ?, ?, ?, ?)').run(id, name, type || 'product', (maxOrder.m || 0) + 1, image || '');
  res.status(201).json({ id, message: '分类已创建' });
});

// Fallback PUT for IDs with special characters (e.g. 'Sports Skirts/Dresses')
// Usage: PUT /api/categories/update?id=Sports%20Skirts%2FDresses
// MUST be defined before /:id so it takes priority
router.put('/update', authenticate, (req, res) => {
  const db = getDb();
  const { name, image } = req.body;
  const id = req.query.id;
  if (!name) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Name is required' });
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID query parameter is required' });

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  db.prepare('UPDATE categories SET name = ?, image = ? WHERE id = ?').run(name, image || '', id);
  res.json({ message: '分类已更新' });
});

// PUT /api/categories/:id (auth required)
router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const { name, image } = req.body;
  if (!name) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Name is required' });

  const id = req.params.id || req.query.id;
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID is required' });

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  db.prepare('UPDATE categories SET name = ?, image = ? WHERE id = ?').run(name, image || '', id);
  res.json({ message: '分类已更新' });
});

// Fallback DELETE for IDs with special characters
// Usage: DELETE /api/categories/remove?id=Sports%20Skirts%2FDresses
// MUST be defined before /:id so it takes priority
router.delete('/remove', authenticate, (req, res) => {
  const db = getDb();
  const id = req.query.id;
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID query parameter is required' });

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '分类已删除' });
});

// DELETE /api/categories/:id (auth required)
router.delete('/:id', authenticate, (req, res) => {
  const db = getDb();

  // Support both path param and query param (?id=...)
  const id = req.params.id || req.query.id;
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID is required' });

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '分类已删除' });
});

module.exports = router;
