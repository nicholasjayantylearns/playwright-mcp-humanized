require('./patch').patchPlaywright();
const { chromium } = require('playwright-core');
(async () => {
  const browser = await chromium.launch({ headless: true, executablePath: '/opt/pw-browsers/chromium' }).catch(async () => chromium.launch({ headless: true }));
  const page = await browser.newPage();
  await page.setContent('<button id=b onclick="window.hit=(window.hit||0)+1">go</button><input id=i>');
  const moves = [];
  await page.exposeFunction('_m', (x,y)=>moves.push([x,y]));
  await page.evaluate(() => document.addEventListener('mousemove', e => window._m(e.clientX, e.clientY)));
  const t0 = Date.now();
  await page.locator('#b').click();
  await page.locator('#i').fill('humanized');
  const hit = await page.evaluate(() => window.hit);
  const val = await page.inputValue('#i');
  console.log('click registered:', hit === 1, '| fill ok:', val === 'humanized');
  console.log('mousemove samples during click (curved path => many):', moves.length, '| elapsed ms:', Date.now() - t0);
  await browser.close();
})().catch(e => { console.error('E2E FAIL', e.message); process.exit(1); });
