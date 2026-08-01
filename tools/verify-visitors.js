// Snapshot visitors.html stats cards
const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const login = await page.evaluate(async () => {
    const r = await fetch('http://localhost:3000/api/auth/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: 'admin', password: 'admin123' }) });
    return (await r.json()).token;
  });
  await ctx.addInitScript(t => localStorage.setItem('token', t), login);
  await page.goto('http://localhost:3000/admin/visitors.html', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1500);
  const info = await page.evaluate(() => {
    const cards = [...document.querySelectorAll('.stat-card')];
    return {
      count: cards.length,
      firstBg: cards[0] ? getComputedStyle(cards[0]).backgroundColor : null,
      parentClass: cards[0] ? cards[0].parentElement.className : null,
      parentDisplay: cards[0] ? getComputedStyle(cards[0].parentElement).display : null,
      parentGap: cards[0] ? getComputedStyle(cards[0].parentElement).gap : null
    };
  });
  console.log(JSON.stringify(info, null, 2));
  await page.screenshot({ path: '.workbuddy/verify-visitors-stats.png', fullPage: false });
  await browser.close();
})();
