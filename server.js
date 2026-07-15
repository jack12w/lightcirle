// lightcirle — Main Server
const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const { initSchema, ensureAdmin, ensureSettings, getDb } = require('./db/schema');
const { seedIfEmpty } = require('./db/seed');
const { exportAll } = require('./db/export');

const app = express();
const PORT = process.env.PORT || 3000;

// --- Init Database ---
console.log('server: initializing database...');
initSchema();
ensureAdmin('admin', 'admin123');
ensureSettings();
seedIfEmpty();
exportAll();
normalizeProductIds();
const dbPath = path.join(__dirname, 'data', 'lightcirle.db');
try {
  const stat = fs.statSync(dbPath);
  console.log(`server: database at ${dbPath} (${(stat.size/1024).toFixed(1)} KB)`);
} catch(e) {
  console.log(`server: database at ${dbPath} (not yet created)`);
}

// --- Middleware ---
app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Request logging
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const ms = Date.now() - start;
    if (req.path.startsWith('/api/')) {
      console.log(`${req.method} ${req.path} ${res.statusCode} ${ms}ms`);
    }
  });
  next();
});

// --- Static Files ---
// Serve js/config.js from persistent volume (survives deploys)
app.get('/js/config.js', (req, res) => {
  const volPath = path.join(__dirname, 'data', 'config.js');
  const builtinPath = path.join(__dirname, 'js', 'config.js');
  try {
    if (fs.existsSync(volPath)) {
      return res.sendFile(volPath);
    }
  } catch(e) {}
  res.sendFile(builtinPath);
});

// Serve data JSON (regenerated from DB by exportAll() on every startup & after admin edits)
app.get('/data/products.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'products.json'));
});
app.get('/data/blog.json', (req, res) => {
  res.sendFile(path.join(__dirname, 'data', 'blog.json'));
});

// --- 301 Redirect: legacy ?id= format → SEO slug format ---
// So Google-indexed / shared old links auto-jump to the new pretty URL.
function slugify(text) {
  let s = String(text).toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const MAX = 60;
  if (s.length > MAX) { const cut = s.lastIndexOf('-', MAX - 1); s = cut > 0 ? s.slice(0, cut) : s.slice(0, MAX); }
  return s;
}

// Normalize products whose id is a long title-slug (causes URL duplication like /slug_fulltitle).
// Runs idempotently at startup; reassigns a short p-xxxxxx id and re-exports JSON.
function normalizeProductIds() {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT id, name FROM products').all();
    let changed = false;
    for (const r of rows) {
      const titleSlug = slugify(r.name);
      const isTitleLike = r.id.length > 40 || (r.id.length > 30 && r.id === titleSlug);
      if (isTitleLike) {
        let nid;
        do { nid = 'p-' + Math.random().toString(36).slice(2, 8); } while (db.prepare('SELECT 1 FROM products WHERE id = ?').get(nid));
        db.prepare('UPDATE products SET id = ? WHERE id = ?').run(nid, r.id);
        console.log(`normalizeProductIds: "${r.id}" -> "${nid}"`);
        changed = true;
      }
    }
    if (changed) exportAll();
  } catch (e) {
    console.error('normalizeProductIds error:', e.message);
  }
}
app.get('/product-detail.html', (req, res) => {
  const id = req.query.id;
  if (!id) return res.sendFile(path.join(__dirname, 'product-detail.html'));
  const db = getDb();
  let product = null;
  try { product = db.prepare('SELECT id, name FROM products WHERE id = ?').get(id); } catch(e) {}
  if (!product) {
    // legacy id might actually be a title-slug (pre-normalization) → match by slug
    try {
      const rows = db.prepare('SELECT id, name FROM products').all();
      for (const r of rows) { if (slugify(r.name) === slugify(id)) { product = r; break; } }
    } catch(e) {}
  }
  if (product) return res.redirect(301, `/product-detail/${slugify(product.name)}_${product.id}.html`);
  res.sendFile(path.join(__dirname, 'product-detail.html'));
});
app.get('/blog-detail.html', (req, res) => {
  const id = req.query.id;
  if (!id) return res.sendFile(path.join(__dirname, 'blog-detail.html'));
  const db = getDb();
  let article = null;
  try { article = db.prepare('SELECT id, title FROM articles WHERE id = ?').get(id); } catch(e) {}
  if (!article) {
    try {
      const rows = db.prepare('SELECT id, title FROM articles').all();
      for (const r of rows) { if (slugify(r.title) === slugify(id)) { article = r; break; } }
    } catch(e) {}
  }
  if (article) return res.redirect(301, `/blog-detail/${slugify(article.title)}_${article.id}.html`);
  res.sendFile(path.join(__dirname, 'blog-detail.html'));
});

