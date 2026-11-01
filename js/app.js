// Early Reader: routing, event delegation and startup.
import * as store from './store.js';
import * as S from './scheduler.js';
import { state, setState, burst, setBurst, ui, setRenderers, actions as sharedActions } from './ui.js';
import * as today from './views/today.js';
import * as burstView from './views/burst.js';
import * as kids from './views/kids.js';
import * as progress from './views/progress.js';
import * as story from './views/story.js';
import * as texts from './views/texts.js';
import * as sounds from './views/sounds.js';
import * as print from './views/print.js';
import * as settings from './views/settings.js';
import * as guide from './views/guide.js';
import * as how from './views/how.js';
import { MARK } from './icons.js';

const app = document.getElementById('app');

// Keep tabs in step: when another tab saves, reload (unless a burst is running here).
window.addEventListener('storage', (e) => {
  if (e.key !== 'early-reader-v1') return;
  if (burst && burst.phase !== 'done' && burst.phase !== 'choose') {
    ui.staleTab = true;
    return;
  }
  setState(store.load());
  render();
});

const NAV = [
  ['today', 'Today'],
  ['story', 'Story time'],
  ['texts', 'Texts'],
  ['progress', 'Progress'],
];
// Tools sit on a second, quieter row so the daily screens stay first.
const TOOLS = [
  ['print', 'Print'],
  ['sounds', 'Sounds'],
  ['kids', 'Kids'],
  ['settings', 'Settings'],
];
// Reading for the parent, beside the name on a phone and at the end on a wide screen.
const DOCS = [
  ['guide', 'Guide'],
  ['how', 'How it works'],
];

const screens = { today, burst: burstView, kids, progress, story, texts, sounds, print, settings, guide, how };
const VIEWS = {
  today: today.viewToday,
  burst: burstView.viewBurst,
  kids: kids.viewKids,
  progress: progress.viewProgress,
  story: story.viewStory,
  texts: texts.viewTexts,
  sounds: sounds.viewSounds,
  print: print.viewPrint,
  settings: settings.viewSettings,
  guide: guide.viewGuide,
  how: how.viewHow,
  about: guide.viewGuide,
};

function route() {
  const [name, arg] = location.hash.replace(/^#\/?/, '').split('/');
  if (VIEWS[name]) return { name, arg: arg ? decodeURIComponent(arg) : undefined };
  return { name: state.children.length ? 'today' : 'kids' };
}

function render() {
  const r = route();
  // Leaving a burst ends it. Results already recorded are kept, and the burst is logged.
  if (r.name !== 'burst' && burst) {
    if ((burst.phase === 'step' || burst.phase === 'model') && (burst.index > 0 || burst.scored > 0)) burstView.recordBurst(true);
    setBurst(null);
    if (ui.staleTab) {
      ui.staleTab = false;
      setState(store.load());
    }
  }
  const links = (list) => list.map(([k, label]) => `<a href="#/${k}" class="${r.name === k || (r.name === 'burst' && k === 'today') ? 'on' : ''}">${label}</a>`).join('');
  app.innerHTML = `<header class="top"><a class="brand" href="#/today">${MARK}Early Reader</a><nav class="screens" aria-label="Screens"><div class="nav-main">${links(NAV)}</div><div class="nav-tools">${links(TOOLS)}</div></nav><nav class="nav-docs" aria-label="Help">${links(DOCS)}</nav></header><main>${VIEWS[r.name](r.arg)}</main><footer class="foot">Everything you enter is saved on this device. Early Reader has no server, so there is nowhere for it to be sent. <a href="#/how">How it works</a></footer>`;
  window.scrollTo(0, 0);
}

function rerender() {
  const y = window.scrollY;
  const r = route();
  app.querySelector('main').innerHTML = VIEWS[r.name](r.arg);
  window.scrollTo(0, y);
}

window.addEventListener('hashchange', render);

setRenderers(render, rerender);

const actions = Object.assign({}, sharedActions, ...Object.values(screens).map((screen) => screen.actions));
const forms = Object.assign({}, ...Object.values(screens).map((screen) => screen.forms));

document.addEventListener('click', async (e) => {
  const el = e.target.closest('[data-action]');
  if (!el || !app.contains(el)) return;
  const fn = actions[el.dataset.action];
  if (!fn) return;
  e.preventDefault();
  const out = fn(el, e);
  if (out instanceof Promise) return;
  if (out !== false) rerender();
});

document.addEventListener('submit', (e) => {
  const f = e.target.closest('form[data-form]');
  if (!f) return;
  e.preventDefault();
  const out = forms[f.dataset.form](f, new FormData(f));
  if (out !== false) rerender();
});

document.addEventListener('change', async (e) => {
  const el = e.target.closest('[data-change]');
  if (!el) return;
  if (el.dataset.change === 'set-stage') {
    progress.setStage(el);
    rerender();
  }
  if (el.dataset.change === 'import') await settings.importBackup(el);
});

sounds.refreshRecorded().then(() => {
  if (route().name === 'sounds') rerender();
});
render();

// The built app (see scripts/build.mjs) registers the service worker once the page has
// loaded, so it never competes with the first paint. The source version runs without one.
if (typeof __PROD__ !== 'undefined' && 'serviceWorker' in navigator && window.isSecureContext) {
  window.addEventListener('load', () => navigator.serviceWorker.register('./sw.js').catch(() => {}));
}

// Browser smoke tests use this debug handle.
window.earlyReader = { get state() { return state; }, S };
