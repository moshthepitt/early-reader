// All data stays on this device (localStorage). Nothing is sent anywhere.
// Children's names, progress and voice recordings never leave the browser
// unless the parent exports a backup file themselves.

import { uid, dayKey } from './util.js';
import { GRAPHEME_MAP } from './data/en.js';

const KEY = 'early-reader-v1';
// Some browsers refuse storage outright (blocked cookies, some private modes), and
// even reading localStorage throws. Treat that as no storage rather than crash.
function local() {
  try {
    return globalThis.localStorage;
  } catch {
    return null;
  }
}
const PREV_KEY = 'early-reader-v1-previous';
const PREV_DAY_KEY = 'early-reader-v1-previous-day';

export function defaultState() {
  return {
    version: 1,
    rev: 0,
    children: [],
    settings: { newPerWeek: 3, trickyPerWeek: 2 },
    books: [],
    created: dayKey(),
  };
}

export function newChild({ name, birth = '', stage = 1 }) {
  return {
    id: uid(),
    name: cleanName(name),
    birth: DATE_MONTH.test(birth || '') ? birth : '',
    stage: clampInt(stage, 1, 4, 1),
    paused: false,
    items: {},
    skills: {},
    log: [],
    bursts: [],
    seenWords: [],
    recentTexts: [],
    created: dayKey(),
  };
}

export function load(storage = local()) {
  try {
    const raw = storage?.getItem(KEY);
    if (!raw) return defaultState();
    return migrate(JSON.parse(raw));
  } catch (err) {
    console.error('Could not read saved data', err);
    return defaultState();
  }
}

// Returns false if another tab saved newer data first (the caller should reload).
export function save(state, storage = local()) {
  if (!storage) return true;
  try {
    const stored = JSON.parse(storage.getItem(KEY) || 'null');
    if (stored && typeof stored.rev === 'number' && stored.rev > state.rev) return false;
  } catch {
    // Unreadable stored data: overwrite it.
  }
  state.rev = (state.rev || 0) + 1;
  storage.setItem(KEY, JSON.stringify(state));
  return true;
}

// Keep one copy of the data before a destructive change (import, reset).
export function snapshot(storage = local()) {
  const raw = storage?.getItem(KEY);
  if (!raw) return;
  storage.setItem(PREV_KEY, raw);
  storage.setItem(PREV_DAY_KEY, dayKey());
}

// The day the kept copy was made, or null if unknown.
export function snapshotDay(storage = local()) {
  try {
    return date(storage?.getItem(PREV_DAY_KEY));
  } catch {
    return null;
  }
}

export function hasSnapshot(storage = local()) {
  try {
    return !!storage?.getItem(PREV_KEY);
  } catch {
    return false;
  }
}

export function restoreSnapshot(storage = local()) {
  const raw = storage?.getItem(PREV_KEY);
  if (!raw) return null;
  return migrate(JSON.parse(raw));
}

// ---------- validation ----------
// Everything loaded or imported is rebuilt field by field with strict types, so a
// damaged or tampered backup cannot inject HTML or break the app.

