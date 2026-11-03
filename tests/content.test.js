// Validates the English content file. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAPHEME_MAP, BASE_ORDER, TRICKY_WORDS, NONWORD_BLOCKLIST, VOWELS } from '../js/data/en.js';
import * as C from '../js/data/en-content.js';
import { introTrickyStep } from '../js/steps.js';
import { buildLexicon, checkText, makeContext } from '../js/decodable.js';

const POS = new Set(['word', 'name']);
const PATTERNS = new Set(['vc', 'cvc', 'cvcc', 'ccvc', 'ccvcc', 'cvccc', 'digraph']);
const lexicon = buildLexicon(C.WORDS);
const allTaught = new Set(BASE_ORDER);
const fullCtx = makeContext({ taught: allTaught, trickyTaught: TRICKY_WORDS, allTricky: TRICKY_WORDS, lexicon });

test('WORDS entries are well formed', () => {
  assert.ok(Array.isArray(C.WORDS));
  assert.ok(C.WORDS.length >= 220, `need >= 220 words, have ${C.WORDS.length}`);
  const seen = new Set();
  for (const e of C.WORDS) {
    assert.match(e.w, /^[a-z]+$/, `bad word ${JSON.stringify(e)}`);
    assert.ok(!seen.has(e.w), `duplicate word ${e.w}`);
    seen.add(e.w);
    assert.equal(e.gs.join(''), e.w, `graphemes do not spell ${e.w}`);
    for (const g of e.gs) assert.ok(GRAPHEME_MAP[g], `unknown grapheme ${g} in ${e.w}`);
    assert.ok(POS.has(e.pos), `bad pos for ${e.w}`);
    assert.ok(PATTERNS.has(e.pattern), `bad pattern for ${e.w}`);
    assert.ok(!TRICKY_WORDS.map((t) => t.toLowerCase()).includes(e.w), `${e.w} is a tricky word, not a decodable one`);
    assert.ok(!NONWORD_BLOCKLIST.includes(e.w), `${e.w} is blocklisted`);
    if (e.emoji !== undefined) assert.ok(typeof e.emoji === 'string' && e.emoji.length > 0);
    if (e.pattern === 'cvc') {
      assert.equal(e.gs.length, 3, `${e.w} marked cvc but has ${e.gs.length} graphemes`);
      assert.ok(VOWELS.includes(e.gs[1]), `${e.w} cvc middle must be a short vowel`);
    }
  }
});

test('enough early words (first 12 sounds) for blending practice', () => {
  const early = new Set(BASE_ORDER.slice(0, 12));
  const n = C.WORDS.filter((e) => e.pattern === 'cvc' && e.gs.every((g) => early.has(g))).length;
  assert.ok(n >= 35, `need >= 35 cvc words using only ${[...early]}, have ${n}`);
  const first6 = new Set(BASE_ORDER.slice(0, 6));
  const n6 = C.WORDS.filter((e) => e.gs.every((g) => first6.has(g))).length;
  assert.ok(n6 >= 8, `need >= 8 words using only the first 6 sounds, have ${n6}`);
});

test('enough pictured cvc words for picture-reveal', () => {
  const n = C.WORDS.filter((e) => e.pattern === 'cvc' && e.emoji).length;
  assert.ok(n >= 25, `need >= 25 cvc words with emoji, have ${n}`);
});

function assertDecodableLine(line, where) {
  const r = checkText(line, fullCtx);
  const bad = r.bad.map((t) => `${t.raw}(${t.status})`).join(', ');
  assert.ok(r.ok, `${where}: "${line}" has words outside WORDS/TRICKY_WORDS: ${bad}`);
}

test('SENTENCES only use listed words', () => {
  assert.ok(C.SENTENCES.length >= 150, `need >= 150 sentences, have ${C.SENTENCES.length}`);
  for (const s of C.SENTENCES) {
    assert.match(s, /^(\{NAME2?\}|[A-Z]).*[.!?]$/, `sentence must start with a capital and end with . ! or ?: ${s}`);
    assertDecodableLine(s, 'SENTENCES');
  }
});

test('enough early sentences', () => {
  const early = makeContext({ taught: BASE_ORDER.slice(0, 12), trickyTaught: TRICKY_WORDS.slice(0, 5), allTricky: TRICKY_WORDS, lexicon });
  const n = C.SENTENCES.filter((s) => checkText(s, early).ok).length;
  assert.ok(n >= 30, `need >= 30 sentences readable with the first 12 sounds + first 5 tricky words, have ${n}`);
});

test('STORIES are well formed', () => {
  assert.ok(C.STORIES.length >= 30, `need >= 30 stories, have ${C.STORIES.length}`);
  const ids = new Set();
  for (const st of C.STORIES) {
    assert.ok(st.id && !ids.has(st.id), `story id missing or duplicate: ${st.id}`);
    ids.add(st.id);
    assert.ok(st.lines.length >= 3 && st.lines.length <= 8, `story ${st.id} should have 3-8 lines`);
    assertDecodableLine(st.title, `story ${st.id} title`);
    for (const l of st.lines) assertDecodableLine(l, `story ${st.id}`);
  }
  const early = makeContext({ taught: BASE_ORDER.slice(0, 12), trickyTaught: TRICKY_WORDS.slice(0, 5), allTricky: TRICKY_WORDS, lexicon });
  const nEarly = C.STORIES.filter((st) => [st.title, ...st.lines].every((l) => checkText(l, early).ok)).length;
  assert.ok(nEarly >= 6, `need >= 6 stories readable with the first 12 sounds + first 5 tricky words, have ${nEarly}`);
});

