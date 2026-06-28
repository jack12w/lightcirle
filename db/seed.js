// lightcirle — Seed data (safe mode: never deletes existing data)
const path = require('path');
const { initSchema, ensureAdmin, ensureSettings, getDb } = require('./schema');

// Initialize schema (creates tables if not exist, preserves existing data)
const db = initSchema();
ensureAdmin('admin', 'admin123');
ensureSettings();

// Helper: check if table has data
function hasData(table) {
  const row = db.prepare(`SELECT COUNT(*) as c FROM ${table}`).get();
  return row.c > 0;
}

// Seed products only if table is empty
if (!hasData('products')) {
  const products = require(path.join(__dirname, '..', 'data', 'products.json'));
  const insertProduct = db.prepare(`
    INSERT INTO products (id, name, category, moq, fabric, features, weight, sizes, colors, description, customization, images, lead_time, certifications)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx = db.transaction(() => {
    products.forEach(p => {
      insertProduct.run(
        p.id, p.name, p.category, p.moq || 50, p.fabric || '',
        JSON.stringify(p.features || []), p.weight || '',
        JSON.stringify(p.sizes || []), JSON.stringify(p.colors || []),
        p.description || '', JSON.stringify(p.customization || []),
        JSON.stringify(p.images || []), p.leadTime || '15-25 days',
        JSON.stringify(p.certifications || [])
      );
    });
  });
  tx();
  console.log('Seeded ' + products.length + ' products');
} else {
  console.log('Products table already has data, skipping.');
}

// Seed articles only if table is empty
if (!hasData('articles')) {
  const articles = require(path.join(__dirname, '..', 'data', 'blog.json'));
  const insertArticle = db.prepare(`
    INSERT INTO articles (id, title, date, author, category, tags, image, excerpt, content)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  const tx2 = db.transaction(() => {
    articles.forEach(a => {
      insertArticle.run(
        a.id, a.title, a.date || new Date().toISOString().split('T')[0],
        a.author || 'lightcirle Team', a.category || 'business-tips',
        JSON.stringify(a.tags || []), a.image || '',
        a.excerpt || '', a.content || ''
      );
    });
  });
  tx2();
  console.log('Seeded ' + articles.length + ' articles');
} else {
  console.log('Articles table already has data, skipping.');
}

// Seed categories (INSERT OR IGNORE = safe to run even if data exists)
const categories = [
  { id: 'yoga-pants', name: 'Yoga Pants', type: 'product' },
  { id: 'sports-bras', name: 'Sports Bras', type: 'product' },
  { id: 'yoga-outerwear', name: 'Yoga Outerwear', type: 'product' },
  { id: 'hoodies', name: 'Hoodies', type: 'product' },
  { id: 'sets', name: 'Matching Sets', type: 'product' },
  { id: 'seamless', name: 'Seamless', type: 'product' },
  { id: 'fabric-knowledge', name: 'Fabric Knowledge', type: 'article' },
  { id: 'business-tips', name: 'Business Tips', type: 'article' },
  { id: 'industry-news', name: 'Industry News', type: 'article' },
];

const insertCat = db.prepare('INSERT OR IGNORE INTO categories (id, name, type, sort_order) VALUES (?, ?, ?, ?)');
const tx3 = db.transaction(() => {
  categories.forEach((c, i) => insertCat.run(c.id, c.name, c.type, i));
});
tx3();
console.log('Categories seeded (ignored duplicates).');

console.log('Seed complete! (existing data preserved)');
