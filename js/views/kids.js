import * as store from '../store.js';
import * as session from '../session.js';
import { escapeHtml as h } from '../util.js';
import { state, findChild, persist } from '../ui.js';

export function viewKids() {
  const list = state.children
    .map(
      (c) => `<form class="card kid-form" data-form="edit-child" data-id="${h(c.id)}">
      <h2>${h(c.name)}</h2>
      <label>Name <input name="name" value="${h(c.name)}" required maxlength="40"></label>
      <label>Birth month <input name="birth" type="month" value="${h(c.birth)}"></label>
      <label>Stage
        <select name="stage">${[1, 2, 3, 4].map((s) => `<option value="${s}" ${c.stage === s ? 'selected' : ''}>${s}: ${h(session.STAGES[s].name)}</option>`).join('')}</select>
      </label>
      <label class="check"><input type="checkbox" name="paused" ${c.paused ? 'checked' : ''}> Paused (taking a break)</label>
      <div class="row"><button class="btn primary">Save</button><button type="button" class="btn ghost danger" data-action="delete-child" data-id="${h(c.id)}">Delete</button></div>
    </form>`,
    )
    .join('');
  return `${list}
    <form class="card" data-form="add-child">
      <h2>Add a child</h2>
      <label>Name <input name="name" required maxlength="40" placeholder="First name"></label>
      <label>Birth month <input name="birth" type="month"></label>
      <label>Start at stage
        <select name="stage">${[1, 2, 3, 4].map((s) => `<option value="${s}">${s}: ${h(session.STAGES[s].name)}</option>`).join('')}</select>
      </label>
      <p class="muted small">Most 3-year-olds start at stage 1. A 4-year-old who already knows several letter sounds can start at stage 2. Stage 3 is for children who know about 12 letter sounds.</p>
      <button class="btn primary">Add</button>
    </form>
    <p class="muted small">Names stay on this device. They are never sent anywhere. The app removes them from AI prompts.</p>`;
}

export const actions = {
  'delete-child': (el) => {
    const c = findChild(el.dataset.id);
    if (!c || !confirm(`Delete ${c.name} and all of their progress? This cannot be undone.`)) return false;
    state.children = state.children.filter((x) => x.id !== c.id);
    persist();
  },
};

export const forms = {
  'add-child': (f, data) => {
    if (state.children.length >= 6) return alert('You can add up to 6 children.');
    state.children.push(store.newChild({ name: data.get('name'), birth: data.get('birth'), stage: Number(data.get('stage')) || 1 }));
    persist();
    location.hash = '#/today';
    return false;
  },
  'edit-child': (f, data) => {
    const c = findChild(f.dataset.id);
    c.name = String(data.get('name')).trim().slice(0, 40) || c.name;
    c.birth = data.get('birth');
    c.stage = Number(data.get('stage')) || c.stage;
    c.paused = data.get('paused') === 'on';
    persist();
  },
};
