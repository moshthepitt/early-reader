// Print cards, tiles and booklets for practice away from the screen.
// Pencil was better than stylus for letter learning in kindergartners (Mayer et al. 2020).
// Print books prompted more back-and-forth talk than e-books (Munzer et al. 2019).

import { GRAPHEME_MAP, VOWELS, TRICKY_WORDS } from './data/en.js';
import { escapeHtml } from './util.js';

function page(title, body, cls = '') {
  return `<section class="print-page ${cls}"><h2 class="print-title">${escapeHtml(title)}</h2>${body}</section>`;
}

export function letterCards(graphemes, { withPictures = true } = {}) {
  const cards = graphemes
    .map((g) => {
      const x = GRAPHEME_MAP[g];
      return `<div class="card letter-card${VOWELS.includes(g) ? ' vowel' : ''}">
        <div class="card-letter">${escapeHtml(g)}</div>
        ${withPictures ? `<div class="card-pic">${x.emoji}</div><div class="card-key">${escapeHtml(x.keyword)}</div>` : ''}
      </div>`;
    })
    .join('');
  return page(withPictures ? 'Letter cards (with pictures)' : 'Letter cards (without pictures, for letters they know)', `<div class="card-grid">${cards}</div>`);
}

export function wordCards(words) {
  const cards = words
    .map(
      (w) => `<div class="card word-card"><div class="card-word">${w.gs.map((g) => `<span class="${VOWELS.includes(g) ? 'v' : ''}">${escapeHtml(g)}</span>`).join('')}</div></div>`,
    )
    .join('');
  const pics = words
    .filter((w) => w.emoji)
    .map((w) => `<div class="card pic-card"><div class="card-pic big">${w.emoji}</div></div>`)
    .join('');
  return (
    page('Word cards (cut out and match each word to its picture)', `<div class="card-grid words">${cards}</div>`) +
    (pics ? page('Picture cards', `<div class="card-grid">${pics}</div>`) : '')
  );
}

export function tiles(graphemes) {
  // Vowels appear in more words, so print more of them.
  const list = graphemes.flatMap((g) => (VOWELS.includes(g) ? [g, g, g, g] : [g, g]));
  const cells = list.map((g) => `<div class="tile${VOWELS.includes(g) ? ' vowel' : ''}">${escapeHtml(g)}</div>`).join('');
  return page('Letter tiles (cut out - vowels are coloured)', `<div class="tile-grid">${cells}</div>`);
}

export function trickyCards(words = TRICKY_WORDS) {
  const cards = words.map((w) => `<div class="card tricky-card"><div class="card-word">${escapeHtml(w)}</div><div class="card-key">tricky word</div></div>`).join('');
  return page('Tricky word cards', `<div class="card-grid words">${cards}</div>`);
}

export function nameCard(name) {
  return page('Name card', `<div class="name-card">${escapeHtml(name)}</div><p class="print-note">Stick it on their door, chair or cup. Point to it often.</p>`);
}

export function storyBooklet(title, lines) {
  const pages = lines.map((l, i) => `<div class="booklet-page"><div class="booklet-text">${escapeHtml(l)}</div><div class="booklet-draw">Draw the picture</div><div class="booklet-n">${i + 1}</div></div>`).join('');
  return page(title, `<div class="booklet">${pages}</div><p class="print-note">Cut along the lines and staple. Let your child draw the pictures.</p>`, 'booklet-sheet');
}

export function soundChart(graphemes) {
  const rows = graphemes
    .map((g) => {
      const x = GRAPHEME_MAP[g];
      return `<div class="chart-cell"><span class="chart-letter">${escapeHtml(g)}</span><span class="chart-pic">${x.emoji}</span><span class="chart-say">${escapeHtml(x.say)}</span></div>`;
    })
    .join('');
  return page('Sound chart', `<div class="chart">${rows}</div>`);
}
