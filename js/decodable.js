// Decodability checker.
//
// Language models break phonics rules often (Manlises & Ong 2026: stories strayed
// 1.44 phonics levels on average), so every practice text is checked word by word
// against the sounds and tricky words this child has been taught.

import { GRAPHEMES } from './data/en.js';

const INVENTORY = GRAPHEMES.map((x) => x.g).sort((a, b) => b.length - a.length);

// Split a word into graphemes, longest match first ("ship" -> sh, i, p).
// Returns null if some part is not in the inventory.
export function segment(word, inventory = INVENTORY) {
  const out = [];
  let i = 0;
  while (i < word.length) {
    const g = inventory.find((x) => word.startsWith(x, i));
    if (!g) return null;
    out.push(g);
    i += g.length;
  }
  return out;
}

export function buildLexicon(words) {
  const map = new Map();
  for (const entry of words) map.set(entry.w, entry);
  return map;
}

const TOKEN_RE = /\{NAME2?\}|[A-Za-z]+(?:'[A-Za-z]+)?/g;

// Split text into word tokens, keeping the text between them so it can be shown again.
// Anything between words other than spaces and ordinary punctuation (numbers, accented
// or non-English letters, symbols) becomes an "unsupported" token so it is never skipped.
const PLAIN_GAP = /^[\s.,!?;:'"“”‘’()\-–—]*$/;

export function tokenize(text) {
  const norm = String(text).replace(/[’‘]/g, "'");
  const tokens = [];
  let last = 0;
  const pushGap = (raw) => {
    if (!raw) return;
    if (PLAIN_GAP.test(raw)) tokens.push({ kind: 'gap', raw });
    else {
      // Keep spaces as gaps, flag the rest.
      for (const part of raw.split(/(\s+)/)) {
        if (!part) continue;
        tokens.push(PLAIN_GAP.test(part) ? { kind: 'gap', raw: part } : { kind: 'word', raw: part, unsupported: true });
      }
    }
  };
  for (const m of norm.matchAll(TOKEN_RE)) {
    pushGap(norm.slice(last, m.index));
    tokens.push({ kind: 'word', raw: m[0] });
    last = m.index + m[0].length;
  }
  pushGap(norm.slice(last));
  return tokens;
}

// ctx: { taught: Set<grapheme>, tricky: Set<lowercase word> (taught tricky words),
//        allTricky: Set<lowercase word>, names: Set<lowercase>, lexicon: Map }
function checkWord(raw, ctx) {
  if (raw === '{NAME}' || raw === '{NAME2}') return { status: 'name' };
  if (!/^[A-Za-z']+$/.test(raw)) return { status: 'unsupported' };
  const lower = raw.toLowerCase();
  if (ctx.names && ctx.names.has(lower)) return { status: 'name' };

  // Tricky words win over spelling, because "was" and "of" do not sound like their letters.
  if (ctx.allTricky && ctx.allTricky.has(lower)) {
    return ctx.tricky && ctx.tricky.has(lower) ? { status: 'tricky' } : { status: 'tricky-untaught' };
  }

  const found = lookup(lower, ctx.lexicon);
  if (found) {
    const missing = unique(found.gs.filter((g) => !ctx.taught.has(g)));
    // An added -s that sounds like /z/ (dogs, runs) needs the child to have met s saying /z/.
    if (found.suffixZ && !ctx.sz) missing.push('s as /z/');
    return missing.length
      ? { status: 'needs', gs: found.gs, missing }
      : { status: 'decodable', gs: found.gs };
  }

  // Not in the word list: try to split it, but flag it for the parent to check,
  // because spelling alone cannot tell us how an English word is said.
  const gs = segment(lower.replace(/'/g, ''));
  if (!gs) return { status: 'unknown' };
  const missing = unique(gs.filter((g) => !ctx.taught.has(g)));
  return { status: 'unlisted', gs, missing };
}

// After these endings an added -s sounds like /s/ (cats, cups, ducks). After anything
// else it sounds like /z/ (dogs, runs, bees).
const VOICELESS_END = new Set(['p', 't', 'k', 'c', 'ck', 'f', 'ff', 'th']);

function withS(entry) {
  const last = entry.gs[entry.gs.length - 1];
  return { ...entry, gs: [...entry.gs, 's'], suffixZ: !VOICELESS_END.has(last) };
}

function lookup(lower, lexicon) {
  if (!lexicon) return null;
  if (lexicon.has(lower)) return lexicon.get(lower);
  // Possessive: "sam's" = sam + s. Not after s, x, sh, ch ("bus's" says /iz/).
  const poss = lower.match(/^(.+)'s$/);
  if (poss && lexicon.has(poss[1]) && !/(s|x|sh|ch|z)$/.test(poss[1])) return withS(lexicon.get(poss[1]));
  // Simple plural or verb -s: "cats", "runs". Not after s, x, sh, ch, z (those need -es).
  if (lower.length > 2 && lower.endsWith('s') && !/(s|x|sh|ch|z)s$/.test(lower)) {
    const base = lower.slice(0, -1);
    if (lexicon.has(base)) return withS(lexicon.get(base));
  }
  return null;
}

const OK_STATUSES = new Set(['decodable', 'tricky', 'name']);

export function checkText(text, ctx) {
  const tokens = tokenize(text).map((t) => (t.kind !== 'word' ? t : t.unsupported ? { ...t, status: 'unsupported' } : { ...t, ...checkWord(t.raw, ctx) }));
  const words = tokens.filter((t) => t.kind === 'word');
  const bad = words.filter((t) => !OK_STATUSES.has(t.status));
  const missing = unique(bad.flatMap((t) => t.missing || []));
  return {
    tokens,
    ok: words.length > 0 && bad.length === 0,
    total: words.length,
    okCount: words.length - bad.length,
    bad,
    missing,
  };
}

export function makeContext({ taught, trickyTaught = [], allTricky = [], names = [], lexicon }) {
  const tricky = new Set(trickyTaught.map((w) => w.toLowerCase()));
  return {
    taught: taught instanceof Set ? taught : new Set(taught),
    tricky,
    // "is", "has", "his", "as" are where a child first meets s saying /z/.
    sz: ['is', 'has', 'his', 'as'].some((w) => tricky.has(w)),
    allTricky: new Set(allTricky.map((w) => w.toLowerCase())),
    names: new Set(names.filter(Boolean).map((n) => n.toLowerCase().replace(/[’‘]/g, "'"))),
    lexicon,
  };
}

function unique(arr) {
  return [...new Set(arr)];
}
