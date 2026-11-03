// Validates the English content file. Run: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GRAPHEME_MAP, BASE_ORDER, TRICKY_WORDS, NONWORD_BLOCKLIST, VOWELS } from '../js/data/en.js';
import * as C from '../js/data/en-content.js';
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
  assert.ok(n >= 50, `need >= 50 cvc words with emoji, have ${n}`);
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
  assert.ok(C.RHYME_SETS.length >= 30);
  for (const r of C.RHYME_SETS) {
    assert.ok(r.a && r.b && r.odd, JSON.stringify(r));
    assert.notEqual(r.a, r.b);
    assert.notEqual(r.a, r.odd);
  }
});

test('SYLLABLE_WORDS', () => {
  assert.ok(C.SYLLABLE_WORDS.length >= 40);
  assert.ok(C.SYLLABLE_WORDS.filter((s) => s.n <= 2).length >= 25, 'enough short words to start with');
  for (const s of C.SYLLABLE_WORDS) {
    assert.ok(s.w && Number.isInteger(s.n) && s.n >= 1 && s.n <= 5, JSON.stringify(s));
    assert.equal(s.parts.length, s.n);
    assert.equal(s.parts.join(''), s.w);
    assert.ok(s.emoji, `syllable word ${s.w} needs an emoji`);
  }
});

test('FIRST_SOUND_SETS cover the single-letter sounds', () => {
  const need = ['s', 'a', 't', 'm', 'i', 'n', 'p', 'o', 'd', 'f', 'l', 'e', 'g', 'k', 'r', 'h', 'u', 'b', 'j', 'v', 'w', 'y', 'z'];
  for (const g of need) {
    const set = C.FIRST_SOUND_SETS.find((x) => x.sound === g);
    assert.ok(set, `missing first-sound set for ${g}`);
    assert.ok(set.words.length >= 3, `first-sound set ${g} needs >= 3 words`);
    for (const w of [...set.words, set.odd]) assert.ok(w.w && w.emoji, `first-sound ${g}: ${JSON.stringify(w)}`);
  }
});
