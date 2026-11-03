import * as progress from '../progress.js';
import { escapeHtml as h } from '../util.js';
import { FACES } from '../icons.js';
import { today, selectedChild, noKids, childPicker, stageBadge, findChild, persist, notify } from '../ui.js';

export function viewProgress(arg) {
  const c = selectedChild(arg);
  if (!c) return noKids();
  const t = today();
  const check = progress.stageCheck(c);
  const grid = progress.soundGrid(c);
  const week = progress.weekSummary(c, t);
  const words = progress.wordStats(c);
  const skillNames = {
    'first-sound': 'Hears first sounds',
    'oral-blend': 'Blends spoken sounds',
    'blend-unseen': 'Sounds out new words',
    spelling: 'Builds words with tiles',
    text: 'Reads sentences',
  };
  const skills = Object.entries(skillNames)
    .map(([k, label]) => {
      const s = (c.skills || {})[k];
      if (!s) return '';
      if (!s.attempts) return '';
      return `<tr><td>${h(label)}</td><td>${h(s.attempts)}</td><td>${h(Math.round((s.correct / s.attempts) * 100))}%</td><td>${h(s.goodDays.length)}</td></tr>`;
    })
    .join('');
  const cell = (st) => `<i class="st ${st}" title="${st}"></i>`;
  return `${childPicker('progress', c.id)}
    <section class="card">
      <h1>${h(c.name)}</h1>
      ${stageBadge(c)}
      ${
        check.progress.length
          ? `<h3>Ready for stage ${check.next}?</h3><ul class="checks">${check.progress
              .map((p) => `<li class="${p.have >= p.need ? 'met' : ''}">${h(p.label)}: <b>${p.have}</b> (needs ${p.need})</li>`)
              .join('')}</ul>${check.ready ? `<button class="btn" data-action="stage-up" data-id="${h(c.id)}">Move to stage ${check.next}</button>` : ''}`
          : '<p>This is the final stage. Keep practising sentences and stories, and reading aloud to them.</p>'
      }
      <label class="inline">Choose the stage yourself
        <select data-change="set-stage" data-id="${h(c.id)}">${[1, 2, 3, 4].map((s) => `<option value="${s}" ${c.stage === s ? 'selected' : ''}>${s}</option>`).join('')}</select>
      </label>
    </section>
    <section class="card">
      <h2>Letters and sounds</h2>
      <p class="muted small">Left bead: sound. Right bead: name. Hollow: not yet · yellow: learning · red: wobbly · green: known (right on 2+ days) · dark green: secure.</p>
      <div class="sound-grid">${grid.map((x) => `<div class="sg"><b>${h(x.g)}</b><span>${cell(x.sound)}${x.name ? cell(x.name) : ''}</span></div>`).join('')}</div>
    </section>
    ${
      c.stage >= 3
        ? `<section class="card"><h2>Words</h2><p>Practised: <b>${words.practised}</b> · known: <b>${words.known}</b></p>
           ${c.stage >= 4 ? `<h3>Tricky words</h3><div class="sound-grid tricky">${progress
             .trickyGrid(c)
             .map((x) => `<div class="sg"><b>${h(x.w)}</b><span>${cell(x.status)}</span></div>`)
             .join('')}</div>` : ''}</section>`
        : ''
    }
    <section class="card">
      <h2>Skills</h2>
      ${skills ? `<table class="skills"><tr><th></th><th>Tries</th><th>Right</th><th>Days right</th></tr>${skills}</table>` : '<p>No results yet.</p>'}
    </section>
    <section class="card">
      <h2>This week</h2>
      <p>${week.bursts} bursts on ${week.days} days, about ${week.minutes} min. ${week.accuracy !== null ? `${week.accuracy}% right first try.` : ''}</p>
      <p>Mood: ${FACES.keen} ${week.moods.keen} keen · ${FACES.ok} ${week.moods.ok} OK · ${FACES.low} ${week.moods.low} not today${week.stops ? ` · stopped early ${week.stops}` : ''}</p>
      <p class="muted small">Aim for about 80% right. If it is much lower, slow down and review. If it is always 100%, add new letters faster.</p>
    </section>
    <section class="card muted small">
      <p>Look for letter sounds remembered on separate days and words they can sound out without having seen them before. Listen to their talk and retelling at story time, and notice whether they still want to do it. Memorising a book does not show whether they can read new words.</p>
    </section>`;
}

export function setStage(el) {
  findChild(el.dataset.id).stage = Number(el.value);
  persist();
}

export const actions = {
  'stage-up': (el) => {
    const c = findChild(el.dataset.id);
    const check = progress.stageCheck(c);
    if (check.next) c.stage = check.next;
    persist();
    notify(`${c.name} moved up to stage ${c.stage}.`);
  },
};
