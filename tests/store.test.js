import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as store from '../js/store.js';
import { buildBookPrompt } from '../js/readaloud.js';
import { buildTextPrompt } from '../js/texts.js';
import * as G from '../js/data/en.js';
import * as C from '../js/data/en-content.js';
import { buildLexicon } from '../js/decodable.js';

const evil = '<img src=x onerror=alert(1)>';

test('import rebuilds every field with strict types', () => {
  const backup = {
    app: 'early-reader',
    state: {
      rev: 'x',
      settings: { newPerWeek: evil, trickyPerWeek: 99 },
      books: [{ id: 'b1', title: evil, notes: 7 }],
      children: [
        {
          id: evil,
          name: `Kim${evil}`,
          birth: evil,
          stage: evil,
          paused: 'yes',
          items: { a: { kind: 'sound', key: evil, box: 3 }, b: { kind: 'sound', key: 's', box: evil, goodDays: [evil, '2026-01-02'], due: evil, lastResult: evil }, c: null },
          skills: { 'first-sound': { attempts: evil, correct: 5, goodDays: [], recent: [1, evil, 0] }, [evil]: { attempts: 1 } },
          bursts: [{ day: '2026-01-02', mood: evil, seconds: evil }, { day: evil }],
          log: [{ day: '2026-01-02', type: evil, correct: 1 }],
          seenWords: ['sat', evil],
        },
        { name: 'Ben', stage: 99, items: null, skills: null, bursts: null },
      ],
    },
  };
  const { state } = store.importJson(JSON.stringify(backup));
  const json = JSON.stringify(state);
  const [kim, ben] = state.children;
  assert.ok(!kim.name.includes('<'), 'name stripped of markup');
  assert.notEqual(kim.id, evil);
  assert.equal(kim.birth, '');
  assert.equal(kim.stage, 1);
  assert.equal(ben.stage, 4, 'stage clamped');
  assert.deepEqual(Object.keys(kim.items), ['sound:s']);
  assert.equal(kim.items['sound:s'].box, 0);
  assert.deepEqual(kim.items['sound:s'].goodDays, ['2026-01-02']);
  assert.equal(kim.items['sound:s'].lastResult, null);
  assert.equal(kim.items['sound:s'].lastMissed, null);
  assert.deepEqual(Object.keys(kim.skills), ['first-sound']);
  assert.equal(kim.skills['first-sound'].attempts, 0);
  assert.equal(kim.skills['first-sound'].correct, 0);
  assert.equal(kim.bursts.length, 1);
  assert.equal(kim.bursts[0].mood, null);
  assert.deepEqual(kim.seenWords, ['sat']);
  assert.deepEqual(ben.items, {});
  assert.equal(state.settings.newPerWeek, 3);
  assert.equal(state.settings.trickyPerWeek, 3);
  // Only free-text fields may still contain the characters; they are escaped when shown.
  assert.ok(!/[<>"]/.test(JSON.stringify(state.children).replace(/\\"/g, '').replace(/"/g, '')), 'no markup characters left in child data');
  assert.ok(json.includes('onerror') ? state.books[0].title === evil : true);
});

test('import rejects junk without throwing away anything', () => {
  assert.throws(() => store.importJson('not json'), /not an Early Reader backup/);
  assert.throws(() => store.importJson('{"a":1}'), /not an Early Reader backup/);
});

test('recordings in backups must be audio data URLs', () => {
  const { recordings } = store.importJson(JSON.stringify({ app: 'early-reader', state: { children: [] }, recordings: { s: 'data:audio/webm;base64,AAAA', m: 'javascript:alert(1)', [evil]: 'data:audio/webm;base64,AAAA' } }));
  assert.deepEqual(Object.keys(recordings), ['s']);
});

test('save refuses to overwrite newer data from another tab', () => {
  const mem = new Map();
  const storage = { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => mem.set(k, v) };
  const tabA = store.load(storage);
  const tabB = store.load(storage);
  tabA.children.push(store.newChild({ name: 'Kim' }));
  assert.equal(store.save(tabA, storage), true);
  tabB.settings.newPerWeek = 4;
  assert.equal(store.save(tabB, storage), false, 'stale tab must not overwrite');
  assert.equal(store.load(storage).children.length, 1);
});

test('family names are removed from typed prompt text', () => {
  const p = buildBookPrompt({ title: 'Kim and the Moon', pageNotes: 'Ben hugs the bear. kim laughs.', redact: ['Kim', 'Ben'] });
  assert.ok(!/\bkim\b|\bben\b/i.test(p), p);
  const content = { G, C, lexicon: buildLexicon(C.WORDS) };
  const child = store.newChild({ name: 'Kim', stage: 3 });
  const t = buildTextPrompt(child, content, { topic: 'Kim visits Ben at the park', excludeNames: ['Ben'] });
  assert.ok(!/\bkim\b|\bben\b/i.test(t));
});

test('the date of the last miss survives a backup, and older saves get one', () => {
  const backup = {
    app: 'early-reader',
    state: {
      children: [
        {
          name: 'Kim',
          items: {
            a: { kind: 'sound', key: 's', box: 1, lastSeen: '2026-01-04', lastResult: true, lastMissed: '2026-01-04' },
            b: { kind: 'sound', key: 'a', box: 0, lastSeen: '2026-01-03', lastResult: false },
            c: { kind: 'sound', key: 't', box: 2, lastSeen: '2026-01-03', lastResult: true, lastMissed: evil },
          },
        },
      ],
    },
  };
  const { state } = store.importJson(JSON.stringify(backup));
  const items = state.children[0].items;
  assert.equal(items['sound:s'].lastMissed, '2026-01-04');
  assert.equal(items['sound:a'].lastMissed, '2026-01-03', 'older saves: a last miss dates from the last day seen');
  assert.equal(items['sound:t'].lastMissed, null);
});

test('import drops letters the app does not teach, which would break a burst', () => {
  const child = store.newChild({ name: 'Kim', stage: 4 });
  child.items['sound:s'] = { kind: 'sound', key: 's' };
  child.items['name:banana'] = { kind: 'name', key: 'banana' };
  child.items['sound:constructor'] = { kind: 'sound', key: 'constructor' };
  const items = store.importJson(JSON.stringify({ children: [child] })).state.children[0].items;
  assert.deepEqual(Object.keys(items), ['sound:s']);
});

test('a browser that refuses storage gets empty data, not a crash', () => {
  const desc = Object.getOwnPropertyDescriptor(globalThis, 'localStorage');
  Object.defineProperty(globalThis, 'localStorage', { configurable: true, get() { throw new Error('SecurityError'); } });
  try {
    assert.deepEqual(store.load().children, []);
    assert.equal(store.hasSnapshot(), false);
  } finally {
    if (desc) Object.defineProperty(globalThis, 'localStorage', desc);
    else delete globalThis.localStorage;
  }
  const refusing = { getItem() { throw new Error('SecurityError'); } };
  assert.equal(store.hasSnapshot(refusing), false);
});
