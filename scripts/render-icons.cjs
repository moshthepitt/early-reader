// Render the home-screen icons from icons/icon-maskable.svg with headless Chromium,
// then shrink them with pngquant if it is installed.
// Usage: node scripts/render-icons.cjs   (set CHROME_PATH if Chromium is not in the Playwright cache)
const { chromium } = require('playwright-core');
const { execFileSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

const icons = path.resolve(__dirname, '../icons');
const svg = fs.readFileSync(path.join(icons, 'icon-maskable.svg'), 'utf8');

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
  for (const size of [192, 512]) {
    const page = await browser.newPage({ viewport: { width: size, height: size } });
    await page.setContent(`<body style="margin:0">${svg.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body>`);
    const out = path.join(icons, `icon-${size}.png`);
    await page.screenshot({ path: out });
    try {
      execFileSync('pngquant', ['--force', '--skip-if-larger', '--quality=80-100', '--output', out, out]);
    } catch {
      // pngquant is optional.
    }
    console.log(`${out} ${fs.statSync(out).size} bytes`);
  }
  await browser.close();
})();
