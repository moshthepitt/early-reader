// A small Markdown renderer for the documents in docs/: headings, paragraphs, lists,
// bold, italics, inline code and links. Text is escaped before any formatting,
// so the output is safe to put in innerHTML.

import { escapeHtml as h } from './util.js';

function inline(text, linkFor) {
  let s = h(text);
  s = s.replace(/`([^`]+)`/g, '<code>$1</code>');
  s = s.replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');
  s = s.replace(/(^|[\s(])_([^_]+)_(?=[\s).,!?]|$)/g, '$1<i>$2</i>');
  s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (m, label, href) => {
    const url = linkFor(href.replace(/&amp;/g, '&'));
    if (!url) return label;
    // Links to other screens (#/how) stay in the app; web links open in a new tab.
    return url.startsWith('#/') ? `<a href="${h(url)}">${label}</a>` : `<a href="${h(url)}" target="_blank" rel="noopener">${label}</a>`;
  });
  return s;
}

// linkFor(href) returns the URL to use, or null to drop the link.
export function renderMarkdown(md, linkFor = (href) => (/^https?:\/\//.test(href) ? href : null)) {
  const out = [];
  let para = [];
  let list = null;
  const flushPara = () => {
    if (para.length) out.push(`<p>${inline(para.join(' '), linkFor)}</p>`);
    para = [];
  };
  const flushList = () => {
    if (list) out.push(`<${list.tag}>${list.items.map((i) => `<li>${inline(i, linkFor)}</li>`).join('')}</${list.tag}>`);
    list = null;
  };
  for (const raw of md.split('\n')) {
    const line = raw.trimEnd();
    const heading = line.match(/^(#{1,4})\s+(.*)$/);
    const bullet = line.match(/^\s*[-*]\s+(.*)$/);
    const numbered = line.match(/^\s*\d+\.\s+(.*)$/);
    if (heading) {
      flushPara();
      flushList();
      const level = heading[1].length;
      out.push(`<h${level}>${inline(heading[2], linkFor)}</h${level}>`);
    } else if (bullet || numbered) {
      flushPara();
      const tag = bullet ? 'ul' : 'ol';
      if (list && list.tag !== tag) flushList();
      if (!list) list = { tag, items: [] };
      list.items.push((bullet || numbered)[1]);
    } else if (!line.trim()) {
      flushPara();
      flushList();
    } else if (list && /^\s{2,}/.test(raw)) {
      list.items[list.items.length - 1] += ` ${line.trim()}`;
    } else {
      flushList();
      para.push(line.trim());
    }
  }
  flushPara();
  flushList();
  return out.join('\n');
}
