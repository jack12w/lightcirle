// lightcirle — Settings Routes
const express = require('express');
const { getDb } = require('../db/schema');
const { authenticate } = require('./middleware');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// GET /api/settings
router.get('/', (req, res) => {
  const db = getDb();
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!s) return res.status(404).json({ title: 'Not Found', detail: 'Settings not found' });

  // Calculate DB file size
  const dbPath = path.join(__dirname, '..', 'data', 'lightcirle.db');
  let dbSize = '0 KB';
  try {
    const stat = fs.statSync(dbPath);
    const sizeKB = stat.size / 1024;
    dbSize = sizeKB < 1024 ? Math.round(sizeKB) + ' KB' : (sizeKB / 1024).toFixed(1) + ' MB';
  } catch(e) {}

  res.json({
    brandName: s.brand_name,
    brandTagline: s.brand_tagline,
    brandDomain: s.brand_domain,
    whatsappNumber: s.whatsapp_number,
    emailAddress: s.email_address,
    siteTitle: s.site_title,
    siteDescription: s.site_description,
    moq: s.moq,
    location: s.location,
    yearEstablished: s.year_established,
    countriesShipped: s.countries_shipped,
    colors: {
      primary: s.colors_primary,
      primaryLight: s.colors_primary_light,
      primaryDark: s.colors_primary_dark,
      accent: s.colors_accent,
      accentLight: s.colors_accent_light,
      whatsapp: s.colors_whatsapp,
    },
    oss: {
      enabled: !!s.oss_enabled,
      region: s.oss_region || '',
      bucket: s.oss_bucket || '',
      accessKeyId: s.oss_access_key_id || '',
      accessKeySecret: s.oss_access_key_secret || '',
      cdnDomain: s.oss_cdn_domain || '',
    },
    faviconPath: s.favicon_path || '',
    dbSize: dbSize,
  });
});

// PUT /api/settings (auth required)
router.put('/', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body;

  db.prepare(`
    UPDATE settings SET
      brand_name=?, brand_tagline=?, brand_domain=?, whatsapp_number=?, email_address=?,
      site_title=?, site_description=?, moq=?, location=?, year_established=?, countries_shipped=?,
      colors_primary=?, colors_primary_light=?, colors_primary_dark=?,
      colors_accent=?, colors_accent_light=?, colors_whatsapp=?,
      oss_enabled=?, oss_region=?, oss_bucket=?, oss_access_key_id=?, oss_access_key_secret=?, oss_cdn_domain=?,
      favicon_path=?,
      updated_at=datetime('now')
    WHERE id=1
  `).run(
    data.brandName || 'lightcirle', data.brandTagline || '',
    data.brandDomain || 'lightcirle.com', data.whatsappNumber || '', data.emailAddress || '',
    data.siteTitle || '', data.siteDescription || '', data.moq || 50,
    data.location || '', data.yearEstablished || 2016, data.countriesShipped || 0,
    data.colors?.primary || '#2D5A3D', data.colors?.primaryLight || '#3E7B54', data.colors?.primaryDark || '#1F3F2A',
    data.colors?.accent || '#C4926E', data.colors?.accentLight || '#D4A88C', data.colors?.whatsapp || '#25D366',
    data.oss?.enabled ? 1 : 0, data.oss?.region || '', data.oss?.bucket || '',
    data.oss?.accessKeyId || '', data.oss?.accessKeySecret || '', data.oss?.cdnDomain || '',
    data.faviconPath || ''
  );

  // Also write to config.js for the static site
  syncConfigToFile();

  res.json({ message: 'Settings updated' });
});

function buildConfigFileContent() {
  const db = getDb();
  const s = db.prepare('SELECT * FROM settings WHERE id = 1').get();
  if (!s) return null;

  const live = {
    brandName: s.brand_name,
    brandTagline: s.brand_tagline || '',
    brandDomain: s.brand_domain,
    brandFullDomain: 'https://' + s.brand_domain,
    colors: {
      primary: s.colors_primary,
      primaryLight: s.colors_primary_light,
      primaryDark: s.colors_primary_dark,
      accent: s.colors_accent,
      accentLight: s.colors_accent_light,
      accentDark: '#A67B5B',
      whatsapp: s.colors_whatsapp,
      background: '#FAFAF8',
      surface: '#FFFFFF',
      text: '#2C2C2C',
      textMuted: '#6B7280',
      border: '#E5E7EB',
      darkBackground: '#1A1D1C',
      darkSurface: '#252928',
      darkText: '#E8E6E3',
      darkTextMuted: '#9CA3AF',
      darkBorder: '#374151',
    },
    whatsappNumber: s.whatsapp_number,
    emailAddress: s.email_address,
    siteTitle: s.site_title || '',
    siteDescription: s.site_description || '',
    moq: s.moq || 50,
    location: s.location || 'Guangzhou, China',
    yearEstablished: s.year_established || 2016,
    countriesShipped: s.countries_shipped || 30,
    faviconPath: s.favicon_path || '',
  };

  // Preserve the builtin file's tail (favicon/CSS-var sync + JSON-LD schema injectors):
  // only replace the `window.SITE_CONFIG = { ... };` block with live values.
  const builtinPath = path.join(__dirname, '..', 'js', 'config.js');
  let builtin = '';
  try { builtin = fs.readFileSync(builtinPath, 'utf8'); } catch (e) { builtin = ''; }

  const marker = 'window.SITE_CONFIG =';
  const idx = builtin.indexOf(marker);
  if (idx === -1) {
    // builtin missing — fall back to a minimal but valid file
    return 'window.SITE_CONFIG = ' + JSON.stringify(live, null, 2) + ';\n';
  }
  const open = builtin.indexOf('{', idx);
  let depth = 0, end = -1;
  for (let i = open; i < builtin.length; i++) {
    if (builtin[i] === '{') depth++;
    else if (builtin[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return 'window.SITE_CONFIG = ' + JSON.stringify(live, null, 2) + ';\n';

  const head = builtin.slice(0, idx);
  const tail = builtin.slice(end + 1); // includes the closing `;` and everything after
  const cfgStr = 'window.SITE_CONFIG = ' + JSON.stringify(live, null, 2) + ';';
  return head + cfgStr + tail;
}

function syncConfigToFile() {
  try {
    const content = buildConfigFileContent();
    if (!content) return;
    // Write to BOTH locations so the live config is picked up whether the site is
    // served by Express (which swaps in data/config.js) or by a plain static server / Nginx
    // (which serves js/config.js directly).
    const targets = [
      path.join(__dirname, '..', 'data', 'config.js'), // volume-backed, used by Express swap
      path.join(__dirname, '..', 'js', 'config.js'),    // served directly by static hosts
    ];
    for (const t of targets) {
      try { fs.writeFileSync(t, content, 'utf8'); }
      catch (e) { console.error('Failed to write', t, ':', e.message); }
    }
    console.log('config.js synced (js/config.js + data/config.js)');
  } catch (e) {
    console.error('Failed to sync config.js:', e.message);
  }
}

module.exports = router;
