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
    businessHours: s.business_hours || 'Mon-Sat, 9AM-6PM (GMT+8)',
    dbSize: dbSize,
  });
});

// PUT /api/settings (auth required)
// Merges with the existing row so a PARTIAL update never wipes other fields.
router.put('/', authenticate, (req, res) => {
  const db = getDb();
  const data = req.body || {};
  const cur = db.prepare('SELECT * FROM settings WHERE id = 1').get() || {};

  const merged = {
    brandName:       data.brandName       ?? cur.brand_name        ?? 'lightcirle',
    brandTagline:    data.brandTagline    ?? cur.brand_tagline     ?? '',
    brandDomain:     data.brandDomain     ?? cur.brand_domain      ?? 'lightcirle.com',
    whatsappNumber:  data.whatsappNumber  ?? cur.whatsapp_number   ?? '',
    emailAddress:    data.emailAddress    ?? cur.email_address     ?? '',
    siteTitle:       data.siteTitle       ?? cur.site_title        ?? '',
    siteDescription: data.siteDescription ?? cur.site_description  ?? '',
    moq:             data.moq             ?? cur.moq               ?? 50,
    location:        data.location        ?? cur.location          ?? '',
    yearEstablished: data.yearEstablished ?? cur.year_established  ?? 2016,
    countriesShipped: data.countriesShipped ?? cur.countries_shipped ?? 0,
    colors: {
      primary:     data.colors?.primary     ?? cur.colors_primary     ?? '#2D5A3D',
      primaryLight: data.colors?.primaryLight ?? cur.colors_primary_light ?? '#3E7B54',
      primaryDark:  data.colors?.primaryDark  ?? cur.colors_primary_dark  ?? '#1F3F2A',
      accent:      data.colors?.accent      ?? cur.colors_accent      ?? '#C4926E',
      accentLight: data.colors?.accentLight ?? cur.colors_accent_light ?? '#D4A88C',
      whatsapp:    data.colors?.whatsapp    ?? cur.colors_whatsapp    ?? '#25D366',
    },
    oss: {
      enabled:      data.oss?.enabled      ?? !!cur.oss_enabled,
      region:       data.oss?.region       ?? cur.oss_region       ?? '',
      bucket:       data.oss?.bucket       ?? cur.oss_bucket       ?? '',
      accessKeyId:  data.oss?.accessKeyId  ?? cur.oss_access_key_id ?? '',
      accessKeySecret: data.oss?.accessKeySecret ?? cur.oss_access_key_secret ?? '',
      cdnDomain:    data.oss?.cdnDomain    ?? cur.oss_cdn_domain    ?? '',
    },
    faviconPath: data.faviconPath ?? cur.favicon_path ?? '',
    businessHours: data.businessHours ?? cur.business_hours ?? 'Mon-Sat, 9AM-6PM (GMT+8)',
  };

  db.prepare(`
    UPDATE settings SET
      brand_name=?, brand_tagline=?, brand_domain=?, whatsapp_number=?, email_address=?,
      site_title=?, site_description=?, moq=?, location=?, year_established=?, countries_shipped=?,
      colors_primary=?, colors_primary_light=?, colors_primary_dark=?,
      colors_accent=?, colors_accent_light=?,       colors_whatsapp=?,
      oss_enabled=?, oss_region=?, oss_bucket=?, oss_access_key_id=?, oss_access_key_secret=?, oss_cdn_domain=?,
      favicon_path=?, business_hours=?,
      updated_at=datetime('now')
    WHERE id=1
  `).run(
    merged.brandName, merged.brandTagline, merged.brandDomain, merged.whatsappNumber, merged.emailAddress,
    merged.siteTitle, merged.siteDescription, merged.moq, merged.location, merged.yearEstablished, merged.countriesShipped,
    merged.colors.primary, merged.colors.primaryLight, merged.colors.primaryDark,
    merged.colors.accent, merged.colors.accentLight, merged.colors.whatsapp,
    merged.oss.enabled ? 1 : 0, merged.oss.region, merged.oss.bucket,
    merged.oss.accessKeyId, merged.oss.accessKeySecret, merged.oss.cdnDomain,
    merged.faviconPath, merged.businessHours
  );

  // Also write to config.js for the static site
  syncConfigToFile();

  res.json({ message: 'Settings updated' });
});

// Serialize an object as a JS object literal using SINGLE quotes, to match the
// committed js/config.js style. Plain JSON.stringify would emit double quotes and
// "pollute" the tracked file on every settings save. Properly escapes apostrophes
// inside values and preserves escaped double-quotes / other escapes verbatim.
// Object keys are left UNQUOTED (they are all valid JS identifiers in SITE_CONFIG),
// so the regenerated block matches the hand-written template exactly.
function singleQuoteStringify(obj, indent) {
  const json = JSON.stringify(obj, null, indent == null ? 2 : indent);
  let out = '';
  let inStr = false;
  for (let i = 0; i < json.length; i++) {
    const ch = json[i];
    if (ch === '\\') {
      // copy the escape sequence verbatim (e.g. \" or \n or \uXXXX)
      out += ch + (json[i + 1] || '');
      i++;
      continue;
    }
    if (ch === '"') {
      out += "'";
      inStr = !inStr;
      continue;
    }
    if (inStr && ch === "'") {
      out += "\\'";
      continue;
    }
    out += ch;
  }
  // Unquote identifier-like keys: 'brandName': -> brandName:
  out = out.replace(/'([A-Za-z_$][A-Za-z0-9_$]*)'\s*:/g, '$1:');
  return out;
}

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
    businessHours: s.business_hours || 'Mon-Sat, 9AM-6PM (GMT+8)',
  };

  // Preserve the builtin file's tail (favicon/CSS-var sync + JSON-LD schema injectors):
  // only replace the `window.SITE_CONFIG = { ... };` block with live values.
  const builtinPath = path.join(__dirname, '..', 'js', 'config.js');
  let builtin = '';
  try { builtin = fs.readFileSync(builtinPath, 'utf8'); } catch (e) { builtin = ''; }

  const marker = 'window.SITE_CONFIG =';
  const idx = builtin.indexOf(marker);
  if (idx === -1) {
    // builtin missing — fall back to a minimal but valid file (single-quote style)
    return 'window.SITE_CONFIG = ' + singleQuoteStringify(live, 2) + ';\n';
  }
  const open = builtin.indexOf('{', idx);
  let depth = 0, end = -1;
  for (let i = open; i < builtin.length; i++) {
    if (builtin[i] === '{') depth++;
    else if (builtin[i] === '}') { depth--; if (depth === 0) { end = i; break; } }
  }
  if (end === -1) return 'window.SITE_CONFIG = ' + singleQuoteStringify(live, 2) + ';\n';

  const head = builtin.slice(0, idx);
  // Strip the original block's trailing `;` so we don't end up with `};;`
  // (the new cfgStr already supplies its own `;`).
  const tail = builtin.slice(end + 1).replace(/^;/, '');
  const cfgStr = 'window.SITE_CONFIG = ' + singleQuoteStringify(live, 2) + ';';
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
