// Runs simulated children through months of practice and checks every burst
// the engine builds is safe and sensible.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import * as G from '../js/data/en.js';
import * as C from '../js/data/en-content.js';
import { buildLexicon, checkText } from '../js/decodable.js';
import { newChild } from '../js/store.js';
import * as session from '../js/session.js';
import * as progress from '../js/progress.js';
import { addDays, makeRng, weekStart } from '../js/util.js';
import * as S from '../js/scheduler.js';
import { buildTextPrompt, checkPasted } from '../js/texts.js';
import { buildBookPrompt } from '../js/readaloud.js';

const content = { G, C, lexicon: buildLexicon(C.WORDS) };

function simulate({ name, stage = 1, days = 180, pRight = 0.85, seed = 1, sibling = 'Ben', settings = { newPerWeek: 3, trickyPerWeek: 2 } }) {
  const child = newChild({ name, stage });
  const rng = makeRng(seed);
  let day = '2026-01-05';
  const seen = { steps: 0, types: new Set(), stagesReached: new Set([stage]), maxStage: stage };
  for (let d = 0; d < days; d++, day = addDays(day, 1)) {
    if (rng() < 0.2) continue; // skipped days
    const nBursts = 2 + Math.floor(rng() * 3);
    for (let b = 0; b < nBursts; b++) {
      const plan = session.buildBurst({ child, content, today: day, rng, variant: rng() < 0.5 ? 'cards' : 'tiles', siblingName: sibling, settings });
      assert.ok(plan.steps.length >= 2 && plan.steps.length <= 6, `burst size ${plan.steps.length}`);
      assert.equal(plan.steps[plan.steps.length - 1].type === 'finish' || plan.steps[plan.steps.length - 1].title === 'Finish on a win', true, 'ends on a win');
      const ids = plan.steps.filter((s) => s.itemId).map((s) => s.itemId);
      assert.equal(new Set(ids).size, ids.length, 'no item twice in one burst');
      assert.ok(plan.steps.filter((s) => s.type === 'intro-letter').length <= 1, 'at most one new letter per burst');
      const checks = plan.steps.filter((s) => s.type === 'blend-check').map((s) => s.seenWord);
      const practisedHere = plan.steps.filter((s) => s.type === 'blend-word').map((s) => s.answer);
      for (const w of checks) {
        assert.ok(!practisedHere.includes(w), `unseen check ${w} was practised in the same burst`);
        assert.ok(!(child.seenWords || []).includes(w), `unseen check ${w} was checked before`);
        assert.ok(!child.items[S.itemId('word', w)], `unseen check ${w} was practised before`);
      }
      const soundsAtBuild = session.practiceSounds(child, content);
      const ctxAtBuild = session.textContext(child, content, sibling);
      for (const step of plan.steps) {
        seen.steps++;
        seen.types.add(step.type);
        checkStep(step, child, soundsAtBuild, ctxAtBuild);
        const right = step.scored ? rng() < pRight : null;
        session.applyResult(child, step, right, day);
      }
      child.bursts.push({ day, seconds: 150, scored: 3, correct: 3, mood: 'ok', endedAt: 0 });
    }
    const check = progress.stageCheck(child);
    if (check.ready) {
      child.stage = check.next;
      seen.stagesReached.add(child.stage);
      seen.maxStage = Math.max(seen.maxStage, child.stage);
    }
    // Week cap holds.
    const wk = weekStart(day);
    const newThisWeek = Object.values(child.items).filter((it) => it.kind === 'sound' && it.introduced >= wk && it.introduced <= day).length;
    assert.ok(newThisWeek <= settings.newPerWeek, `new letters this week ${newThisWeek}`);
  }
  return { child, seen };
}

