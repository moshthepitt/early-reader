import * as G from '../data/en.js';
import * as session from '../session.js';
import { escapeHtml as h, makeRng } from '../util.js';
import { GAMES, FACES } from '../icons.js';
import { state, burst, setBurst, content, today, siblingName, findChild, noKids, stageBadge, persist, keepData, scrollAfterRender } from '../ui.js';

export function viewBurst(id) {
  const c = findChild(id);
  // An old link to a child who has since been deleted or replaced by an import.
  if (!c) return state.children.length ? '<section class="card"><p>That child is no longer on this device.</p><a class="btn primary" href="#/today">Go to Today</a></section>' : noKids();
  if (!burst || burst.childId !== c.id) setBurst({ childId: c.id, phase: 'choose' });

  if (burst.phase === 'choose') {
    // Stage 1 uses neither cards nor tiles, so there is nothing honest to choose.
    const stage = c.stage || 1;
    const start =
      stage <= 1
        ? `<p>Sound games and letters from ${h(c.name)}'s name today.</p>
      <div class="choose"><button class="choice-btn" data-action="burst-start" data-variant="cards">Start</button></div>`
        : `<p>Let ${h(c.name)} choose the game:</p>
      <div class="choose">
        <button class="choice-btn" data-action="burst-start" data-variant="cards">${GAMES.cards}Card game</button>
        <button class="choice-btn" data-action="burst-start" data-variant="tiles">${GAMES.tiles}Tile game</button>
      </div>
      <p class="muted small">${stage === 2 ? 'Have letter cards or tiles ready from the Print tab.' : 'Card game: letter cards and words to read. Tile game: read, then build a word with letter tiles.'}</p>`;
    return `<section class="card">
      <h1>${h(c.name)}'s burst</h1>
      ${stageBadge(c)}
      ${start}
      <p class="muted small">A burst takes about 2-3 minutes. Stop any time.</p>
      <a class="btn ghost" href="#/today">Back</a>
    </section>`;
  }

  if (burst.phase === 'done') {
    const b = burst.record;
    return `<section class="card banded">
      <h1>Done!</h1>
      <p>${b.scored ? `${b.correct} of ${b.scored} right first try.` : 'Practice finished.'} ${b.stoppedEarly ? 'You stopped early. That is fine.' : ''}</p>
      ${
        burst.moodSaved
          ? '<p>Saved.</p>'
          : `<p>How did that feel for ${h(c.name)}?</p>
        <div class="choose three">
          <button class="choice-btn" data-action="mood" data-mood="keen">${FACES.keen}Keen</button>
          <button class="choice-btn" data-action="mood" data-mood="ok">${FACES.ok}OK</button>
          <button class="choice-btn" data-action="mood" data-mood="low">${FACES.low}Not today</button>
        </div>`
      }
      <p class="muted">Leave a gap before the next burst later today.</p>
      <a class="btn primary" href="#/today">Back to today</a>
    </section>`;
  }

  const step = burst.plan.steps[burst.index];
  const total = burst.plan.steps.length;
  const stepNo = `${burst.index + 1} / ${total}`;
  const beads = burst.plan.steps.map((s, i) => `<i class="${i < burst.index ? 'done' : i === burst.index ? 'now' : ''}"></i>`).join('');
  const offer = burst.offerFinish
    ? `<div class="notice">Two misses in a row. Finish on an easy one now?
        <div class="row"><button class="btn" data-action="finish-now">Finish now</button><button class="btn ghost" data-action="keep-going">Keep going</button></div></div>`
    : '';

  let controls;
  if (burst.phase === 'model') {
    controls = `<div class="model"><b>Show them:</b><ul>${(step.model || []).map((l) => `<li>${h(l)}</li>`).join('')}</ul><p class="muted small">Say: "${h(session.praise('effort'))}"</p></div>
      <button class="btn primary big" data-action="next">Next</button>`;
  } else if (step.scored) {
    controls = `<div class="answer">Answer: <b>${h(step.answer)}</b></div>
      <div class="row">
        <button class="btn good big" data-action="answer" data-correct="1">✓ Right first try</button>
        <button class="btn warn big" data-action="answer" data-correct="0">✗ Needed help</button>
      </div>`;
  } else {
    // Unscored steps can carry an answer too (Rhyme time, the easy finish).
    controls = `${step.answer ? `<div class="answer">Answer: <b>${h(step.answer)}</b></div>` : ''}<button class="btn primary big" data-action="next">${step.type === 'finish' ? 'Finish' : 'Done, next'}</button>`;
  }
  const praiseLine = burst.lastPraise ? `<p class="praise">Say: "${h(burst.lastPraise)}"</p>` : '';

  return `<section class="burst">
    <div class="burst-top"><span>${h(c.name)} · ${stepNo}<span class="beads" aria-hidden="true">${beads}</span></span><b>${h(step.title)}</b></div>
    ${praiseLine}
    ${offer}
    ${childCard(step)}
    <div class="parent">
      ${
        // After a miss, what to show comes straight under the child card, so both fit on a small phone.
        burst.phase === 'model'
          ? ''
          : `<ol class="script">${step.script.map((l) => `<li>${h(l)}</li>`).join('')}</ol>
      ${step.tip ? `<details><summary>${h(step.tipTitle || 'How to say the sound')}</summary><p>${h(step.tip)}</p></details>` : ''}`
      }
      ${controls}
    </div>
    <div class="row end">
      ${step.scored && burst.phase === 'step' && step.type !== 'blend-check' ? '<button class="btn ghost small" data-action="skip">Skip (nothing saved)</button>' : ''}
      ${step.type === 'finish' ? '' : '<button class="btn ghost small" data-action="stop">Stop (tired or upset)</button>'}
    </div>
  </section>`;
}

