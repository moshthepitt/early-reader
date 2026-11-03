import * as C from '../data/en-content.js';
import * as session from '../session.js';
import * as texts from '../texts.js';
import * as P from '../print.js';
import { escapeHtml as h } from '../util.js';
import { state, ui, content, selectedChild, noKids, childPicker, stageBadge, siblingName, findChild, scrollAfterRender, notify } from '../ui.js';
import { printHtml } from './print.js';

function statusClass(s) {
  return { decodable: 'ok', tricky: 'ok tricky', name: 'ok name', 'tricky-untaught': 'bad', needs: 'bad', unlisted: 'maybe', unknown: 'bad', unsupported: 'bad' }[s] || '';
}

export function viewTexts(arg) {
  const c = selectedChild(arg);
  if (!c) return noKids();
  const sib = siblingName(c);
  const sounds = [...session.practiceSounds(c, content)];
  const tricky = session.trickyIntroduced(c);
  const sentences = session.readableSentences(c, content, sib);
  const stories = session.readableStories(c, content, sib);
  const storyList = stories
    .map(
      (st) => `<details class="book"><summary>${h(session.fillNames(st.title, c, sib))}</summary>
        <div class="story-lines">${st.lines.map((l) => `<p>${h(session.fillNames(l, c, sib))}</p>`).join('')}</div>
        <button class="btn small" data-action="print-story" data-id="${h(st.id)}" data-child="${h(c.id)}">Print booklet</button></details>`,
    )
    .join('');
  // Re-check on every render: what counts as readable changes as the child learns.
  const check = ui.textCheck && ui.textCheck.childId === c.id ? { raw: ui.textCheck.raw, lines: texts.checkPasted(ui.textCheck.raw, c, content, sib) } : null;
  const checkOut = check
    ? `<div class="check-out">${check.lines
        .map(
          ({ line, result }) =>
            `<p class="${result.ok ? 'line-ok' : 'line-bad'}">${result.tokens
              .map((t) => (t.kind === 'gap' ? h(t.raw) : `<span class="w ${statusClass(t.status)}" title="${h(texts.explainStatus(t))}">${h(t.raw)}</span>`))
              .join('')} ${result.ok ? '✓' : ''}</p>${
              result.ok
                ? ''
                : `<p class="muted small">${result.bad.map((t) => `<b>${h(t.raw)}</b>: ${h(texts.explainStatus(t))}`).join(' · ')}</p>`
            }`,
        )
        .join('')}
        <p class="muted small">Green: can sound out · blue: tricky word or name they know · yellow: not in the app's word list, so it can't be checked · red: not ready yet.</p>
        ${check.lines.every((l) => l.result.ok) ? `<button class="btn" data-action="print-checked" data-child="${h(c.id)}">Print as booklet</button>` : '<p>Swap or remove the red and yellow words, then check again.</p>'}
      </div>`
    : '';
  return `${childPicker('texts', c.id)}
    <section class="card">
      <h1>Practice texts for ${h(c.name)}</h1>
      ${stageBadge(c)}
      <p>Sounds used: <b>${sounds.length ? h(sounds.join(' ')) : 'none yet'}</b></p>
      <p>Tricky words: <b>${tricky.length ? h(tricky.join(', ')) : 'none yet'}</b></p>
      <p>Already checked: <b>${sentences.length}</b> sentences, <b>${stories.length}</b> stories.</p>
      ${c.stage < 3 ? '<p class="muted">Practice texts start at stage 3-4. Until then, keep reading aloud at story time.</p>' : ''}
    </section>
    ${storyList ? `<section class="card"><h2>Stories ${h(c.name)} can read</h2>${storyList}</section>` : ''}
    ${
      sentences.length
        ? `<section class="card"><h2>Sentences</h2><ul class="sentences">${sentences
            .slice(0, 40)
            .map((s) => `<li>${h(session.fillNames(s, c, sib))}</li>`)
            .join('')}</ul></section>`
        : ''
    }
    <form class="card" data-form="text-prompt" data-child="${h(c.id)}">
      <h2>Make a new text with AI</h2>
      <p>This makes a prompt for any AI chat tool. It lists the only words allowed. The app removes your children's names, including from the topic. The story uses {NAME}, which the app fills in on this device. Do not type other personal details into the topic.</p>
      <label>Type <select name="kind"><option value="story">Tiny story</option><option value="sentences">Separate sentences</option></select></label>
      <label>Topic (optional) <input name="topic" maxlength="120" placeholder="e.g. a dog at the park"></label>
      <button class="btn primary">Make prompt</button>
      ${ui.textPrompt ? `<textarea class="prompt-out" readonly rows="10">${h(ui.textPrompt)}</textarea><button type="button" class="btn" data-action="copy" data-target=".prompt-out">Copy</button>` : ''}
    </form>
    <form class="card" data-form="text-check" data-child="${h(c.id)}">
      <h2>Check a text</h2>
      <p>Paste what the AI wrote, or any other text. Every word is checked against what ${h(c.name)} has been taught. AI often breaks the rules, so always check.</p>
      <textarea name="text" rows="6" maxlength="5000">${check ? h(check.raw) : ''}</textarea>
      <button class="btn primary">Check</button>
      ${checkOut}
    </form>`;
}

export const actions = {
  'print-story': (el) => {
    const c = findChild(el.dataset.child);
    const st = C.STORIES.find((s) => s.id === el.dataset.id);
    const sib = siblingName(c);
    printHtml(P.storyBooklet(session.fillNames(st.title, c, sib), st.lines.map((l) => session.fillNames(l, c, sib))));
    return false;
  },
  'print-checked': (el) => {
    const c = findChild(el.dataset.child);
    const sib = siblingName(c);
    const checked = texts.checkPasted(ui.textCheck.raw, c, content, sib);
    if (!checked.length || !checked.every((l) => l.result.ok)) {
      alert('Some words no longer match the sounds or tricky words your child has been taught. Check the text again.');
      return;
    }
    const lines = checked.map((l) => session.fillNames(l.line, c, sib));
    const [title, ...rest] = lines.length > 2 ? lines : [`${c.name}'s story`, ...lines];
    printHtml(P.storyBooklet(title, rest));
    return false;
  },
};

export const forms = {
  'text-prompt': (f, data) => {
    const c = findChild(f.dataset.child);
    ui.textPrompt = texts.buildTextPrompt(c, content, { kind: data.get('kind'), lines: 5, topic: data.get('topic') || '', excludeNames: state.children.map((x) => x.name) });
    scrollAfterRender('[data-form="text-prompt"] .prompt-out');
  },
  'text-check': (f, data) => {
    const c = findChild(f.dataset.child);
    const raw = String(data.get('text') || '');
    if (!raw.trim()) return notify('Type or paste some text first.'), false;
    ui.textCheck = { childId: c.id, raw };
    scrollAfterRender('.check-out');
  },
};
