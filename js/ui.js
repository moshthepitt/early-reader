// Shared live state and UI helpers. Screens never import the app shell.
import * as C from './data/en-content.js';
import { buildLexicon } from './decodable.js';
import * as store from './store.js';
import * as session from './session.js';
import { escapeHtml as h, dayKey } from './util.js';

export const content = { C, lexicon: buildLexicon(C.WORDS) };
export let state = store.load();
export let burst = null;
export const ui = { textCheck: null, textPrompt: '', bookPrompt: '', printHtml: '', recording: null, recorded: new Set() };

export function setState(next) { state = next; }
export function setBurst(next) { burst = next; }

// The shell supplies rendering after all screens have loaded.
export let render;
export let rerender;
export function setRenderers(renderAll, renderScreen) {
  render = renderAll;
  rerender = renderScreen;
}

// Returns false when another tab saved newer data first. Then this tab loads that
// data instead, any burst in progress ends, and the caller should stop.
export function persist() {
  if (store.save(state)) return true;
  setState(store.load());
  setBurst(null);
  alert('Early Reader was updated in another tab. Showing the latest data; your last change here was not saved.');
  render();
  return false;
}

// Ask the browser not to clear saved data when the phone runs low on space. Called
// after a real save. Best effort: the browser may say no, and it doesn't stop
// someone clearing browser data by hand (web.dev, "Persistent storage").
// Asks once per visit: Firefox shows a prompt each time it is asked.
let keepAsked = false;
export function keepData() {
  const s = navigator.storage;
  if (keepAsked || !s || !s.persisted || !s.persist) return;
  keepAsked = true;
  s.persisted().then((yes) => yes || s.persist()).catch(() => {});
}

// A short confirmation at the bottom of the screen, so every button shows it worked.
// It lives outside #app, so a re-render does not wipe it, and screen readers announce it.
let toastTimer;
export function notify(message) {
  let el = document.getElementById('toast');
  if (!el) {
    el = document.createElement('div');
    el.id = 'toast';
    el.setAttribute('role', 'status');
    document.body.appendChild(el);
  }
  el.textContent = message;
  el.className = 'show';
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => (el.className = ''), 2800);
}

// Ask the next render to bring something into view: a CSS selector, or 'top'.
export function scrollAfterRender(target) {
  ui.scrollTo = target;
}

export const findChild = (id) => state.children.find((c) => c.id === id);
export const today = () => dayKey();
const sibling = (c) => store.siblingOf(state, c);
export const siblingName = (c) => sibling(c)?.name || '';

export function stageBadge(c) {
  const st = session.STAGES[c.stage] || session.STAGES[1];
  return `<span class="badge s${h(c.stage)}">Stage ${h(c.stage)}: ${h(st.name)}</span>`;
}

export function childPicker(base, selectedId) {
  if (state.children.length < 2) return '';
  return `<div class="picker">${state.children
    .map((c) => `<a class="pill ${c.id === selectedId ? 'on' : ''}" href="#/${base}/${encodeURIComponent(c.id)}">${h(c.name)}</a>`)
    .join('')}</div>`;
}

export function selectedChild(arg) {
  return (arg && findChild(arg)) || state.children[0] || null;
}

export function noKids() {
  return `<section class="card banded"><h1>Welcome</h1><p>Add your children to start. What you enter is saved on this device only - Early Reader has no server and no accounts.</p><a class="btn primary" href="#/kids">Add a child</a> <a class="btn" href="#/guide">Read the guide first</a></section>`;
}

export const actions = {
  copy: (el) => {
    const ta = document.querySelector(el.dataset.target);
    if (!ta) return false;
    ta.select();
    (navigator.clipboard ? navigator.clipboard.writeText(ta.value) : Promise.reject()).catch(() => document.execCommand('copy'));
    el.textContent = 'Copied';
    return false;
  },
};
