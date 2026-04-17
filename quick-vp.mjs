import puppeteer from 'puppeteer';
const browser = await puppeteer.launch({ headless: true, args: ['--no-sandbox'] });
const page = await browser.newPage();
await page.setViewport({ width: 1200, height: 800, deviceScaleFactor: 1 });
await page.goto(process.argv[2], { waitUntil: 'networkidle2' });
await page.evaluate(() => localStorage.setItem('charm-cookies-accepted', '1'));
await new Promise(r => setTimeout(r, 3000));
await page.screenshot({ path: process.argv[3], fullPage: false });
await browser.close();
