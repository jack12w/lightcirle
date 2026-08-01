const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe' });
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const logs = [];
  page.on('pageerror', e => logs.push('PAGEERROR: ' + e.message + ' | ' + (e.stack||'').split('\n').slice(0,4).join(' << ')));
  await page.goto('http://localhost:3000/product-detail.html?id=leggings-01', { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(1800);
  const info = await page.evaluate(() => {
    const strip = document.getElementById('thumbStrip');
    const wrap = document.querySelector('.pd-thumb-wrap');
    const items = strip ? strip.querySelectorAll('[data-idx]') : [];
    const justify = strip ? getComputedStyle(strip).justifyContent : null;
    let firstLeftGap = null, lastRightGap = null, wrapW = null;
    if (items.length && strip && wrap) {
      const sb = strip.getBoundingClientRect();
      const wb = wrap.getBoundingClientRect();
      const fb = items[0].getBoundingClientRect();
      const lb = items[items.length - 1].getBoundingClientRect();
      firstLeftGap = +(fb.left - sb.left).toFixed(1);
      lastRightGap = +(sb.right - lb.right).toFixed(1);
      wrapW = Math.round(wb.width);
    }
    return {
      hasStrip: !!strip, itemCount: items.length, justify,
      firstLeftGap, lastRightGap, wrapW,
      mainMediaExists: !!document.getElementById('mainMedia')
    };
  });
  console.log('THUMBS:', JSON.stringify(info));
  console.log('LOGS:', logs.length ? logs.join(' | ') : 'none');
  await page.screenshot({ path: '.workbuddy/verify-pd.png', fullPage: false });
  await browser.close();
})();
