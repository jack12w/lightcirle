// lightcirle — Export DB rows to static JSON (keeps front-end in sync with SQLite)
// The front-end reads /data/products.json and /data/blog.json (served from the real
// data dir). Admin edits write to SQLite, so after any mutation we regenerate the JSON.
const path = require('path');
const fs = require('fs');
const { getDb } = require('./schema');

const DATA_DIR = path.join(__dirname, '..', 'data');

function exportProducts() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM products ORDER BY sort_order ASC, created_at DESC').all();
  const products = rows.map(p => ({
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
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'products.json'), JSON.stringify(products, null, 2), 'utf8');
  return products.length;
}

function exportArticles() {
  const db = getDb();
  const rows = db.prepare('SELECT * FROM articles ORDER BY date DESC').all();
  const articles = rows.map(a => ({
    id: a.id,
    title: a.title,
    date: a.date,
    author: a.author,
    category: a.category,
    tags: JSON.parse(a.tags || '[]'),
    image: a.image,
    video: a.video || '',
    excerpt: a.excerpt,
    content: a.content,
  }));
  fs.writeFileSync(path.join(DATA_DIR, 'blog.json'), JSON.stringify(articles, null, 2), 'utf8');
  return articles.length;
}

function exportAll() {
  try {
    const pc = exportProducts();
    const ac = exportArticles();
    console.log(`[export] products.json (${pc}) + blog.json (${ac}) regenerated`);
  } catch (e) {
    console.error('[export] failed:', e.message);
  }
}

module.exports = { exportProducts, exportArticles, exportAll };
