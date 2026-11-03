// Render the link preview image (images/share-card.png) from images/share-card.html
// with headless Chromium, then shrink it with pngquant if it is installed.
// Usage: node scripts/render-share-card.cjs   (set CHROME_PATH if Chromium is not in the Playwright cache)
const { chromium } = require('playwright-core');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

const images = path.resolve(__dirname, '../images');

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const dirs = fs.existsSync(cache) ? fs.readdirSync(cache).filter((d) => /^chromium-\d+$/.test(d)).sort().reverse() : [];
  const exe = dirs.map((d) => path.join(cache, d, 'chrome-linux64/chrome')).find((f) => fs.existsSync(f));
  if (!exe) throw new Error('Chromium not found. Set CHROME_PATH.');
  return exe;
}

(async () => {
  const browser = await chromium.launch({ executablePath: chromePath() });
  const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
  await page.goto(pathToFileURL(path.join(images, 'share-card.html')).href);
  await page.evaluate(() => document.fonts.ready);
  const loaded = await page.evaluate(() => document.fonts.check('700 40px "ER Letters"'));
  if (!loaded) throw new Error('The ER Letters font did not load.');
  const out = path.join(images, 'share-card.png');
  await page.screenshot({ path: out });
  await browser.close();
  try {
    execFileSync('pngquant', ['--force', '--skip-if-larger', '--quality=80-100', '--output', out, out]);
  } catch {
    // pngquant is optional.
  }
  console.log(`${out} ${fs.statSync(out).size} bytes`);
})();
