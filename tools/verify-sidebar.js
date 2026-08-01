// Compare admin sidebar computed styles across pages to find why quotes.html differs.
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

  for (const p of ['admin/quotes.html', 'admin/dashboard.html', 'admin/articles.html', 'admin/products.html']) {
    await page.goto('http://localhost:3000/' + p, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);
    const info = await page.evaluate(() => {
      const sb = document.getElementById('adminSidebar');
      if (!sb) return { page: location.pathname, error: 'NO SIDEBAR' };
      const nav = document.getElementById('adminNav');
      const links = nav ? [...nav.querySelectorAll('.sb-link')] : [];
      const first = links[0];
      const active = nav ? nav.querySelector('.sb-link.active') : null;
      const cs = getComputedStyle(sb);
      const lc = first ? getComputedStyle(first) : null;
      return {
        page: location.pathname,
        sbBg: cs.backgroundColor, sbWidth: cs.width, sbPos: cs.position, sbDisplay: cs.display,
        hasBrand: !!sb.querySelector('.sb-brand'), hasFoot: !!sb.querySelector('.sb-foot'),
        logoutInFoot: !!sb.querySelector('#logoutBtn'),
        menuCount: links.length,
        firstMenu: first ? first.textContent.trim() : null,
        firstColor: lc ? lc.color : null,
        firstBg: lc ? lc.backgroundColor : null,
        firstPadding: lc ? lc.padding : null,
        firstFont: lc ? lc.fontSize : null,
        activeMenu: active ? active.textContent.trim() : null,
        navPadding: nav ? getComputedStyle(nav).padding : null
      };
    });
    console.log(JSON.stringify(info));
  }
  await browser.close();
})();
