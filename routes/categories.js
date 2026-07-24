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
    rows = db.prepare('SELECT * FROM categories WHERE type = ? ORDER BY (CASE WHEN parent_id IS NULL OR parent_id = \'\' THEN 0 ELSE 1 END), sort_order ASC').all(type);
  } else {
    rows = db.prepare('SELECT * FROM categories ORDER BY (CASE WHEN parent_id IS NULL OR parent_id = \'\' THEN 0 ELSE 1 END), sort_order ASC').all();
  }
  res.json(rows);
});

// Validate a requested parent_id. Returns an error string, or null if valid.
// Convention (方案C): only two levels allowed — a parent must be a top-level
// category (its own parent_id is empty). Self-reference is rejected.
function validateParent(db, parentId, type, selfId) {
  if (!parentId) return null; // empty = top-level, always allowed
  const parent = db.prepare('SELECT * FROM categories WHERE id = ?').get(parentId);
  if (!parent) return '父分类不存在';
  if (parent.type !== type) return '父分类必须与当前分类类型一致（product/article）';
  if (parent.parent_id && parent.parent_id !== '') return '不支持超过两级分类：所选父分类本身已是子分类';
  if (selfId && parentId === selfId) return '不能将分类设为自身的父级';
  return null;
}

// POST /api/categories (auth required)
router.post('/', authenticate, (req, res) => {
  const db = getDb();
  const { id, name, type, image, parent_id } = req.body;
  if (!id || !name) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID and name are required' });
  }

  const existing = db.prepare('SELECT id FROM categories WHERE id = ?').get(id);
  if (existing) {
    return res.status(409).json({ title: 'Conflict', status: 409, detail: 'Category ID already exists' });
  }

  const catType = type || 'product';
  const parentErr = validateParent(db, parent_id || '', catType, null);
  if (parentErr) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: parentErr });
  }

  const maxOrder = db.prepare('SELECT MAX(sort_order) as m FROM categories').get();
  db.prepare('INSERT INTO categories (id, name, type, sort_order, image, parent_id) VALUES (?, ?, ?, ?, ?, ?)').run(id, name, catType, (maxOrder.m || 0) + 1, image || '', parent_id || '');
  res.status(201).json({ id, message: '分类已创建' });
});

// Fallback PUT for IDs with special characters (e.g. 'Sports Skirts/Dresses')
// Usage: PUT /api/categories/update?id=Sports%20Skirts%2FDresses
// MUST be defined before /:id so it takes priority
router.put('/update', authenticate, (req, res) => {
  const db = getDb();
  const { name, image, parent_id } = req.body;
  const id = req.query.id;
  if (!name) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Name is required' });
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID query parameter is required' });

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  const catType = existing.type;
  const parentErr = validateParent(db, parent_id || '', catType, id);
  if (parentErr) return res.status(422).json({ title: 'Validation Error', status: 422, detail: parentErr });

  // A category that already has children cannot be moved under a parent (would orphan them)
  if (parent_id && parent_id !== '') {
    const childCount = db.prepare('SELECT COUNT(*) as c FROM categories WHERE parent_id = ?').get(id);
    if (childCount.c > 0) return res.status(409).json({ title: 'Conflict', status: 409, detail: '该分类下已有子分类，不能设为子分类（请先调整其子分类）' });
  }

  db.prepare('UPDATE categories SET name = ?, image = ?, parent_id = ? WHERE id = ?').run(name, image || '', parent_id || '', id);
  res.json({ message: '分类已更新' });
});

// PUT /api/categories/:id (auth required)
router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const { name, image, parent_id } = req.body;
  if (!name) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Name is required' });

  const id = req.params.id || req.query.id;
  if (!id) return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'ID is required' });

  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Category not found: ' + id });

  const catType = existing.type;
  const parentErr = validateParent(db, parent_id || '', catType, id);
  if (parentErr) return res.status(422).json({ title: 'Validation Error', status: 422, detail: parentErr });

  if (parent_id && parent_id !== '') {
    const childCount = db.prepare('SELECT COUNT(*) as c FROM categories WHERE parent_id = ?').get(id);
    if (childCount.c > 0) return res.status(409).json({ title: 'Conflict', status: 409, detail: '该分类下已有子分类，不能设为子分类（请先调整其子分类）' });
  }

  db.prepare('UPDATE categories SET name = ?, image = ?, parent_id = ? WHERE id = ?').run(name, image || '', parent_id || '', id);
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

  // Promote any child categories to top-level so no product/article is orphaned
  db.prepare("UPDATE categories SET parent_id = '' WHERE parent_id = ?").run(id);
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

  // Promote any child categories to top-level so no product/article is orphaned
  db.prepare("UPDATE categories SET parent_id = '' WHERE parent_id = ?").run(id);
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  res.json({ message: '分类已删除' });
});

module.exports = router;
