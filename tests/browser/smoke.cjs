// Browser smoke test. `npm run test:browser` runs it against the built app in dist/
// (run `npm run build` first); pass another folder to test the source instead.
const { chromium } = require('playwright-core');
const assert = require('node:assert/strict');
const path = require('node:path');
const fs = require('node:fs');
const http = require('node:http');
const os = require('node:os');

const repo = path.resolve(__dirname, '../..');
const root = path.resolve(repo, process.argv[2] || '.');
const out = path.join(repo, '.tmp/browser');
const BUILT = fs.existsSync(path.join(root, 'app.js'));
const errors = [];
const checks = [];
const summary = { checks, errors };

function check(name, passed, detail) {
  checks.push({ name, passed: !!passed });
  if (!passed) errors.push(name + (detail ? ': ' + JSON.stringify(detail) : ''));
}

function chromePath() {
  if (process.env.CHROME_PATH) return process.env.CHROME_PATH;
  const cache = path.join(os.homedir(), '.cache/ms-playwright');
  const candidates = fs.existsSync(cache) ? fs.readdirSync(cache)
    .filter((name) => /^chromium-\d+$/.test(name))
    .sort((a, b) => Number(b.slice(9)) - Number(a.slice(9)))
    .map((name) => path.join(cache, name, 'chrome-linux64/chrome')) : [];
  const exe = candidates.find((file) => fs.existsSync(file));
  if (!exe) throw new Error('Chromium not found. Set CHROME_PATH or install Playwright Chromium.');
  return exe;
}

function staticServer() {
  const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css',
    '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.svg': 'image/svg+xml',
    '.png': 'image/png', '.md': 'text/markdown; charset=utf-8' };
  return http.createServer(async (req, res) => {
    try {
      const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
      const file = path.resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
      if (!file.startsWith(root + path.sep)) {
        res.writeHead(403).end();
        return;
      }
      const data = await fs.promises.readFile(file);
      res.writeHead(200, { 'Content-Type': types[path.extname(file)] || 'application/octet-stream' });
      res.end(data);
    } catch (err) {
      res.writeHead(err.code === 'ENOENT' ? 404 : 500).end();
    }
  });
}