// --- SEO-friendly Slug URLs (Alibaba-style, must be before static to win) ---
// Product:  /product-detail/{slug}_{productId}.html
// Article:  /blog-detail/{slug}_{articleId}.html
// Server-side canonical rewrite so even JS-disabled crawlers see the correct URL.
function sendWithCanonical(res, file, reqPath) {
  fs.readFile(path.join(__dirname, file), 'utf8', (err, html) => {
    if (err) return res.status(500).send('Error');
    const canon = 'https://lightcirle.com' + reqPath;
    // Replace static canonical placeholder (and any already-set value)
    html = html.replace(/<link rel="canonical" href="[^"]*">/, '<link rel="canonical" href="' + canon + '">');
    res.set('Content-Type', 'text/html; charset=utf-8');
    res.send(html);
  });
}
app.get('/product-detail/:path', (req, res) => {
  // Validate slug / id: if title changed OR id was normalized, 301 → canonical clean URL
  const match = req.params.path.match(/^(.*)_([^.]+)\.html$/);
  const urlSlug = match ? match[1] : req.params.path.replace(/\.html$/, '');
  const id = match ? match[2] : null;
  const db = getDb();
  let product = null;
  if (id) {
    try { product = db.prepare('SELECT id, name FROM products WHERE id = ?').get(id); } catch(e) {}
  }
  if (!product && urlSlug) {
    // slug fallback: covers normalized ids (old long id) and changed titles
    try {
      const rows = db.prepare('SELECT id, name FROM products').all();
      for (const r of rows) { if (slugify(r.name) === urlSlug) { product = r; break; } }
    } catch(e) {}
  }
  if (product) {
    const correctSlug = slugify(product.name);
    const correctId = product.id;
    if (urlSlug !== correctSlug || id !== correctId) {
      return res.redirect(301, `/product-detail/${correctSlug}_${correctId}.html`);
    }
  }
  sendWithCanonical(res, 'product-detail.html', req.path);
});
app.get('/blog-detail/:path', (req, res) => {
  // Validate slug / id: if title changed OR id was normalized, 301 → canonical clean URL
  const match = req.params.path.match(/^(.*)_([^.]+)\.html$/);
  const urlSlug = match ? match[1] : req.params.path.replace(/\.html$/, '');
  const id = match ? match[2] : null;
  const db = getDb();
  let article = null;
  if (id) {
    try { article = db.prepare('SELECT id, title FROM articles WHERE id = ?').get(id); } catch(e) {}
  }
  if (!article && urlSlug) {
    try {
      const rows = db.prepare('SELECT id, title FROM articles').all();
      for (const r of rows) { if (slugify(r.title) === urlSlug) { article = r; break; } }
    } catch(e) {}
  }
  if (article) {
    const correctSlug = slugify(article.title);
    const correctId = article.id;
    if (urlSlug !== correctSlug || id !== correctId) {
      return res.redirect(301, `/blog-detail/${correctSlug}_${correctId}.html`);
    }
  }
  sendWithCanonical(res, 'blog-detail.html', req.path);
});

app.use(express.static(__dirname));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// --- API Routes ---
app.use('/api/auth', require('./routes/auth'));
app.use('/api/products', require('./routes/products'));
app.use('/api/articles', require('./routes/articles'));
app.use('/api/settings', require('./routes/settings'));
app.use('/api/upload', require('./routes/upload'));
app.use('/api/media', require('./routes/media'));
app.use('/api/categories', require('./routes/categories'));
app.use('/api/company', require('./routes/company'));
app.use('/api/visitors', require('./routes/visitors'));
app.use('/api/quotes', require('./routes/quotes'));

// --- Admin pages ---
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'login.html')));
app.get('/admin/login', (req, res) => res.sendFile(path.join(__dirname, 'admin', 'login.html')));
app.use('/admin', express.static(path.join(__dirname, 'admin')));

// --- Health ---
app.get('/api/health', (req, res) => {
  try {
    getDb().prepare('SELECT 1').get();
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  } catch(e) {
    res.status(503).json({ status: 'error', message: e.message });
  }
});

// --- Slug Routes (SEO-friendly URLs for products & articles) ---
// Matches: /product-title-slug.html?id=xxx
// Serves the correct detail page while keeping the pretty URL
app.get('/:slug.html', (req, res, next) => {
  const id = req.query.id;
  if (!id) return next();

  // Product IDs: leggings-01, bra-01, outerwear-01, hoodie-01, set-01, seamless-01
  if (/^(leggings|bra|outerwear|hoodie|set|seamless)-\d+$/.test(id)) {
    return res.sendFile(path.join(__dirname, 'product-detail.html'));
  }
  // Article IDs: fabric-guide-01, moq-guide-02, customization-process-03, etc.
  if (/^(fabric-guide|moq-guide|customization-process|yoga-wear-trends|private-label|shipping-logistics)-\d+$/.test(id)) {
    return res.sendFile(path.join(__dirname, 'blog-detail.html'));
  }
  next();
});

// --- 404 Handler ---
app.use((req, res, next) => {
  // Only handle HTML requests, not API
  if (req.path.startsWith('/api/')) return next();
  res.status(404).sendFile(path.join(__dirname, '404.html'));
});

// --- Error Handler ---
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ title: 'Internal Error', status: 500, detail: err.message });
});

// --- Start ---
app.listen(PORT, '0.0.0.0', () => {
  console.log(`lightcirle server running on http://0.0.0.0:${PORT}`);
  console.log(`Admin panel: http://0.0.0.0:${PORT}/admin`);
  console.log(`Static site: http://0.0.0.0:${PORT}`);
});
