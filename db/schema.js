// lightcirle — Database Schema & Connection
const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const DB_PATH = path.join(__dirname, '..', 'data', 'lightcirle.db');

let db;

function getDb() {
  if (db) return db;
  db = new Database(DB_PATH);
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');
  return db;
}

function initSchema() {
  const d = getDb();

  d.exec(`
    -- Site settings (single row)
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      brand_name TEXT NOT NULL DEFAULT 'lightcirle',
      brand_tagline TEXT NOT NULL DEFAULT 'Premium Custom Yoga Wear Manufacturer',
      brand_domain TEXT NOT NULL DEFAULT 'lightcirle.com',
      whatsapp_number TEXT NOT NULL DEFAULT '8612345678900',
      email_address TEXT NOT NULL DEFAULT 'inquiry@lightcirle.com',
      site_title TEXT NOT NULL DEFAULT 'lightcirle | Premium Custom Yoga Wear Manufacturer | MOQ 50pcs',
      site_description TEXT NOT NULL DEFAULT 'Factory-direct B2B custom yoga wear manufacturer.',
      moq INTEGER NOT NULL DEFAULT 50,
      location TEXT NOT NULL DEFAULT 'Guangzhou, China',
      year_established INTEGER NOT NULL DEFAULT 2016,
      countries_shipped INTEGER NOT NULL DEFAULT 30,
      colors_primary TEXT NOT NULL DEFAULT '#2D5A3D',
      colors_primary_light TEXT NOT NULL DEFAULT '#3E7B54',
      colors_primary_dark TEXT NOT NULL DEFAULT '#1F3F2A',
      colors_accent TEXT NOT NULL DEFAULT '#C4926E',
      colors_accent_light TEXT NOT NULL DEFAULT '#D4A88C',
      colors_whatsapp TEXT NOT NULL DEFAULT '#25D366',
      oss_enabled INTEGER NOT NULL DEFAULT 0,
      oss_region TEXT NOT NULL DEFAULT '',
      oss_bucket TEXT NOT NULL DEFAULT '',
      oss_access_key_id TEXT NOT NULL DEFAULT '',
      oss_access_key_secret TEXT NOT NULL DEFAULT '',
      oss_cdn_domain TEXT NOT NULL DEFAULT '',
      favicon_path TEXT NOT NULL DEFAULT '',
      business_hours TEXT NOT NULL DEFAULT 'Mon-Sat, 9AM-6PM (GMT+8)',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Products
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      moq INTEGER NOT NULL DEFAULT 50,
      fabric TEXT NOT NULL DEFAULT '',
      features TEXT NOT NULL DEFAULT '[]',
      weight TEXT NOT NULL DEFAULT '',
      sizes TEXT NOT NULL DEFAULT '[]',
      colors TEXT NOT NULL DEFAULT '[]',
      description TEXT NOT NULL DEFAULT '',
      customization TEXT NOT NULL DEFAULT '[]',
      images TEXT NOT NULL DEFAULT '[]',
      lead_time TEXT NOT NULL DEFAULT '15-25 days',
      certifications TEXT NOT NULL DEFAULT '[]',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Blog articles
    CREATE TABLE IF NOT EXISTS articles (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      date TEXT NOT NULL DEFAULT (date('now')),
      author TEXT NOT NULL DEFAULT 'lightcirle Team',
      category TEXT NOT NULL DEFAULT 'business-tips',
      tags TEXT NOT NULL DEFAULT '[]',
      image TEXT NOT NULL DEFAULT '',
      excerpt TEXT NOT NULL DEFAULT '',
      content TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Admin user
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Media files
    CREATE TABLE IF NOT EXISTS media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      filename TEXT NOT NULL,
      original_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      mime_type TEXT NOT NULL,
      file_size INTEGER NOT NULL,
      folder TEXT NOT NULL DEFAULT 'site',
      oss_path TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Categories
    CREATE TABLE IF NOT EXISTS categories (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      type TEXT NOT NULL DEFAULT 'product',
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Company info (single row)
    CREATE TABLE IF NOT EXISTS company_info (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      about_title TEXT NOT NULL DEFAULT 'The Manufacturing Powerhouse Behind Your Brand',
      about_text TEXT NOT NULL DEFAULT 'Since 2016, our 3,000m² facility in Guangzhou has been producing premium yoga wear for brands worldwide. With 120+ skilled technicians and a monthly capacity of 300,000 pieces, we bring your designs to life with precision and care.',
      facility_size TEXT NOT NULL DEFAULT '3,000',
      workers TEXT NOT NULL DEFAULT '120+',
      monthly_capacity TEXT NOT NULL DEFAULT '300K',
      countries_shipped TEXT NOT NULL DEFAULT '30+',
      capabilities TEXT NOT NULL DEFAULT '["OEM & ODM Service","Custom Fabric Blends","Pantone Color Matching","Logo Embroidery","Custom Labels & Tags","Branded Packaging","OEKO-TEX Certified","AQL 2.5 QC"]',
      gallery TEXT NOT NULL DEFAULT '[]',
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- Visitor analytics
    CREATE TABLE IF NOT EXISTS visitor_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      session_id TEXT NOT NULL,
      page_url TEXT NOT NULL,
      page_title TEXT NOT NULL DEFAULT '',
      referrer TEXT NOT NULL DEFAULT '',
      user_agent TEXT NOT NULL DEFAULT '',
      ip_address TEXT NOT NULL DEFAULT '',
      country TEXT NOT NULL DEFAULT '',
      entry_time TEXT NOT NULL DEFAULT (datetime('now')),
      exit_time TEXT,
      duration INTEGER DEFAULT 0,
      scroll_depth INTEGER DEFAULT 0,
      is_bounce INTEGER DEFAULT 1,
      click_whatsapp INTEGER DEFAULT 0,
      click_email INTEGER DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_visitor_session ON visitor_logs(session_id);
    CREATE INDEX IF NOT EXISTS idx_visitor_entry ON visitor_logs(entry_time);

    -- Custom quote requests (lead capture from the "Get a Quote" wizard)
    CREATE TABLE IF NOT EXISTS quote_requests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL DEFAULT '',
      company TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      whatsapp TEXT NOT NULL DEFAULT '',
      category TEXT NOT NULL DEFAULT '',
      qty TEXT NOT NULL DEFAULT '',
      color TEXT NOT NULL DEFAULT '',
      color_hex TEXT NOT NULL DEFAULT '',
      fabric TEXT NOT NULL DEFAULT '',
      customization TEXT NOT NULL DEFAULT '[]',
      delivery TEXT NOT NULL DEFAULT '',
      budget TEXT NOT NULL DEFAULT '',
      notes TEXT NOT NULL DEFAULT '',
      status TEXT NOT NULL DEFAULT 'new',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_quote_status ON quote_requests(status);
    CREATE INDEX IF NOT EXISTS idx_quote_created ON quote_requests(created_at);
  `);

  // --- Migrations (add columns that may be missing in existing DB) ---
  const migrations = [
    // Settings columns
    "ALTER TABLE settings ADD COLUMN oss_enabled INTEGER NOT NULL DEFAULT 0",
    "ALTER TABLE settings ADD COLUMN oss_region TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN oss_bucket TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN oss_access_key_id TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN oss_access_key_secret TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN oss_cdn_domain TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN favicon_path TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN oss_prefix TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE settings ADD COLUMN business_hours TEXT NOT NULL DEFAULT 'Mon-Sat, 9AM-6PM (GMT+8)'",
    // Media columns
    "ALTER TABLE media ADD COLUMN folder TEXT NOT NULL DEFAULT 'site'",
    "ALTER TABLE media ADD COLUMN oss_path TEXT NOT NULL DEFAULT ''",
    // Company info columns
    "ALTER TABLE company_info ADD COLUMN why_choose_us TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE company_info ADD COLUMN equipment_title TEXT NOT NULL DEFAULT 'Advanced Equipment for Premium Results'",
    "ALTER TABLE company_info ADD COLUMN equipment_desc TEXT NOT NULL DEFAULT 'Our factory is equipped with industry-leading machinery to ensure every stitch meets international quality standards.'",
    "ALTER TABLE company_info ADD COLUMN equipment_list TEXT NOT NULL DEFAULT '[]'",
    "ALTER TABLE company_info ADD COLUMN equipment_images TEXT NOT NULL DEFAULT '[]'",
    // Categories
    "ALTER TABLE categories ADD COLUMN image TEXT NOT NULL DEFAULT ''",
    // Categories: parent_id for two-level hierarchy (empty string = top-level)
    "ALTER TABLE categories ADD COLUMN parent_id TEXT NOT NULL DEFAULT ''",
    // Product video (Alibaba-style main image video)
    "ALTER TABLE products ADD COLUMN video TEXT NOT NULL DEFAULT ''",
    // Article video (top of body)
    "ALTER TABLE articles ADD COLUMN video TEXT NOT NULL DEFAULT ''",
  ];

  for (const sql of migrations) {
    try { d.exec(sql); } catch(e) { /* column already exists, ignore */ }
  }

  return d;
}

// Create default admin if not exists
function ensureAdmin(username, password) {
  const d = getDb();
  const existing = d.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (!existing) {
    const hash = bcrypt.hashSync(password, 10);
    d.prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)').run(username, hash);
    console.log('Default admin user created: ' + username);
  }
}

// Insert default settings if not exists
function ensureSettings() {
  const d = getDb();
  const existing = d.prepare('SELECT id FROM settings WHERE id = 1').get();
  if (!existing) {
    d.prepare(`
      INSERT INTO settings (id) VALUES (1)
    `).run();
    console.log('Default settings created');
  }
}

module.exports = { getDb, initSchema, ensureAdmin, ensureSettings };
