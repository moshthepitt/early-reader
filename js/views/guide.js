// The parent guide, rendered from docs/parents-guide.md so the app and the
// repository show the same text.
import { ui, rerender } from '../ui.js';
import { renderMarkdown } from '../markdown.js';

const REPO = 'https://github.com/moshthepitt/early-reader/blob/main/docs/';

// Links in the guide are relative to docs/ on GitHub.
function linkFor(href) {
  if (/^https?:\/\//.test(href)) return href;
  if (/^[\w./-]+\.md$/.test(href)) return REPO + href;
  return null;
}

function load() {
  ui.guide = { loading: true };
  fetch('docs/parents-guide.md')
    .then((res) => (res.ok ? res.text() : Promise.reject(new Error(res.status))))
    .then((md) => {
      ui.guide = { html: renderMarkdown(md, linkFor) };
    })
    .catch(() => {
      ui.guide = { error: true };
    })
    .finally(() => {
      if (location.hash.startsWith('#/guide')) rerender();
    });
}

export function viewGuide() {
  if (!ui.guide) load();
  if (ui.guide.html) return `<section class="card prose guide">${ui.guide.html}</section>`;
  if (ui.guide.error) {
    return `<section class="card"><p>Could not load the guide. It is also on GitHub: <a href="${REPO}parents-guide.md" target="_blank" rel="noopener">A parent's guide to Early Reader</a>.</p></section>`;
  }
  return '<section class="card"><p>Loading the guide...</p></section>';
}

export const actions = {};
export const forms = {};
