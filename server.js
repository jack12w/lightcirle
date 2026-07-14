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
  sendWithCanonical(res, 'product-detail.html', req.path);
});
app.get('/blog-detail/:path', (req, res) => {
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
