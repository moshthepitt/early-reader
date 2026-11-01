// Build the app for hosting into dist/.
//
// The page loads in four requests: index.html (styles and favicon inlined), app.js
// (every module bundled and minified), the web manifest and its icon. The service
// worker and the documents in docs/ load later, then everything works offline.
//
// Fails if the first load goes over budget, so the app stays light on mobile data.
// What a phone downloads is the gzipped size (GitHub Pages compresses text files).

import * as esbuild from 'esbuild';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import zlib from 'node:zlib';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const dist = path.join(root, 'dist');
const BUDGET = { requests: 4, gzipBytes: 50 * 1024, rawBytes: 120 * 1024 };
// ES2019 runs on Chrome 73 and Safari 12.1 (both 2019) and later, which covers the
// Android and iOS phones still in common use. Newer syntax is compiled down to it.
const TARGET = ['es2019'];

const read = (p) => fs.readFileSync(path.join(root, p), 'utf8');
const write = (p, data) => {
  fs.mkdirSync(path.dirname(path.join(dist, p)), { recursive: true });
  fs.writeFileSync(path.join(dist, p), data);
};
const copy = (p) => write(p, fs.readFileSync(path.join(root, p)));

fs.rmSync(dist, { recursive: true, force: true });

const js = await esbuild.build({
  entryPoints: [path.join(root, 'js/app.js')],
  bundle: true,
  minify: true,
  format: 'iife',
  target: TARGET,
  define: { __PROD__: 'true' },
  legalComments: 'none',
  // Keep emoji and accented letters as UTF-8 rather than \u escapes, which are about three
  // times longer. GitHub Pages serves scripts as UTF-8, and the page declares it too.
  charset: 'utf8',
  write: false,
});
const appJs = js.outputFiles[0].contents;

const css = await esbuild.build({
  entryPoints: [path.join(root, 'css/app.css')],
  minify: true,
  target: TARGET,
  write: false,
});
const appCss = css.outputFiles[0].text.trim();

const favicon = `data:image/svg+xml,${encodeURIComponent(read('icons/icon.svg').trim())}`;

let html = read('index.html');
const swap = (from, to) => {
  if (!html.includes(from)) throw new Error(`index.html no longer contains: ${from}`);
  html = html.replace(from, to);
};
swap('<link rel="stylesheet" href="css/app.css" />', `<style>${appCss}</style>`);
swap('<link rel="icon" href="icons/icon.svg" type="image/svg+xml" />', `<link rel="icon" href="${favicon}" type="image/svg+xml" />`);
swap('<script type="module" src="js/app.js"></script>', '<script defer src="app.js"></script>');
html = html.replace(/\n\s*/g, '\n').trim() + '\n';

write('index.html', html);
write('app.js', appJs);
const DOCS = ['docs/parents-guide.md', 'docs/how-it-works.md', 'docs/books.md'];
// The reading font loads after the page (see js/app.js), so it is not part of the first load.
const FONTS = ['fonts/er-letters-bold.woff2'];
for (const f of ['manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'fonts/OFL.txt', ...DOCS, ...FONTS]) copy(f);

// The service worker caches exactly what was built, under a version tied to its content.
const offline = ['./', './index.html', './app.js', './manifest.webmanifest', './icons/icon-192.png', './icons/icon-512.png', ...[...DOCS, ...FONTS].map((f) => `./${f}`)];
const hash = crypto.createHash('sha256');
for (const f of offline.slice(1)) hash.update(fs.readFileSync(path.join(dist, f)));
const version = hash.digest('hex').slice(0, 10);
let sw = read('sw.js');
sw = sw.replace(/const VERSION = .*;/, `const VERSION = \`\${PREFIX}${version}\`;`);
sw = sw.replace(/const FILES = \[[\s\S]*?\];/, `const FILES = ${JSON.stringify(offline)};`);
write('sw.js', sw);

// First load: the page, the script, the manifest and the icon the browser picks from it.
const firstLoad = ['index.html', 'app.js', 'manifest.webmanifest', 'icons/icon-192.png'];
const sizes = firstLoad.map((f) => {
  const buf = fs.readFileSync(path.join(dist, f));
  return { f, raw: buf.length, gzip: zlib.gzipSync(buf, { level: 9 }).length };
});
const total = sizes.reduce((a, s) => a + s.raw, 0);
const totalGz = sizes.reduce((a, s) => a + s.gzip, 0);
for (const s of sizes) console.log(`${s.f.padEnd(22)} ${kb(s.raw).padStart(8)} ${kb(s.gzip).padStart(8)} gzip`);
console.log(`${'first load'.padEnd(22)} ${kb(total).padStart(8)} ${kb(totalGz).padStart(8)} gzip, ${firstLoad.length} requests`);
const over = [];
if (firstLoad.length > BUDGET.requests) over.push(`${firstLoad.length} requests > ${BUDGET.requests}`);
if (totalGz > BUDGET.gzipBytes) over.push(`${kb(totalGz)} gzip > ${kb(BUDGET.gzipBytes)}`);
if (total > BUDGET.rawBytes) over.push(`${kb(total)} raw > ${kb(BUDGET.rawBytes)}`);
if (over.length) {
  console.error(`Over budget: ${over.join(', ')}`);
  process.exit(1);
}

function kb(n) {
  return `${(n / 1024).toFixed(1)} KB`;
}
