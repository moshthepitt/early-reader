import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as S from '../js/scheduler.js';
import { segment, checkText, makeContext, buildLexicon, tokenize } from '../js/decodable.js';
import { addDays, weekStart, dayKey, daysBetween } from '../js/util.js';
import { TRICKY_WORDS } from '../js/data/en.js';

test('dates', () => {
  assert.equal(addDays('2026-01-31', 1), '2026-02-01');
  assert.equal(addDays('2026-03-01', -1), '2026-02-28');
  assert.equal(daysBetween('2026-01-01', '2026-01-08'), 7);
  assert.equal(weekStart('2026-11-01'), '2026-10-26'); // Sunday -> Monday before
  assert.equal(weekStart('2026-10-26'), '2026-10-26');
  assert.match(dayKey(new Date(2026, 0, 5)), /^2026-01-05$/);
});

test('review: right on first try moves up a box once per day', () => {
  let it = S.newItem('sound', 's', '2026-01-01');
  assert.equal(S.status(it), 'learning');
  it = S.review(it, true, '2026-01-01');
  assert.equal(it.box, 1);
  assert.equal(it.due, '2026-01-02');
  it = S.review(it, true, '2026-01-01'); // same day again: no extra credit
  assert.equal(it.box, 1);
  assert.equal(it.goodDays.length, 1);
  assert.equal(S.status(it), 'learning');
  it = S.review(it, true, '2026-01-02');
  assert.equal(it.box, 2);
  assert.equal(it.due, '2026-01-04');
  assert.equal(S.status(it), 'known');
});

test('review: a miss sends the item back for review today', () => {
  let it = S.newItem('sound', 'm', '2026-01-01');
  it = S.review(it, true, '2026-01-01');
  it = S.review(it, true, '2026-01-02');
  it = S.review(it, false, '2026-01-04');
  assert.equal(it.box, 0);
  assert.equal(it.due, '2026-01-04');
  assert.equal(S.status(it), 'wobbly');
  assert.equal(S.isKnown(it), false);
});

test('secure needs several days and a long gap', () => {
  let it = S.newItem('sound', 'a', '2026-01-01');
  const days = ['2026-01-01', '2026-01-02', '2026-01-04', '2026-01-08'];
  for (const d of days) it = S.review(it, true, d);
  assert.equal(it.box, 4);
  assert.equal(S.status(it), 'secure');
});

test('dueItems puts weakest first', () => {
  const a = { ...S.newItem('sound', 'a', '2026-01-01'), box: 3, due: '2026-01-01' };
  const b = { ...S.newItem('sound', 'b', '2026-01-01'), box: 0, due: '2026-01-01' };
  const c = { ...S.newItem('sound', 'c', '2026-01-01'), box: 1, due: '2026-01-09' };
  const due = S.dueItems({ a, b, c }, '2026-01-05');
  assert.deepEqual(due.map((x) => x.key), ['b', 'a']);
});

test('canIntroduce respects day, week, shaky and accuracy limits', () => {
  const today = '2026-01-07'; // Wednesday
  const items = {};
  assert.equal(S.canIntroduce({ items, log: [], kind: 'sound', today, perWeek: 3 }).ok, true);
  items.s = { ...S.newItem('sound', 's', today) };
  assert.equal(S.canIntroduce({ items, log: [], kind: 'sound', today, perWeek: 3 }).ok, false, 'one per day');
  const known = (k, d) => ({ ...S.newItem('sound', k, d), box: 2, goodDays: ['x', 'y'], lastResult: true });
  const items2 = { a: known('a', '2026-01-05'), b: known('b', '2026-01-06'), c: known('c', '2026-01-06') };
  assert.equal(S.canIntroduce({ items: items2, log: [], kind: 'sound', today, perWeek: 3 }).ok, false, 'week cap');
  assert.equal(S.canIntroduce({ items: items2, log: [], kind: 'sound', today, perWeek: 4 }).ok, true);
  const shaky = { a: S.newItem('sound', 'a', '2026-01-01'), b: S.newItem('sound', 'b', '2026-01-01'), c: S.newItem('sound', 'c', '2026-01-01') };
  assert.equal(S.canIntroduce({ items: shaky, log: [], kind: 'sound', today, perWeek: 4 }).ok, false, 'too many shaky');
  const badLog = Array.from({ length: 10 }, (_, i) => ({ scored: true, correct: i < 5 }));
  assert.equal(S.canIntroduce({ items: {}, log: badLog, kind: 'sound', today, perWeek: 4 }).ok, false, 'low accuracy');
});

