// Verify new thumbnail carousel UI: wrapper width = 370px (matches main image),
// arrows sit at strip inner edges (4px inset), no overflow past main image bounds.
const { chromium } = require('C:/Users/mi/.workbuddy/binaries/node/workspace/node_modules/playwright');

(async () => {
  const browser = await chromium.launch({
    executablePath: 'C:/Program Files/Google/Chrome/Application/chrome.exe',
    headless: true,
  });
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();

  // Pick a product with at least 3 images
  await page.goto('http://localhost:3000/product-detail.html?id=leggings-01', { waitUntil: 'domcontentloaded' });
  // The detail page renders via JS once /api/products/yp001 returns; wait for the wrapper.
  await page.waitForFunction(() => !!document.querySelector('.pd-thumb-wrap'), null, { timeout: 15000 });
  await page.waitForTimeout(500); // settle carousel images

  // Geometry
  const m = await page.evaluate(() => {
    const main = document.getElementById('mainMedia');
    const wrap = document.querySelector('.pd-thumb-wrap');
    const strip = document.getElementById('thumbStrip');
    const lArrow = document.querySelector('.thumb-arrow-left');
    const rArrow = document.querySelector('.thumb-arrow-right');
    const r = (el) => el ? el.getBoundingClientRect() : null;
    return {
      main: r(main), wrap: r(wrap), strip: r(strip),
      lArrow: r(lArrow), rArrow: r(rArrow),
      thumbCount: document.querySelectorAll('#thumbStrip .thumb-item').length,
    };
  });
  console.log(JSON.stringify(m, null, 2));

  // Logic check
  const mainW = m.main.width;
  const wrapW = m.wrap.width;
  const okWidthMatch = Math.abs(mainW - wrapW) < 1;
  const lInBounds = m.lArrow.left >= m.wrap.left - 1 && m.lArrow.right <= m.wrap.right + 1;
  const rInBounds = m.rArrow.right <= m.wrap.right + 1 && m.rArrow.left >= m.wrap.left - 1;
  console.log('main width:', mainW, 'wrap width:', wrapW, 'OK width match:', okWidthMatch);
  console.log('left arrow inside wrap bounds:', lInBounds, 'right arrow inside wrap bounds:', rInBounds);
  console.log('thumb count:', m.thumbCount);

  // Screenshot for visual confirmation (hovered state to reveal arrows)
  await page.hover('.pd-thumb-wrap');
  await page.waitForTimeout(200);
  await page.screenshot({ path: 'E:/个人学习/agent/yoga/yoga-b2b/.workbuddy/verify-thumbs.png', clip: { x: 0, y: 0, width: 600, height: 800 } });
  console.log('screenshot saved: .workbuddy/verify-thumbs.png');

  await browser.close();
})().catch((e) => { console.error('VERIFY_FAILED:', e.message); process.exit(1); });
