import { test } from 'node:test';
import assert from 'node:assert/strict';
import { renderMarkdown } from '../js/markdown.js';

test('renders the guide subset of Markdown', () => {
  const html = renderMarkdown('# Title\n\nSome **bold** and _soft_ text.\n\n- one\n- two\n\n1. first\n2. second\n\nSee [the report](research/report.md).', (href) => `https://x/${href}`);
  assert.match(html, /<h1>Title<\/h1>/);
  assert.match(html, /<b>bold<\/b>/);
  assert.match(html, /<i>soft<\/i>/);
  assert.match(html, /<ul><li>one<\/li><li>two<\/li><\/ul>/);
  assert.match(html, /<ol><li>first<\/li><li>second<\/li><\/ol>/);
  assert.match(html, /<a href="https:\/\/x\/research\/report.md"/);
});

test('escapes HTML and drops unsafe links', () => {
  const html = renderMarkdown('<img src=x onerror=alert(1)> [x](javascript:alert(1))');
  assert.ok(!html.includes('<img'));
  assert.ok(!html.includes('javascript:'));
});

test('every parent document renders with all its headings', async () => {
  const fs = await import('node:fs');
  for (const file of ['parents-guide.md', 'books.md']) {
    const md = fs.readFileSync(new URL(`../docs/${file}`, import.meta.url), 'utf8');
    const html = renderMarkdown(md);
    const headings = md.split('\n').filter((l) => /^#{1,4} /.test(l)).length;
    assert.equal((html.match(/<h[1-4]>/g) || []).length, headings, file);
  }
});

test('links to other app screens stay in the app', () => {
  const html = renderMarkdown('[How it works](how-it-works.md) and [the web](https://example.org)', (href) => (href === 'how-it-works.md' ? '#/how' : href));
  assert.match(html, /<a href="#\/how">How it works<\/a>/);
  assert.match(html, /<a href="https:\/\/example.org" target="_blank" rel="noopener">/);
});