function childCard(step) {
  const c = step.child || {};
  let inner = '';
  // Rhyme time's example pair, shown above the question.
  if (c.example) inner += `<div class="choices example">${c.example.map((e) => `<div class="choice"><span class="ce">${h(e)}</span></div>`).join('')}</div>`;
  if (c.big) inner += `<div class="big-letter${c.big.length > 2 ? ' long' : ''}">${h(c.big)}</div>`;
  if (c.word) {
    inner += `<div class="big-word">${c.word
      .map((g) => `<span class="g${G.VOWELS.includes(g) ? ' v' : ''}">${h(g)}<i class="${g.length > 1 ? 'bar' : 'dot'}"></i></span>`)
      .join('')}</div>`;
  }
  if (c.text) inner += `<div class="big-text">${h(c.text)}</div>`;
  if (c.emoji) inner += `<div class="big-emoji">${h(c.emoji)}</div>`;
  if (c.hint && burst.phase === 'model') inner += `<div class="big-emoji">${h(c.hint)}</div>`;
  if (c.choices) {
    inner += `<div class="choices">${c.choices
      .map((o) => (o.letter ? `<div class="choice letter">${h(o.letter)}</div>` : `<div class="choice"><span class="ce">${h(o.emoji)}</span><span class="cl">${h(o.label)}</span></div>`))
      .join('')}</div>`;
  }
  // After a miss: pictures to point to, an easier way in.
  if (c.pair && burst.phase === 'model') {
    inner += `<div class="choices">${c.pair.map((e) => `<div class="choice"><span class="ce">${h(e)}</span></div>`).join('')}</div>`;
  } else if (c.reveal) {
    inner += burst.revealed ? `<div class="big-emoji reveal">${h(c.reveal)}</div>` : `<button class="reveal-btn" data-action="reveal">Show picture</button>`;
  }
  if (c.sub) inner += `<div class="sub">${h(c.sub)}</div>`;
  return `<div class="child-card${burst.full ? ' full' : ''}" data-action="toggle-full" title="Tap to change the card size">${inner}<span class="full-hint">${burst.full ? 'tap to exit' : 'tap for full screen'}</span></div>`;
}

function startBurst(variant) {
  const c = findChild(burst.childId);
  const plan = session.buildBurst({
    child: c,
    content,
    today: today(),
    rng: makeRng(Date.now()),
    variant,
    siblingName: siblingName(c),
    settings: state.settings,
  });
  setBurst({ ...burst, phase: 'step', plan, index: 0, startedAt: Date.now(), misses: 0, scored: 0, correct: 0, stopped: false, stopPressed: false, variant, revealed: false, full: false, lastPraise: '', failed: new Set() });
}

function applyStep(correct) {
  const c = findChild(burst.childId);
  const step = burst.plan.steps[burst.index];
  session.applyResult(c, step, correct, today());
  return persist();
}

