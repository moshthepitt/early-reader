import * as G from '../data/en.js';
import * as session from '../session.js';
import { escapeHtml as h, makeRng } from '../util.js';
import { GAMES, FACES } from '../icons.js';
import { state, burst, setBurst, content, today, siblingName, findChild, noKids, stageBadge, persist, scrollAfterRender } from '../ui.js';

export function viewBurst(id) {
  const c = findChild(id);
  if (!c) return noKids();
  if (!burst || burst.childId !== c.id) setBurst({ childId: c.id, phase: 'choose' });

  if (burst.phase === 'choose') {
    return `<section class="card">
      <h1>${h(c.name)}'s burst</h1>
      ${stageBadge(c)}
      <p>Let ${h(c.name)} choose the game:</p>
      <div class="choose">
        <button class="choice-btn" data-action="burst-start" data-variant="cards">${GAMES.cards}Card game</button>
        <button class="choice-btn" data-action="burst-start" data-variant="tiles">${GAMES.tiles}Tile game</button>
      </div>
      <p class="muted small">Have letter cards or tiles ready from the Print tab. A burst takes about 2-3 minutes. Stop any time.</p>
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
    controls = `<div class="model"><b>Show them:</b><ul>${(step.model || []).map((l) => `<li>${h(l)}</li>`).join('')}</ul><p class="muted small">${h(session.praise('effort'))}</p></div>
      <button class="btn primary big" data-action="next">Next</button>`;
  } else if (step.scored) {
    controls = `<div class="answer">Answer: <b>${h(step.answer)}</b></div>
      <div class="row">
        <button class="btn good big" data-action="answer" data-correct="1">✓ Right first try</button>
        <button class="btn warn big" data-action="answer" data-correct="0">✗ Needed help</button>
      </div>`;
  } else {
    controls = `<button class="btn primary big" data-action="next">${step.type === 'finish' ? 'Finish' : 'Done, next'}</button>`;
  }
  const praiseLine = burst.lastPraise ? `<p class="praise">Say: "${h(burst.lastPraise)}"</p>` : '';

  return `<section class="burst">
    <div class="burst-top"><span>${h(c.name)} · ${stepNo}<span class="beads" aria-hidden="true">${beads}</span></span><b>${h(step.title)}</b></div>
    ${praiseLine}
    ${offer}
    ${childCard(step)}
    <div class="parent">
      <ol class="script">${step.script.map((l) => `<li>${h(l)}</li>`).join('')}</ol>
      ${step.tip ? `<details><summary>How to say the sound</summary><p>${h(step.tip)}</p></details>` : ''}
      ${controls}
    </div>
    <div class="row end">
      ${step.type === 'finish' ? '' : '<button class="btn ghost small" data-action="stop">Stop (tired or upset)</button>'}
    </div>
  </section>`;
}

function childCard(step) {
  const c = step.child || {};
  let inner = '';
  if (c.big) inner += `<div class="big-letter${c.big.length > 2 ? ' long' : ''}">${h(c.big)}</div>`;
  if (c.word) {
    inner += `<div class="big-word">${c.word
      .map((g) => `<span class="g${G.VOWELS.includes(g) ? ' v' : ''}">${h(g)}<i class="${g.length > 1 ? 'bar' : 'dot'}"></i></span>`)
      .join('')}</div>`;
  }
  if (c.text) inner += `<div class="big-text">${h(c.text)}</div>`;
  if (c.emoji) inner += `<div class="big-emoji">${h(c.emoji)}</div>`;
  if (c.choices) {
    inner += `<div class="choices">${c.choices
      .map((o) => (o.letter ? `<div class="choice letter">${h(o.letter)}</div>` : `<div class="choice"><span class="ce">${h(o.emoji)}</span><span class="cl">${h(o.label)}</span></div>`))
      .join('')}</div>`;
  }
  if (c.reveal) {
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
  setBurst({ ...burst, phase: 'step', plan, index: 0, startedAt: Date.now(), misses: 0, scored: 0, correct: 0, stopped: false, variant, revealed: false, full: false, lastPraise: '', failed: new Set() });
}

function applyStep(correct) {
  const c = findChild(burst.childId);
  const step = burst.plan.steps[burst.index];
  session.applyResult(c, step, correct, today());
  persist();
}

function answer(correct) {
  const step = burst.plan.steps[burst.index];
  applyStep(correct);
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
    applyStep(null);
    burst.lastPraise = '';
  }
  burst.phase = 'step';
  advance();
}

function easyWin() {
  const c = findChild(burst.childId);
  return { ...session.stopStep(c, content, makeRng(Date.now()), burst.failed), n: burst.index };
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

function finishNow() {
  burst.plan.steps = [...burst.plan.steps.slice(0, burst.index), easyWin()];
  burst.offerFinish = false;
  burst.misses = 0;
}

function stopBurst() {
  burst.stopped = true;
  burst.phase = 'step';
  finishNow();
}

function finishBurst() {
  burst.record = recordBurst(false);
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
  persist();
  return record;
}

export const actions = {
  // A new step scrolls back to the child's card. After a miss the step stays, so the
  // parent keeps their place and sees what to show the child.
  'burst-start': (el) => (startBurst(el.dataset.variant), scrollAfterRender('top')),
  answer: (el) => {
    const right = el.dataset.correct === '1';
    answer(right);
    if (right) scrollAfterRender('top');
  },
  next: () => (next(), scrollAfterRender('top')),
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