test('RHYME_SETS', () => {
  assert.ok(C.RHYME_SETS.length >= 20);
  for (const r of C.RHYME_SETS) {
    const words = [r.a, r.b, r.odd];
    assert.ok(words.every((x) => x.w && x.emoji), `rhyme set needs a word and picture each: ${JSON.stringify(r)}`);
    assert.equal(new Set(words.map((x) => x.w)).size, 3, JSON.stringify(r));
    assert.equal(new Set(words.map((x) => x.emoji)).size, 3, `pictures must differ: ${JSON.stringify(r)}`);
  }
});

test('SYLLABLE_WORDS', () => {
  assert.ok(C.SYLLABLE_WORDS.length >= 40);
  assert.ok(C.SYLLABLE_WORDS.filter((s) => s.n <= 2).length >= 25, 'enough short words to start with');
  for (const s of C.SYLLABLE_WORDS) {
    assert.ok(s.w && Number.isInteger(s.n) && s.n >= 1 && s.n <= 5, JSON.stringify(s));
    // Every beat is spoken, so every part needs a vowel ("el-e-phant", not "el-eph-ant-t").
    for (const part of s.parts) assert.match(part, /^[a-z]*[aeiouy][a-z]*$/, `beat "${part}" in ${s.w}`);
    assert.ok(s.emoji, `syllable word ${s.w} needs an emoji`);
  }
});

test('FIRST_SOUND_SETS cover the single-letter sounds', () => {
  // No set for i, o, e, u, v, y or z: no three pictures a young Kenyan child would name with those sounds.
  const need = ['s', 'a', 't', 'm', 'n', 'p', 'd', 'f', 'l', 'g', 'k', 'r', 'h', 'b', 'j', 'w'];
  for (const g of need) {
    const set = C.FIRST_SOUND_SETS.find((x) => x.sound === g);
    assert.ok(set, `missing first-sound set for ${g}`);
    assert.ok(set.words.length >= 3, `first-sound set ${g} needs >= 3 words`);
    for (const w of [...set.words, set.odd]) assert.ok(w.w && w.emoji, `first-sound ${g}: ${JSON.stringify(w)}`);
  }
});

test('every tricky word says which part is tricky and what it says', () => {
  for (const t of TRICKY_WORDS) {
    const lines = introTrickyStep(t).script.join(' ');
    assert.doesNotMatch(lines, /tricky part|does not sound like its letters/, `no explanation for "${t}"`);
  }
});

// Every picture the child sees, with the word it stands for in each list.
function pictureWords() {
  const seen = new Map();
  const add = (emoji, w, where) => {
    const k = emoji.replace(/\uFE0F/g, '');
    seen.set(k, [...(seen.get(k) || []), `${w} (${where})`]);
  };
  for (const w of C.WORDS) if (w.emoji) add(w.emoji, w.w, 'words');
  for (const s of C.FIRST_SOUND_SETS) for (const w of [...s.words, s.odd]) add(w.emoji, w.w, 'odd one out');
  for (const r of C.RHYME_SETS) for (const x of [r.a, r.b, r.odd]) add(x.emoji, x.w, 'rhyme');
  for (const s of C.SYLLABLE_WORDS) add(s.emoji, s.w, 'beats');
  for (const x of Object.values(GRAPHEME_MAP)) add(x.emoji, x.keyword, 'letter card');
  return seen;
}

test('each picture stands for one word everywhere in the app', () => {
  for (const [emoji, uses] of pictureWords()) {
    const words = new Set(uses.map((u) => u.split(' (')[0]));
    assert.equal(words.size, 1, `${emoji} is called ${uses.join(', ')}`);
  }
});

test('no game set puts two look-alike pictures together', () => {
  const sets = [
    ...C.FIRST_SOUND_SETS.map((s) => [...s.words, s.odd]),
    ...C.RHYME_SETS.map((r) => [r.a, r.b, r.odd]),
  ];
  for (const set of sets) {
    for (const a of set) for (const b of set) assert.ok(!C.lookAlike(a.emoji, b.emoji), `${a.w} and ${b.w} look alike`);
  }
});

test('no game relies on vowels that many Kenyan voices say alike', () => {
  // Many Kenyan speakers say u as in "up" like a as in "apple", and ee like i. A rhyme
  // set's odd word mustn't rhyme with the first word once those are merged, and an odd
  // one out mustn't start with a vowel that merges with the set's sound.
  const merge = (w) => w.replace(/ee|ea/g, 'i').replace(/u/g, 'a');
  const rime = (w) => merge(w).replace(/^[^aeio]*/, '');
  for (const r of C.RHYME_SETS) assert.notEqual(rime(r.odd.w), rime(r.a.w), `${r.odd.w} rhymes with ${r.a.w} in Kenyan English`);
  for (const set of C.FIRST_SOUND_SETS) {
    if (!VOWELS.includes(set.sound)) continue;
    assert.notEqual(merge(set.odd.w[0]), merge(set.sound), `${set.odd.w} starts like ${set.sound} in Kenyan English`);
  }
});
