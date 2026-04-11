import puppeteer from 'puppeteer';

const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1280, height: 900, deviceScaleFactor: 2 });
await page.goto('http://localhost:3005', { waitUntil: 'networkidle2' });
// Dismiss splash screen and scroll to portfolio
await page.evaluate(() => {
  const splash = document.getElementById('splash');
  if (splash) splash.style.display = 'none';
  const el = document.getElementById('portfolio');
  if (el) el.scrollIntoView();
});
await new Promise(r => setTimeout(r, 1500));
const el = await page.$('section.portfolio-section');
await el.screenshot({ path: '/Users/kyleairey/AireyAI/temporary screenshots/portfolio-section.png' });
await browser.close();
console.log('done');