const DATE = /^\d{4}-\d{2}-\d{2}$/;
const DATE_MONTH = /^\d{4}-(0[1-9]|1[0-2])$/;
const KEY_RE = /^[A-Za-z' -]{1,24}$/;
const ITEM_KINDS = new Set(['sound', 'name', 'word', 'tricky']);
const SKILLS = new Set(['first-sound', 'rhyme', 'syllables', 'oral-blend', 'blend-unseen', 'spelling', 'text']);
const MOODS = new Set(['keen', 'ok', 'low']);

function clampInt(v, min, max, fallback) {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(max, Math.max(min, Math.round(n))) : fallback;
}
function str(v, max) {
  return typeof v === 'string' ? v.slice(0, max) : '';
}
function safeId(v, max) {
  return typeof v === 'string' && /^[A-Za-z0-9:' -]+$/.test(v) ? v.slice(0, max) : 'step';
}
function cleanName(v) {
  return str(v, 40).replace(/[<>&"]/g, '').trim();
}
function date(v) {
  return typeof v === 'string' && DATE.test(v) ? v : null;
}
function dates(v, max = 400) {
  return Array.isArray(v) ? [...new Set(v.filter((d) => typeof d === 'string' && DATE.test(d)))].slice(-max) : [];
}

function cleanItem(it) {
  if (!it || typeof it !== 'object' || !ITEM_KINDS.has(it.kind) || typeof it.key !== 'string' || !KEY_RE.test(it.key)) return null;
  // Letters must be ones the app teaches, or building a burst fails on them later.
  if ((it.kind === 'sound' || it.kind === 'name') && !Object.prototype.hasOwnProperty.call(GRAPHEME_MAP, it.key)) return null;
  return {
    id: `${it.kind}:${it.key}`,
    kind: it.kind,
    key: it.key,
    box: clampInt(it.box, 0, 6, 0),
    due: date(it.due) || dayKey(),
    introduced: date(it.introduced) || dayKey(),
    lastSeen: date(it.lastSeen),
    goodDays: dates(it.goodDays),
    attempts: clampInt(it.attempts, 0, 1e6, 0),
    firstTryCorrect: clampInt(it.firstTryCorrect, 0, 1e6, 0),
    lastResult: it.lastResult === true ? true : it.lastResult === false ? false : null,
    // Older saves lack this; a last result of false means the last day seen was a miss.
    lastMissed: date(it.lastMissed) || (it.lastResult === false ? date(it.lastSeen) : null),
  };
}

function cleanSkill(s) {
  if (!s || typeof s !== 'object') return null;
  const attempts = clampInt(s.attempts, 0, 1e6, 0);
  return {
    attempts,
    correct: clampInt(s.correct, 0, attempts, 0),
    goodDays: dates(s.goodDays),
    recent: Array.isArray(s.recent) ? s.recent.map((x) => (x ? 1 : 0)).slice(-10) : [],
  };
}

function cleanBurst(b) {
  if (!b || typeof b !== 'object' || !date(b.day)) return null;
  return {
    day: b.day,
    startedAt: clampInt(b.startedAt, 0, 1e15, 0),
    endedAt: clampInt(b.endedAt, 0, 1e15, 0),
    seconds: clampInt(b.seconds, 0, 3600, 0),
    stage: clampInt(b.stage, 1, 4, 1),
    variant: b.variant === 'tiles' ? 'tiles' : 'cards',
    steps: clampInt(b.steps, 0, 50, 0),
    scored: clampInt(b.scored, 0, 50, 0),
    correct: clampInt(b.correct, 0, 50, 0),
    stoppedEarly: !!b.stoppedEarly,
    interrupted: !!b.interrupted,
    mood: MOODS.has(b.mood) ? b.mood : null,
  };
}

function cleanChild(c) {
  if (!c || typeof c !== 'object') return null;
  const base = newChild({ name: c.name, birth: c.birth, stage: c.stage });
  const items = {};
  if (c.items && typeof c.items === 'object') {
    for (const raw of Object.values(c.items)) {
      const it = cleanItem(raw);
      if (it) items[it.id] = it;
    }
  }
  const skills = {};
  if (c.skills && typeof c.skills === 'object') {
    for (const [k, v] of Object.entries(c.skills)) {
      const s = SKILLS.has(k) && cleanSkill(v);
      if (s) skills[k] = s;
    }
  }
  return {
    ...base,
    id: typeof c.id === 'string' && /^[a-z0-9]{4,40}$/.test(c.id) ? c.id : base.id,
    paused: !!c.paused,
    stageDismissed: date(c.stageDismissed),
    items,
    skills,
    log: (Array.isArray(c.log) ? c.log : [])
      .filter((e) => e && date(e.day))
      .map((e) => ({ day: e.day, type: safeId(e.type, 30), id: safeId(e.id, 60), correct: !!e.correct, scored: !!e.scored }))
      .slice(-3000),
    bursts: (Array.isArray(c.bursts) ? c.bursts : []).map(cleanBurst).filter(Boolean).slice(-500),
    seenWords: (Array.isArray(c.seenWords) ? c.seenWords : []).filter((w) => typeof w === 'string' && KEY_RE.test(w)).slice(-2000),
    recentTexts: (Array.isArray(c.recentTexts) ? c.recentTexts : []).filter((t) => typeof t === 'string').map((t) => t.slice(0, 200)).slice(-20),
    created: date(c.created) || base.created,
  };
}

function migrate(state) {
  if (!state || typeof state !== 'object') throw new Error('No data found.');
  const base = defaultState();
  const settings = state.settings && typeof state.settings === 'object' ? state.settings : {};
  const ids = new Set();
  const children = (Array.isArray(state.children) ? state.children : [])
    .map(cleanChild)
    .filter((c) => c && !ids.has(c.id) && ids.add(c.id))
    .slice(0, 6);
  return {
    ...base,
    rev: clampInt(state.rev, 0, 1e12, 0),
    children,
    settings: {
      newPerWeek: clampInt(settings.newPerWeek, 2, 4, base.settings.newPerWeek),
      trickyPerWeek: clampInt(settings.trickyPerWeek, 1, 3, base.settings.trickyPerWeek),
    },
    books: (Array.isArray(state.books) ? state.books : [])
      .filter((b) => b && typeof b === 'object')
      .map((b) => ({ id: str(b.id, 40) || uid(), title: str(b.title, 140), notes: str(b.notes, 8000), created: date(b.created) || dayKey() }))
      .slice(0, 300),
    created: date(state.created) || base.created,
  };
}

export function exportJson(state, recordings = {}) {
  return JSON.stringify({ app: 'early-reader', exported: new Date().toISOString(), state, recordings }, null, 2);
}

// Parse and validate a backup without touching saved data. Returns { state, recordings }.
export function importJson(text) {
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error('This file is not an Early Reader backup.');
  }
  const raw = data && data.app === 'early-reader' ? data.state : data;
  if (!raw || !Array.isArray(raw.children)) throw new Error('This file is not an Early Reader backup.');
  const state = migrate(raw);
  const recordings = {};
  if (data && data.recordings && typeof data.recordings === 'object') {
    for (const [k, v] of Object.entries(data.recordings)) {
      if (KEY_RE.test(k) && typeof v === 'string' && /^data:audio\/[\w.+-]+(;[\w=.+-]+)*;base64,[A-Za-z0-9+/=]+$/.test(v) && v.length < 2_000_000) recordings[k] = v;
    }
  }
  return { state, recordings };
}

export function siblingOf(state, child) {
  return state.children.find((c) => c.id !== child.id) || null;
}

export function familyNames(state) {
  return state.children.map((c) => c.name).filter(Boolean);
}
