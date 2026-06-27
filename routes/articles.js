// lightcirle — Articles CRUD Routes
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');

const router = express.Router();

// GET /api/articles
router.get('/', (req, res) => {
  const db = getDb();
  const articles = db.prepare('SELECT * FROM articles ORDER BY date DESC').all();

  const result = articles.map(a => ({
    id: a.id,
    title: a.title,
    date: a.date,
    author: a.author,
    category: a.category,
    tags: JSON.parse(a.tags || '[]'),
    image: a.image,
    excerpt: a.excerpt,
    content: a.content,
    createdAt: a.created_at,
    updatedAt: a.updated_at,
  }));

  res.json(result);
});

// GET /api/articles/:id
router.get('/:id', (req, res) => {
  const db = getDb();
  const a = db.prepare('SELECT * FROM articles WHERE id = ?').get(req.params.id);
  if (!a) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Article not found' });

  res.json({
    id: a.id,
    title: a.title,
    date: a.date,
    author: a.author,
    category: a.category,
    tags: JSON.parse(a.tags || '[]'),
    image: a.image,
    excerpt: a.excerpt,
    content: a.content,
  });
});

// POST /api/articles (auth required)
router.post('/', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body;

  if (!data.title || !data.content) {
    return res.status(422).json({ title: 'Validation Error', status: 422, detail: 'Title and content are required' });
  }

  const id = data.id || 'article-' + Date.now();

  db.prepare(`
    INSERT INTO articles (id, title, date, author, category, tags, image, excerpt, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    id, data.title, data.date || new Date().toISOString().split('T')[0],
    data.author || 'lightcirle Team', data.category || 'business-tips',
    JSON.stringify(data.tags || []), data.image || '',
    data.excerpt || data.content.substring(0, 200), data.content
  );

  res.status(201).json({ id, message: 'Article created' });
});

// PUT /api/articles/:id (auth required)
router.put('/:id', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body;
  const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Article not found' });

  db.prepare(`
    UPDATE articles SET title=?, date=?, author=?, category=?, tags=?, image=?, excerpt=?, content=?, updated_at=datetime('now')
    WHERE id=?
  `).run(
    data.title, data.date || existing.date, data.author || 'lightcirle Team',
    data.category || 'business-tips', JSON.stringify(data.tags || []),
    data.image || '', data.excerpt || (data.content || '').substring(0, 200),
    data.content || '',
    req.params.id
  );

  res.json({ message: 'Article updated' });
});

// DELETE /api/articles/:id (auth required)
router.delete('/:id', authenticate, (req, res) => {
  const db = getDb();
  const existing = db.prepare('SELECT id FROM articles WHERE id = ?').get(req.params.id);
  if (!existing) return res.status(404).json({ title: 'Not Found', status: 404, detail: 'Article not found' });

  db.prepare('DELETE FROM articles WHERE id = ?').run(req.params.id);
  res.json({ message: 'Article deleted' });
});

module.exports = router;