// A fresh visitor on a small Android phone and on a desktop screen: count what the
// first load fetches, check no screen scrolls sideways, then check the app opens offline.
async function firstLoadAndScreens(browser, base) {
  const screens = ['today', 'story', 'texts', 'progress', 'print', 'sounds', 'how', 'guide', 'kids', 'settings'];
  for (const [label, viewport] of [['phone', { width: 360, height: 640 }], ['desktop', { width: 1280, height: 800 }]]) {
    const ctx = await browser.newContext({ viewport, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push(`${label} pageerror: ${e.message}`));
    const requests = [];
    page.on('response', async (res) => {
      if (!res.url().startsWith(base)) return;
      const entry = { url: res.url().slice(base.length), bytes: 0, beforeLoad: !loaded };
      requests.push(entry);
      try { entry.bytes = (await res.body()).length; } catch { entry.bytes = 0; }
    });
    let loaded = false;
    await page.goto(base + '/', { waitUntil: 'load' });
    loaded = true;
    await page.waitForLoadState('networkidle');
    if (label === 'phone' && BUILT) {
      const first = requests.filter((r) => r.beforeLoad);
      const bytes = first.reduce((a, r) => a + r.bytes, 0);
      summary.firstLoad = { requests: first.map((r) => `${r.url} ${(r.bytes / 1024).toFixed(1)} KB`), totalKB: +(bytes / 1024).toFixed(1) };
      check('first load: at most 4 requests', first.length <= 4, first.map((r) => r.url));
      check('first load: under 120 KB before compression', bytes <= 120 * 1024, { bytes });
    }
    await page.evaluate(() => {
      localStorage.setItem('early-reader-v1', JSON.stringify({ rev: 1, children: [{ id: 'abcd1234', name: 'Wanjiru', stage: 3, birth: '2022-05' }, { id: 'efgh5678', name: 'Otieno', stage: 1 }] }));
    });
    await page.reload({ waitUntil: 'load' });
    for (const screen of screens) {
      await page.goto(`${base}/#/${screen}`);
      await page.waitForTimeout(150);
      const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      check(`${label}: ${screen} fits the screen width`, over <= 1, { over });
    }
    await page.goto(`${base}/#/today`);
    await page.screenshot({ path: path.join(out, `90-${label}-today.png`), fullPage: true });
    await page.click('a.btn.primary.big');
    await page.click('[data-action="burst-start"][data-variant="cards"]');
    await page.screenshot({ path: path.join(out, `91-${label}-burst.png`) });
    const over = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
    check(`${label}: burst fits the screen width`, over <= 1, { over });
    if (label === 'phone' && BUILT) {
      await page.evaluate(() => navigator.serviceWorker && navigator.serviceWorker.ready);
      await page.waitForTimeout(500);
      await ctx.setOffline(true);
      await page.goto(`${base}/#/guide`);
      await page.waitForSelector('.guide h1', { timeout: 5000 }).catch(() => {});
      check('works offline after the first visit (guide included)', (await page.locator('.guide h1').count()) === 1);
      await ctx.setOffline(false);
    }
    await ctx.close();
  }
}

(async () => {
  let browser;
  let server;
  try {
    fs.mkdirSync(out, { recursive: true });
    server = staticServer();
    await new Promise((resolve, reject) => {
      server.once('error', reject);
      server.listen(0, '127.0.0.1', resolve);
    });
    const base = `http://127.0.0.1:${server.address().port}`;
    browser = await chromium.launch({ executablePath: chromePath() });
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 });
    await ctx.addInitScript(() => { window.print = () => { window.__printed = (window.__printed || 0) + 1; }; window.confirm = () => true; window.alert = () => {}; });
    const page = await ctx.newPage();
    page.on('pageerror', (e) => errors.push('pageerror: ' + e.message));
    page.on('console', (m) => { if (m.type() === 'error') errors.push('console: ' + m.text()); });
    const shot = (n) => page.screenshot({ path: path.join(out, n + '.png'), fullPage: true });

    await page.goto(base + '/index.html');
    await page.waitForSelector('form[data-form="add-child"]');
    check('first visit opens Kids', await page.locator('form[data-form="add-child"]').isVisible());
    await shot('01-kids-empty');
    const add = async (name, birth, stage) => {
      await page.goto(base + '/index.html#/kids');
      await page.fill('form[data-form="add-child"] input[name="name"]', name);
      await page.fill('form[data-form="add-child"] input[name="birth"]', birth);
      await page.selectOption('form[data-form="add-child"] select[name="stage"]', String(stage));
      await page.click('form[data-form="add-child"] button.btn.primary');
      await page.waitForSelector('.card.kid');
    };
    await add('Kim', '2023-02', 1);
    await add('Ben', '2022-04', 2);
    await shot('02-today');

    const letterChecks = [];
    const runBurst = async (childIdx, variant, shotPrefix, rightPattern = [1]) => {
      await page.goto(base + '/index.html#/today');
      const links = await page.$$('a.btn.primary.big');
      await links[childIdx].click();
      await page.waitForSelector('[data-action="burst-start"]');
      if (shotPrefix) await shot(shotPrefix + '-choose');
      await page.click(`[data-action="burst-start"][data-variant="${variant}"]`);
      let n = 0;
      for (let guard = 0; guard < 30; guard++) {
        if (await page.$('[data-action="mood"]')) break;
        if (shotPrefix) await shot(`${shotPrefix}-step${String(n).padStart(2, '0')}`);
        const reveal = await page.$('[data-action="reveal"]');
        if (reveal) await reveal.click();
        const ans = await page.$$('[data-action="answer"]');
        if (ans.length) {
          const right = rightPattern[n % rightPattern.length];
          const isLetter = (await page.textContent('.burst-top b')) === 'What sound?';
          const pic = () => page.$('.child-card .big-emoji').then(Boolean);
          const rec = isLetter ? { before: await pic(), after: null } : null;
          await page.click(`[data-action="answer"][data-correct="${right}"]`);
          if (rec && !right) rec.after = await pic();
          if (rec) letterChecks.push(rec);
          if (!right && shotPrefix) await shot(`${shotPrefix}-step${String(n).padStart(2, '0')}-model`);
          if (!right) await page.click('[data-action="next"]');
        } else {
          const finishNow = await page.$('[data-action="keep-going"]');
          if (finishNow) await finishNow.click();
          await page.click('[data-action="next"]');
        }
        n++;
      }
      assert.ok(await page.$('[data-action="mood"]'), 'burst did not finish within 30 steps');
      check('burst completed: ' + (shotPrefix || variant), n >= 2 && n <= 6, { n });
      if (shotPrefix) await shot(shotPrefix + '-done');
      await page.click('[data-action="mood"][data-mood="keen"]');
      return n;
    };

    const n1 = await runBurst(0, 'cards', '10-kim');
    const n2 = await runBurst(1, 'cards', '20-ben');
    // A few more bursts for Ben, one with misses
    await runBurst(1, 'tiles', '30-ben-tiles', [0, 1]); // opens with a letter check
    for (let i = 0; i < 3; i++) await runBurst(1, i % 2 ? 'tiles' : 'cards', null);
    const modelled = letterChecks.filter((r) => r.after !== null);
    check('scored letter checks show the letter alone', letterChecks.length > 0 && letterChecks.every((r) => !r.before), { n: letterChecks.length });
    check('the model after a miss shows the picture', modelled.length > 0 && modelled.every((r) => r.after), { n: modelled.length });
    // Stop button path
    await page.goto(base + '/index.html#/today');
    await (await page.$$('a.btn.primary.big'))[0].click();
    await page.click('[data-action="burst-start"][data-variant="tiles"]');
    await page.click('[data-action="stop"]');
    await shot('40-stop-finish');
    await page.click('[data-action="next"]');
    await page.waitForSelector('[data-action="mood"]');
    await page.click('[data-action="mood"][data-mood="low"]');

    // Fast-forward Ben's data to stage 3 and 4 via the debug handle to see later stages
    await page.evaluate(() => {
      const st = window.earlyReader.state;
      const ben = st.children[1];
      const letters = ['s', 'a', 't', 'm', 'i', 'n', 'p', 'o', 'd', 'f', 'l', 'e', 'g', 'c'];
      for (const g of letters) {
        ben.items['sound:' + g] = { id: 'sound:' + g, kind: 'sound', key: g, box: 3, due: '2026-01-01', introduced: '2025-12-01', lastSeen: '2025-12-20', goodDays: ['2025-12-01', '2025-12-02', '2025-12-05'], attempts: 4, firstTryCorrect: 4, lastResult: true };
      }
      ben.stage = 3;
      localStorage.setItem('early-reader-v1', JSON.stringify(st));
    });
    await page.reload();
    await runBurst(1, 'tiles', '50-ben-s3');
    await page.evaluate(() => {
      const st = JSON.parse(localStorage.getItem('early-reader-v1'));
      st.children[1].stage = 4;
      localStorage.setItem('early-reader-v1', JSON.stringify(st));
    });
    await page.reload();
    await runBurst(1, 'cards', '60-ben-s4');

    for (const tab of ['today', 'progress', 'story', 'texts', 'print', 'sounds', 'how', 'guide', 'kids', 'settings']) {
      await page.goto(base + '/index.html#/' + tab);
      await page.waitForFunction((tab) => document.querySelector('nav a.on')?.getAttribute('href') === '#/' + tab, tab);
      check('screen renders: ' + tab, (await page.locator('main').innerText()).trim().length > 0);
      await shot('70-' + tab);
    }
    // Buttons that change nothing visible still confirm they worked
    await page.goto(base + '/index.html#/kids');
    await page.click('form[data-form="edit-child"] button.btn.primary');
    await page.waitForSelector('#toast.show');
    check('saving a child shows a confirmation', (await page.locator('#toast').innerText()).startsWith('Saved'));
    await page.goto(base + '/index.html#/settings');
    await page.click('form[data-form="settings"] button.btn.primary');
    check('saving settings shows a confirmation', (await page.locator('#toast').innerText()) === 'Settings saved.');
    // Emoji survive the build (the bundle is plain UTF-8, so a wrong charset would garble them)
    await page.goto(base + '/index.html#/sounds');
    check('letter pictures survive the build', (await page.locator('main').innerText()).includes('\u{1F40D}'));
    // Every screen says where the data lives
    check('footer says data stays on the device', (await page.locator('footer.foot').innerText()).includes('no server'));
    // How it works and the book list render from docs/
    await page.goto(base + '/index.html#/how');
    await page.waitForSelector('.how h1');
    check('how it works renders', (await page.locator('.how h1').innerText()).includes('How Early Reader works'));
    await page.goto(base + '/index.html#/story');
    await page.waitForSelector('.books h1, .books h2');
    check('story time lists books to read aloud', (await page.locator('.books li').count()) >= 6);
    // The guide renders from docs/parents-guide.md
    await page.goto(base + '/index.html#/guide');
    await page.waitForSelector('.guide h1');
    check('guide renders from markdown', (await page.locator('.guide h1').innerText()).includes("parent's guide"));
    check('guide links to the research report on GitHub', (await page.locator('.guide a[href*="github.com"]').count()) > 0);
    // Progress for Ben
    const benId = await page.evaluate(() => window.earlyReader.state.children[1].id);
    await page.goto(base + '/index.html#/progress/' + benId);
    await shot('71-progress-ben');
    // Texts: prompt + check
    await page.goto(base + '/index.html#/texts/' + benId);
    await page.click('form[data-form="text-prompt"] button.btn.primary');
    await page.waitForSelector('textarea.prompt-out');
    const prompt = await page.$eval('textarea.prompt-out', (t) => t.value);
    check('text prompt generated', prompt.length > 0);
    fs.writeFileSync(path.join(out, 'text-prompt.txt'), prompt);
    await page.fill('form[data-form="text-check"] textarea[name="text"]', 'Sam and the Cat\nThe cat sat on a mat.\nA dog ran to the park.\nBen can see a big ship.');
    await page.click('form[data-form="text-check"] button.btn.primary');
    check('text checker flags unready words', await page.locator('.check-out .bad').count() > 0);
    await shot('72-texts-check');
    // Story prompt
    await page.goto(base + '/index.html#/story');
    await page.fill('form[data-form="book-prompt"] input[name="title"]', 'The Very Hungry Caterpillar');
    await page.click('form[data-form="book-prompt"] button.btn.primary');
    await page.waitForSelector('textarea.prompt-out');
    check('book prompt generated', (await page.locator('textarea.prompt-out').inputValue()).includes('The Very Hungry Caterpillar'));
    await shot('73-story-prompt');
    // Print
    await page.goto(base + '/index.html#/print/' + benId);
    await page.click('[data-action="print"][data-what="letters-met"]');
    await page.waitForFunction(() => window.__printed >= 1);
    await shot('74-print-letters');
    await page.emulateMedia({ media: 'print' });
    await page.pdf({ path: path.join(out, 'print-letters.pdf') });
    await page.emulateMedia({ media: 'screen' });
    await page.click('[data-action="print"][data-what="words"]');
    await page.waitForFunction(() => window.__printed >= 2);
    await shot('75-print-words');
    // Interrupted burst is logged
    await page.goto(base + '/index.html#/today');
    const before = await page.evaluate(() => window.earlyReader.state.children[0].bursts.length);
    await (await page.$$('a.btn.primary.big'))[0].click();
    await page.click('[data-action="burst-start"][data-variant="cards"]');
    if (await page.$('[data-action="answer"]')) await page.click('[data-action="answer"][data-correct="1"]');
    else await page.click('[data-action="next"]');
    await page.goto(base + '/index.html#/print');
    const after = await page.evaluate(() => { const b = window.earlyReader.state.children[0].bursts; return { n: b.length, last: b[b.length - 1] }; });
    check('interrupted burst logged', after.n === before + 1 && after.last.interrupted, after);

    // Hostile backup import
    const payload = '<img src=x onerror="window.__xss=1">';
    const evil = { app: 'early-reader', state: { children: [{ name: 'Zed' + payload, stage: payload, birth: payload, items: { x: { kind: 'sound', key: payload } }, skills: { rhyme: { attempts: payload, correct: 1, goodDays: [], recent: [] } } }], books: [{ title: payload, notes: payload }] } };
    const evilPath = path.join(out, 'evil-backup.json');
    fs.writeFileSync(evilPath, JSON.stringify(evil));
    await page.goto(base + '/index.html#/settings');
    await page.setInputFiles('input[data-change="import"]', evilPath);
    await page.waitForFunction(() => window.earlyReader.state.children[0]?.name.startsWith('Zed'));
    for (const tab of ['today', 'progress', 'story', 'texts', 'print', 'kids']) {
      await page.goto(base + '/index.html#/' + tab);
      await page.waitForFunction((tab) => document.querySelector('nav a.on')?.getAttribute('href') === '#/' + tab, tab);
    }
    await shot('80-after-evil-import');
    const xss = await page.evaluate(() => window.__xss || 0);
    check('hostile backup cannot execute script', xss === 0);
    const importedStage = await page.evaluate(() => window.earlyReader.state.children[0].stage);
    // Undo the import
    await page.goto(base + '/index.html#/settings');
    const hasUndo = !!(await page.$('[data-action="undo-replace"]'));
    if (hasUndo) await page.click('[data-action="undo-replace"]');
    const restored = await page.evaluate(() => window.earlyReader.state.children.map((c) => c.name));
    check('imported stage sanitized', importedStage === 1, { importedStage });
    check('backup import can be undone', hasUndo && restored.join(',') === 'Kim,Ben', { hasUndo, restored });
    summary.import = { xss, importedStage, hasUndo, restored };

    await firstLoadAndScreens(browser, base);

    const printed = await page.evaluate(() => window.__printed || 0);
    const state = await page.evaluate(() => window.earlyReader.state);
    fs.writeFileSync(path.join(out, 'state.json'), JSON.stringify(state, null, 2));
    check('print actions invoke printing', printed >= 2, { printed });
    check('both children restored with burst history', state.children.length === 2 && state.children.every((c) => c.bursts.length > 0));
    Object.assign(summary, { stepsKim: n1, stepsBen: n2, printed, kids: state.children.map((c) => ({ name: c.name, stage: c.stage, items: Object.keys(c.items).length, bursts: c.bursts.length })) });
  } catch (err) {
    errors.push(err.stack || String(err));
  } finally {
    if (browser) {
      try { await browser.close(); } catch (err) { errors.push('browser cleanup: ' + err.message); }
    }
    if (server) {
      await new Promise((resolve) => {
        server.close(resolve);
        server.closeAllConnections();
      });
    }
    console.log(JSON.stringify(summary, null, 2));
    if (errors.length) process.exitCode = 1;
  }
})();