function answer(correct) {
  const step = burst.plan.steps[burst.index];
  if (!applyStep(correct)) return;
  burst.scored += 1;
  if (correct) {
    burst.correct += 1;
    burst.misses = 0;
    burst.lastPraise = session.praise(step.praise);
    advance();
  } else {
    burst.misses += 1;
    if (step.itemId) burst.failed.add(step.itemId);
    burst.phase = 'model';
    burst.lastPraise = '';
  }
}

function next() {
  const step = burst.plan.steps[burst.index];
  if (burst.phase !== 'model' && !step.scored) {
    if (!applyStep(null)) return;
    burst.lastPraise = '';
  }
  burst.phase = 'step';
  advance();
}

// A turn the parent isn't sure how to run, or that doesn't suit today: no result is
// saved, and the item is left out of the easy finish.
function skip() {
  const step = burst.plan.steps[burst.index];
  if (step.itemId) burst.failed.add(step.itemId);
  burst.lastPraise = '';
  advance();
}

function easyWin() {
  const c = findChild(burst.childId);
  const exclude = new Set(burst.failed);
  if (burst.plan.steps.slice(0, burst.index).some((s) => s.type === 'name-card')) exclude.add('name-card');
  return { ...session.stopStep(c, content, makeRng(Date.now()), exclude, { stopped: !!burst.stopPressed }), n: burst.index };
}

function advance() {
  burst.index += 1;
  burst.revealed = false;
  if (burst.index >= burst.plan.steps.length) return finishBurst();
  // Choose the last step now so it leaves out anything missed in this burst.
  if (burst.plan.steps[burst.index].type === 'finish') burst.plan.steps[burst.index] = easyWin();
  const remaining = burst.plan.steps.length - burst.index;
  burst.offerFinish = burst.misses >= 2 && remaining > 1;
}

// Ending on an easy one, from Stop or from the offer after two misses, counts as
// stopping early, so the progress page and its hints see it.
function finishNow() {
  burst.stopped = true;
  burst.plan.steps = [...burst.plan.steps.slice(0, burst.index), easyWin()];
  burst.offerFinish = false;
  burst.misses = 0;
}

function stopBurst() {
  burst.stopPressed = true;
  burst.phase = 'step';
  finishNow();
}

function finishBurst() {
  const record = recordBurst(false);
  if (!burst) return; // another tab's newer save replaced this burst
  burst.record = record;
  if (record) keepData();
  burst.phase = 'done';
}

export function recordBurst(interrupted) {
  const c = findChild(burst.childId);
  if (!c) return null;
  const endedAt = Date.now();
  const record = {
    day: today(),
    startedAt: burst.startedAt,
    endedAt,
    seconds: Math.min(900, Math.round((endedAt - burst.startedAt) / 1000)),
    stage: c.stage,
    variant: burst.variant,
    steps: burst.plan.steps.length,
    scored: burst.scored,
    correct: burst.correct,
    stoppedEarly: burst.stopped || interrupted,
    interrupted,
    mood: null,
  };
  c.bursts = [...(c.bursts || []), record].slice(-500);
  return persist() ? record : null;
}

export const actions = {
  // A new step scrolls back to the child's card. After a miss, the burst scrolls to its
  // top, so the card and what to show the child fit on screen together.
  'burst-start': (el) => (startBurst(el.dataset.variant), scrollAfterRender('top')),
  answer: (el) => {
    const right = el.dataset.correct === '1';
    answer(right);
    scrollAfterRender(right ? 'top' : '.burst', 'start');
  },
  next: () => (next(), scrollAfterRender('top')),
  skip: () => (skip(), scrollAfterRender('top')),
  stop: () => (stopBurst(), scrollAfterRender('top')),
  'finish-now': () => (finishNow(), scrollAfterRender('top')),
  'keep-going': () => {
    burst.offerFinish = false;
    burst.misses = 0;
  },
  reveal: (el, e) => {
    e.stopPropagation();
    burst.revealed = true;
  },
  'toggle-full': () => {
    burst.full = !burst.full;
  },
  mood: (el) => {
    const c = findChild(burst.childId);
    const last = c.bursts[c.bursts.length - 1];
    if (last) last.mood = el.dataset.mood;
    burst.moodSaved = true;
    persist();
  },
};
