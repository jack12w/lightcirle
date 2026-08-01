// Verify admin/media.html and admin/categories.html render (no white screen)
// and product-detail thumbnails are left-aligned (no justify-between).
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  // Get a valid token
  const login = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const j = await r.json();
    return j.token;
  });
  console.log('token obtained:', !!login);
  await ctx.addInitScript(t => { localStorage.setItem('token', t); }, login);

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  // --- media.html ---
  await page.goto('http://localhost:3000/admin/media.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const media = await page.evaluate(() => ({
    bodyLen: document.body.innerText.trim().length,
    hasGrid: !!document.getElementById('mediaGrid'),
    hasSidebar: !!document.getElementById('adminSidebar'),
    hasUpload: !!document.getElementById('uploadForm'),
    white: document.body.innerText.trim().length < 20
  }));
  console.log('MEDIA:', JSON.stringify(media));
  await page.screenshot({ path: '.workbuddy/verify-admin-media.png', fullPage: false });

  // --- categories.html ---
  await page.goto('http://localhost:3000/admin/categories.html', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const cat = await page.evaluate(() => ({
    bodyLen: document.body.innerText.trim().length,
    hasTable: !!document.getElementById('categoryTable'),
    hasSidebar: !!document.getElementById('adminSidebar'),
    hasEditor: !!document.getElementById('editorModal'),
    white: document.body.innerText.trim().length < 20
  }));
  console.log('CATEGORIES:', JSON.stringify(cat));
  await page.screenshot({ path: '.workbuddy/verify-admin-categories.png', fullPage: false });

  // --- product detail thumbnails left-aligned ---
  await page.goto('http://localhost:3000/product-detail.html?id=yp001', { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const thumbs = await page.evaluate(() => {
    const strip = document.getElementById('thumbStrip');
    const wrap = document.querySelector('.pd-thumb-wrap');
    const items = strip ? strip.querySelectorAll('[data-idx]') : [];
    const justify = strip ? getComputedStyle(strip).justifyContent : null;
    let firstLeft = null, lastRight = null;
    if (items.length) {
      const sb = strip.getBoundingClientRect();
      const fb = items[0].getBoundingClientRect();
      const lb = items[items.length - 1].getBoundingClientRect();
      firstLeft = +(fb.left - sb.left).toFixed(1);
      lastRight = +(sb.right - lb.right).toFixed(1);
    }
    return { hasStrip: !!strip, itemCount: items.length, justify, firstLeftGap: firstLeft, rightGap: lastRight };
  });
  console.log('THUMBS:', JSON.stringify(thumbs));

  console.log('ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await browser.close();
})();
