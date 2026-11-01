// The parent documents in docs/ (guide, how it works, books), fetched when first
// opened and rendered from Markdown, so the app and the repository show the same text.
// The service worker keeps them for offline use.
import { ui, rerender } from './ui.js';
import { renderMarkdown } from './markdown.js';

export const REPO_DOCS = 'https://github.com/moshthepitt/early-reader/blob/main/docs/';

// Documents that have their own screen open there; anything else opens on GitHub.
const SCREENS = { 'parents-guide.md': '#/guide', 'how-it-works.md': '#/how', 'books.md': '#/story' };

function linkFor(href) {
  if (/^https?:\/\//.test(href)) return href;
  if (SCREENS[href]) return SCREENS[href];
  if (/^[\w./-]+\.md$/.test(href)) return REPO_DOCS + href;
  return null;
}

function load(file) {
  ui.docs[file] = { loading: true };
  fetch(`docs/${file}`)
    .then((res) => (res.ok ? res.text() : Promise.reject(new Error(String(res.status)))))
    .then((md) => {
      ui.docs[file] = { html: renderMarkdown(md, linkFor) };
    })
    .catch(() => {
      ui.docs[file] = { error: true };
    })
    .finally(() => rerender());
}

// HTML for one document, or a short placeholder while it loads.
export function docHtml(file, title) {
  ui.docs = ui.docs || {};
  if (!ui.docs[file]) load(file);
  const d = ui.docs[file];
  if (d.html) return d.html;
  if (d.error) {
    return `<p>Could not load this page. You can read it on GitHub: <a href="${REPO_DOCS}${file}" target="_blank" rel="noopener">${title}</a>.</p>`;
  }
  return '<p class="muted">Loading...</p>';
}