const LEX = buildLexicon([
  { w: 'sat', gs: ['s', 'a', 't'], pos: 'verb', pattern: 'cvc' },
  { w: 'cat', gs: ['c', 'a', 't'], pos: 'noun', pattern: 'cvc' },
  { w: 'mat', gs: ['m', 'a', 't'], pos: 'noun', pattern: 'cvc' },
  { w: 'on', gs: ['o', 'n'], pos: 'other', pattern: 'vc' },
  { w: 'ship', gs: ['sh', 'i', 'p'], pos: 'noun', pattern: 'digraph' },
  { w: 'sam', gs: ['s', 'a', 'm'], pos: 'name', pattern: 'cvc' },
]);

test('segment uses digraphs first', () => {
  assert.deepEqual(segment('ship'), ['sh', 'i', 'p']);
  assert.deepEqual(segment('duck'), ['d', 'u', 'ck']);
  assert.deepEqual(segment('cat'), ['c', 'a', 't']);
  assert.equal(segment('cat1'), null);
});

test('checkText: decodable, tricky, missing sounds, plurals, names', () => {
  const ctx = makeContext({ taught: ['s', 'a', 't', 'c', 'o', 'n', 'm'], trickyTaught: ['the', 'a'], allTricky: TRICKY_WORDS, lexicon: LEX, names: ['Kim'] });
  let r = checkText('The cat sat on a mat.', ctx);
  assert.equal(r.ok, true);
  r = checkText('The cats sat.', ctx);
  assert.equal(r.ok, true, 'plural of a listed word');
  r = checkText("Sam's cat.", ctx);
  assert.equal(r.ok, false, "Sam's ends in s saying /z/, not taught yet");
  assert.deepEqual(r.missing, ['s as /z/']);
  const ctxZ = makeContext({ taught: ['s', 'a', 't', 'c', 'o', 'n', 'm'], trickyTaught: ['the', 'a', 'is'], allTricky: TRICKY_WORDS, lexicon: LEX });
  assert.equal(checkText("Sam's cat.", ctxZ).ok, true, 'fine once s as /z/ has been met');
  assert.equal(checkText('The mats sat.', ctx).ok, true, 'cats/mats: s says /s/ after t');
  r = checkText('Cat 123 猫.', ctx);
  assert.equal(r.ok, false, 'numbers and other scripts are flagged, not skipped');
  assert.equal(r.bad.filter((t) => t.status === 'unsupported').length, 2);
  assert.equal(checkText('The cat sat on a mat’s.', ctxZ).bad.length, 0, 'curly apostrophe');
  r = checkText('Kim sat.', ctx);
  assert.equal(r.ok, true, 'child name');
  r = checkText('{NAME} sat on a mat!', ctx);
  assert.equal(r.ok, true, 'placeholder');
  r = checkText('The ship sat.', ctx);
  assert.equal(r.ok, false);
  assert.deepEqual(r.missing.sort(), ['i', 'p', 'sh'].sort());
  r = checkText('I sat.', ctx);
  assert.equal(r.ok, false, 'I is tricky and not taught');
  assert.equal(r.bad[0].status, 'tricky-untaught');
  r = checkText('The tan cat.', ctx);
  assert.equal(r.ok, false, 'unlisted words are flagged for a check');
  assert.equal(r.bad[0].status, 'unlisted');
});

test('tokenize keeps punctuation between words', () => {
  const t = tokenize('Sam sat. Is it?');
  assert.equal(t.map((x) => x.raw).join(''), 'Sam sat. Is it?');
  assert.equal(t.filter((x) => x.kind === 'word').length, 4);
});
