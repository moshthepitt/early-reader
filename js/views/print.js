import * as G from '../data/en.js';
import * as C from '../data/en-content.js';
import * as session from '../session.js';
import * as P from '../print.js';
import { escapeHtml as h } from '../util.js';
import { ui, content, selectedChild, childPicker, findChild, notify } from '../ui.js';

const printArea = document.getElementById('print-area');

export function viewPrint(arg) {
  const c = selectedChild(arg);
  const intro = c ? [...session.soundsIntroduced(c)] : [];
  const known = c ? [...session.soundsKnown(c)] : [];
  return `${c ? childPicker('print', c.id) : ''}
    <section class="card">
      <h1>Print</h1>
      <p>Cards and tiles for your child to hold. Print on card if you can. Cut along the lines.</p>
      ${c ? `<p>For <b>${h(c.name)}</b>: ${intro.length} ${intro.length === 1 ? 'letter' : 'letters'} met, ${known.length} known.</p>` : ''}
      <div class="print-btns">
        ${c ? `<button class="btn" data-action="print" data-what="letters-met" data-child="${h(c.id)}">Letter cards: letters met (${intro.length})</button>` : ''}
        ${c ? `<button class="btn" data-action="print" data-what="letters-next" data-child="${h(c.id)}">Letter cards: next 8 letters</button>` : ''}
        ${c ? `<button class="btn" data-action="print" data-what="letters-plain" data-child="${h(c.id)}">Letter cards without pictures: letters met (${intro.length})</button>` : ''}
        <button class="btn" data-action="print" data-what="letters-all">Letter cards: all</button>
        ${c ? `<button class="btn" data-action="print" data-what="tiles" data-child="${h(c.id)}">Letter tiles: letters met (${intro.length})</button>` : ''}
        <button class="btn" data-action="print" data-what="tiles-all">Letter tiles: all single letters</button>
        ${c ? `<button class="btn" data-action="print" data-what="words" data-child="${h(c.id)}">Word and picture cards they can read</button>` : ''}
        <button class="btn" data-action="print" data-what="tricky">Tricky word cards</button>
        ${c && c.name ? `<button class="btn" data-action="print" data-what="name" data-child="${h(c.id)}">Name card</button>` : ''}
        <button class="btn" data-action="print" data-what="chart">Sound chart (all sounds)</button>
      </div>
    </section>
    ${ui.printHtml ? `<section class="card"><h2>Preview</h2><button class="btn primary" data-action="print-again">Print this</button><div class="print-preview">${ui.printHtml}</div></section>` : ''}`;
}

export function printHtml(html) {
  ui.printHtml = html;
  printArea.innerHTML = html;
  setTimeout(() => window.print(), 50);
}

// Nothing to print: say so instead of opening the print dialog for an empty page.
const NONE_MET = { note: 'No letters met yet. Print "Letter cards: next 8 letters" instead.' };

function makePrint(what, childId) {
  const c = childId ? findChild(childId) : null;
  // At stage 1 the app teaches the letters in the child's name first, so "next 8" starts there too.
  const order = !c ? G.BASE_ORDER : c.stage <= 1 ? [...new Set([...session.nameGraphemes(c.name), ...session.teachingOrder(c)])] : session.teachingOrder(c);
  const intro = c ? [...session.soundsIntroduced(c)] : [];
  switch (what) {
    case 'letters-met':
      return intro.length ? P.letterCards(order.filter((g) => intro.includes(g))) : NONE_MET;
    case 'letters-next':
      return P.letterCards(order.filter((g) => !intro.includes(g)).slice(0, 8));
    case 'letters-plain':
      return intro.length ? P.letterCards(order.filter((g) => intro.includes(g)), { withPictures: false }) : NONE_MET;
    case 'letters-all':
      return P.letterCards(G.BASE_ORDER);
    case 'tiles':
      return intro.length ? P.tiles(order.filter((g) => intro.includes(g))) : { note: 'No letters met yet. Print "Letter tiles: all single letters" instead.' };
    case 'tiles-all':
      return P.tiles(G.SINGLE_LETTERS);
    case 'words': {
      const sounds = session.practiceSounds(c, content);
      const words = C.WORDS.filter((w) => w.pos !== 'name' && w.gs.every((g) => sounds.has(g)));
      return words.length ? P.wordCards([...words.filter((w) => w.emoji), ...words.filter((w) => !w.emoji)].slice(0, 24)) : { note: 'No words to print yet. Teach a few more letters first.' };
    }
    case 'tricky':
      return P.trickyCards();
    case 'name':
      return P.nameCard(c.name);
    case 'chart':
      return P.soundChart(G.BASE_ORDER);
    default:
      return '';
  }
}

export const actions = {
  print: (el) => {
    const out = makePrint(el.dataset.what, el.dataset.child);
    if (typeof out === 'object') return notify(out.note), false;
    printHtml(out);
  },
  'print-again': () => {
    printArea.innerHTML = ui.printHtml;
    window.print();
    return false;
  },
};