function checkStep(step, child, sounds, ctx) {
  assert.ok(step.title && Array.isArray(step.script) && step.script.length, `step needs a title and script: ${step.type}`);
  for (const line of step.script) assert.ok(!/undefined|NaN|\[object/.test(line), `bad script line: ${line}`);
  if (step.scored) assert.ok(step.answer !== undefined && step.answer !== '', `scored step needs an answer: ${step.type}`);
  if (step.scored) assert.ok(Array.isArray(step.model) && step.model.length, `scored step needs a model: ${step.type}`);
  const c = step.child || {};
  if (c.word) {
    for (const g of c.word) assert.ok(G.GRAPHEME_MAP[g], `unknown grapheme ${g}`);
    const w = c.word.join('');
    assert.ok(!G.NONWORD_BLOCKLIST.includes(w), `blocked word shown: ${w}`);
  }
  if (step.type === 'blend-word' || step.type === 'blend-check') {
    for (const g of c.word) assert.ok(sounds.has(g), `${c.word.join('')} uses ${g}, not taught yet`);
  }
  if (step.type === 'read-text') {
    assert.ok(checkText(step.textKey, ctx).ok, `sentence not decodable for child: ${step.textKey}`);
    assert.ok(!/\{NAME/.test(c.text), 'names filled in');
  }
  if (step.type === 'letter-sound') {
    assert.ok(!c.emoji && c.hint, 'scored letter checks show the letter alone, with the picture kept for the model');
  }
  if (step.type === 'intro-letter') {
    assert.ok(c.emoji, 'new letters are taught with a picture');
    if (child.stage <= 1) assert.ok(session.nameGraphemes(child.name).includes(c.big), `stage 1 only introduces name letters, got ${c.big}`);
  }
}

test('a typical child moves through all four stages', () => {
  const { child, seen } = simulate({ name: 'Kim', days: 240, seed: 7 });
  assert.equal(seen.maxStage, 4, `reached stage ${seen.maxStage}`);
  for (const t of ['first-sound-oral', 'oral-blend', 'intro-letter', 'letter-sound', 'letter-name', 'blend-word', 'blend-check', 'read-text', 'finish']) {
    assert.ok(seen.types.has(t), `never saw step type ${t}`);
  }
  const known = session.soundsKnown(child);
  assert.ok(known.size >= 12, `knows ${known.size} sounds`);
});

test('a child who struggles is held back, not rushed', () => {
  const { child, seen } = simulate({ name: 'Max', days: 60, pRight: 0.5, seed: 3 });
  const introduced = S.itemsOfKind(child.items, 'sound').length;
  assert.ok(introduced <= 14, `introduced ${introduced} letters in 2 months with 50% success`);
  assert.ok(seen.maxStage <= 3);
});

test('different names, empty names and stage starts do not crash', () => {
  for (const [name, stage] of [['Zoe', 1], ['Quinn', 2], ['Xander', 3], ['', 1], ['Øyvind', 2], ['Ann-Marie', 4], ['Thomas', 2]]) {
    simulate({ name, stage, days: 40, seed: name.length + stage });
  }
});

test('text prompt has no child name and lists allowed words', () => {
  const { child } = simulate({ name: 'Kim', stage: 3, days: 30, seed: 11 });
  const prompt = buildTextPrompt(child, content, { kind: 'story', topic: 'a pet', excludeNames: ['Ben'] });
  assert.ok(!/\bKim\b/i.test(prompt), 'child name leaked into prompt');
  assert.ok(!/\bBen\b/i.test(prompt), 'sibling name leaked into prompt');
  assert.match(prompt, /ALLOWED WORDS \(\d+\): /);
  const back = checkPasted('Sam sat.\nThe zebra ran away.', child, content, 'Ben');
  assert.equal(back.length, 2);
  assert.equal(back[1].result.ok, false);
});

test('book prompt has no child details', () => {
  const p = buildBookPrompt({ title: 'Where the Wild Things Are', author: 'Maurice Sendak' });
  assert.ok(p.includes('Where the Wild Things Are'));
  assert.ok(!p.includes('{NAME'));
  assert.match(p, /Do not ask me for personal details/);
});

test('nonwords never spell blocked words', () => {
  const child = newChild({ name: 'Kim', stage: 3 });
  for (const g of G.BASE_ORDER.slice(0, 26)) child.items[S.itemId('sound', g)] = { ...S.newItem('sound', g, '2026-01-01'), box: 3, goodDays: ['a', 'b', 'c'], lastResult: true };
  const rng = makeRng(5);
  for (let i = 0; i < 3000; i++) {
    const nw = session.makeNonword(child, content, rng);
    assert.ok(nw);
    const spoken = nw.w.replace(/c/g, 'k');
    for (const b of G.NONWORD_BLOCKLIST) {
      assert.ok(!nw.w.includes(b) && !spoken.includes(b), `nonword ${nw.w} contains ${b}`);
    }
    assert.ok(!content.lexicon.has(nw.w));
  }
});

test('name initials: never point at a later letter', () => {
  assert.equal(session.nameInitial('Quinn'), 'qu');
  assert.equal(session.nameInitial('Émile'), 'e');
  assert.equal(session.nameInitial('Øyvind'), null);
  assert.equal(session.nameInitial('  kim'), 'k');
  assert.equal(session.nameGraphemes('Øyvind')[0], 'y', 'other name letters still usable, but not as the initial');
  const c = newChild({ name: 'Øyvind', stage: 1 });
  assert.equal(progress.stageCheck(c).progress[2].have, 1, 'no initial to learn means that check is met');
});

test('keyword scripts say ends with / in the middle where true', () => {
  const child = newChild({ name: 'Kim', stage: 4 });
  for (const g of G.BASE_ORDER.slice(0, 26)) child.items[S.itemId('sound', g)] = { ...S.newItem('sound', g, '2026-01-01'), box: 3, goodDays: ['a', 'b', 'c'], lastResult: true };
  const rng = makeRng(9);
  const lines = [];
  let day = '2026-02-02';
  for (let i = 0; i < 60; i++, day = addDays(day, 1)) {
    const plan = session.buildBurst({ child, content, today: day, rng, siblingName: 'Ben', settings: { newPerWeek: 4, trickyPerWeek: 2 } });
    for (const st of plan.steps) {
      if (st.type === 'intro-letter') lines.push(st.script[1]);
      session.applyResult(child, st, st.scored ? true : null, day);
    }
  }
  const joined = lines.join(' ');
  assert.match(joined, /"Duck" ends with k\./);
  assert.match(joined, /"Moon" has oo in the middle\./);
  assert.doesNotMatch(joined, /"(Duck|Box|Bell|Ring|Dress|Puff|Bee)" starts with/);
});

test('letters that keep failing do not crowd out an overdue review', () => {
  const child = newChild({ name: 'Kim', stage: 2 });
  for (const g of ['b', 'd', 'p']) child.items[S.itemId('sound', g)] = { ...S.newItem('sound', g, '2026-01-01'), lastResult: false, lastSeen: '2026-01-10', lastMissed: '2026-01-10', due: '2026-01-10' };
  child.items[S.itemId('sound', 'm')] = { ...S.newItem('sound', 'm', '2026-01-01'), box: 6, goodDays: ['a', 'b', 'c', 'd', 'e', 'f'], lastResult: true, due: '2026-01-07' };
  const plan = session.buildBurst({ child, content, today: '2026-01-10', rng: makeRng(3), variant: 'cards' });
  const letters = plan.steps.filter((s) => s.type === 'letter-sound').map((s) => s.child.big);
  assert.equal(letters.length, 3);
  assert.ok(letters.includes('m'), `overdue m should get a turn, got ${letters}`);
});

test('easy win skips items missed in this burst', () => {
  const child = newChild({ name: 'Kim', stage: 2 });
  child.items[S.itemId('sound', 's')] = { ...S.newItem('sound', 's', '2026-01-01'), box: 4, goodDays: ['a', 'b', 'c', 'd'], lastResult: true };
  child.items[S.itemId('sound', 'a')] = { ...S.newItem('sound', 'a', '2026-01-01'), box: 2, goodDays: ['a', 'b'], lastResult: true };
  const fin = session.stopStep(child, content, makeRng(1), new Set(['sound:s']));
  assert.equal(fin.child.big, 'a');
});
