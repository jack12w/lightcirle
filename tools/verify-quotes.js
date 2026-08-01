// Verify quotes.html main content area is now Tailwind-styled (not hand-written green cards)
// and that stats / filters / table still render after the rewrite.
const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  const login = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    const j = await r.json();
    return j.token;
  });
  await ctx.addInitScript(t => localStorage.setItem('token', t), login);

  const errors = [];
  page.on('pageerror', e => errors.push('PAGEERROR: ' + e.message));
  page.on('console', m => { if (m.type() === 'error') errors.push('CONSOLE: ' + m.text()); });

  await page.goto('http://localhost:3000/admin/quotes.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1000);

  const info = await page.evaluate(() => {
    const sb = document.getElementById('adminSidebar');
    const stats = document.getElementById('stats');
    const filterBar = document.getElementById('filterBar');
    const tbody = document.getElementById('quoteTable');
    const statCards = stats ? [...stats.querySelectorAll('.stat-card')] : [];
    const filterBtns = filterBar ? [...filterBar.querySelectorAll('button')] : [];
    let activeFilter = null;
    filterBtns.forEach(b => { if (getComputedStyle(b).backgroundColor === 'rgb(45, 90, 61)') activeFilter = b.textContent.trim(); });
    const th = document.querySelector('thead th');
    const firstBadge = tbody && tbody.querySelector('span');
    return {
      white: document.body.innerText.trim().length < 20,
      menuCount: sb ? sb.querySelectorAll('.sb-link').length : 0,
      activeMenu: sb && sb.querySelector('.sb-link.active') ? sb.querySelector('.sb-link.active').textContent.trim() : null,
      statCardCount: statCards.length,
      statCardBg: statCards[0] ? getComputedStyle(statCards[0]).backgroundColor : null,
      filterBtnCount: filterBtns.length,
      activeFilterText: activeFilter,
      rowCount: tbody ? tbody.querySelectorAll('tr').length : 0,
      thPadding: th ? getComputedStyle(th).padding : null,
      firstBadgeClass: firstBadge ? firstBadge.className : null,
      firstBadgeBg: firstBadge ? getComputedStyle(firstBadge).backgroundColor : null,
      noHandwrittenStyle: !document.querySelector('style') // hand-written <style> block removed?
    };
  });
  console.log(JSON.stringify(info, null, 2));
  console.log('ERRORS:', errors.length ? JSON.stringify(errors) : 'none');
  await page.screenshot({ path: '.workbuddy/verify-quotes.png', fullPage: false });
  await browser.close();
})();
