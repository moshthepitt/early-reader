import * as session from '../session.js';
import * as progress from '../progress.js';
import { escapeHtml as h, ageText } from '../util.js';
import { state, today, noKids, stageBadge, findChild, persist, notify } from '../ui.js';

function minutesAgo(ts) {
  return ts ? Math.round((Date.now() - ts) / 60000) : null;
}

// The first letter of their name: often the first letter a child knows.
const avatar = (c) => `<span class="avatar" aria-hidden="true">${h([...c.name][0] || '')}</span>`;

export function viewToday() {
  if (!state.children.length) return noKids();
  const t = today();
  const cards = state.children
    .map((c) => {
      const sum = progress.todaySummary(c, t);
      const week = progress.weekSummary(c, t);
      const check = progress.stageCheck(c);
      const hint = progress.moodHint(c, t);
      const ago = minutesAgo(sum.lastEndedAt);
      const spacing = ago !== null && ago < 20 ? `<p class="hint">The last burst ended ${ago} min ago. Spreading bursts out helps memory. Wait a little before the next one.</p>` : '';
      const stageUp =
        check.ready && c.stageDismissed !== t
          ? `<div class="notice good"><b>Looks ready for stage ${check.next}: ${h(session.STAGES[check.next].name)}.</b>
             <div class="row"><button class="btn" data-action="stage-up" data-id="${h(c.id)}">Move up</button><button class="btn ghost" data-action="stage-dismiss" data-id="${h(c.id)}">Not yet</button></div></div>`
          : '';
      if (c.paused) {
        return `<section class="card kid s${h(c.stage)}"><h2>${avatar(c)}${h(c.name)} <small>${h(ageText(c.birth))}</small></h2>${stageBadge(c)}
          <p>Paused. A break of weeks or months is fine.</p>
          <button class="btn" data-action="unpause" data-id="${h(c.id)}">Start again</button></section>`;
      }
      return `<section class="card kid s${h(c.stage)}">
        <h2>${avatar(c)}${h(c.name)} <small>${h(ageText(c.birth))}</small></h2>
        ${stageBadge(c)}
        <p class="muted">${h(session.STAGES[c.stage].short)}</p>
        <p>Today: <b>${sum.count}</b> ${sum.count === 1 ? 'burst' : 'bursts'} (${Math.round(sum.seconds / 60)} min). Aim for 2-4 short bursts spread across the day.</p>
        ${spacing}
        ${stageUp}
        ${hint ? `<div class="notice">${h(hint)}</div>` : ''}
        <a class="btn primary big" href="#/burst/${encodeURIComponent(c.id)}">Start a 2-minute burst</a>
        <p class="muted small">This week: practised on ${week.days} ${week.days === 1 ? 'day' : 'days'}. 4-5 days a week is plenty.</p>
      </section>`;
    })
    .join('');
  return `${cards}
    <section class="card">
      <h2>Story time</h2>
      <p>Read one or two books a day. Both children can join in. Ask questions, point to the words and play with sounds.</p>
      <a class="btn" href="#/story">Open story time prompts</a>
    </section>`;
}

export const actions = {
  'stage-dismiss': (el) => {
    findChild(el.dataset.id).stageDismissed = today();
    persist();
  },
  unpause: (el) => {
    const c = findChild(el.dataset.id);
    c.paused = false;
    persist();
    notify(session.backFromBreak(c, today()) ? 'Welcome back. Today is review only.' : 'Welcome back.');
  },
};
