// Builds one 2-3 minute practice burst for one child.
//
// Burst structure from docs/research/report.md (design choices):
// - two or three reviews of known items plus at most one new item
// - ends on an easy success
// - the parent can stop at any time; the stop also ends on an easy success
//
// Stages:
// 1 Sound play: rhyme, syllables, first sounds, blending heard aloud, letters in own name
// 2 Letter-sound links: 2-4 new letters a week, names and sounds together, spaced review
// 3 Blending: sounding out 2-3 letter words with held sounds, unseen-word checks, spelling with tiles
// 4 First reading: tricky words, checked practice sentences

import { GRAPHEME_MAP, BASE_ORDER, VOWELS, TRICKY_WORDS, NONWORD_BLOCKLIST } from './data/en.js';
import * as S from './scheduler.js';
import { daysBetween, pick } from './util.js';
import { makeContext, checkText } from './decodable.js';
// Steps use the hoisted child helpers below; neither module calls the other at startup.
import { introLetterStep, letterSoundStep, letterNameStep, rhymeStep, syllableStep, firstSoundOralStep, firstSoundPickStep, oralBlendStep, blendWordStep, blendCheckStep, spellStep, introTrickyStep, trickyStep, readTextStep, nameCardStep, finishStep } from './steps.js';
export { praise, stopStep } from './steps.js';

export const STAGES = {
  1: { name: 'Sound play', short: 'Listening games and the letters in their name' },
  2: { name: 'Letter sounds', short: 'Letter names and sounds, a few new each week' },
  3: { name: 'Blending', short: 'Sounding out short words' },
  4: { name: 'First reading', short: 'Tricky words and short sentences checked against what they have been taught' },
};

// Find the letters and sounds each child has met.

function plainName(name) {
  // "Émile" -> "emile". Letters that do not reduce to a-z (Ø, Ł, non-Latin) stay as they are.
  return (name || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
}

// The first letter of the name as a grapheme we teach, or null if it is not one
// (so we never point at a later letter and call it the first).
export function nameInitial(name) {
  const p = plainName(name).replace(/^[^\p{L}]+/u, '');
  if (p.startsWith('qu')) return 'qu';
  const first = p[0];
  return first && /[a-z]/.test(first) && GRAPHEME_MAP[first] ? first : null;
}

// Letters in the child's name that we teach: the first letter first, then the others.
export function nameGraphemes(name) {
  const initial = nameInitial(name);
  const letters = plainName(name).replace(/[^a-z]/g, '').split('').filter((g) => GRAPHEME_MAP[g]);
  return [...new Set([...(initial ? [initial] : []), ...letters])];
}

export function teachingOrder(child) {
  const order = [...BASE_ORDER];
  const initial = nameInitial(child.name);
  if (initial && order.includes(initial)) {
    order.splice(order.indexOf(initial), 1);
    order.unshift(initial);
  }
  return order;
}

export function soundsIntroduced(child) {
  return new Set(S.itemsOfKind(child.items, 'sound').map((it) => it.key));
}

export function soundsKnown(child) {
  return new Set(S.itemsOfKind(child.items, 'sound').filter(S.isKnown).map((it) => it.key));
}

export function trickyIntroduced(child) {
  return S.itemsOfKind(child.items, 'tricky').map((it) => it.key);
}

function nextNewSound(child) {
  const have = soundsIntroduced(child);
  if (child.stage <= 1) {
    // Stage 1 only meets the letters in the child's own name.
    return nameGraphemes(child.name).find((g) => !have.has(g)) || null;
  }
  return teachingOrder(child).find((g) => !have.has(g)) || null;
}

function nextNewTricky(child) {
  const have = new Set(trickyIntroduced(child));
  return TRICKY_WORDS.find((w) => !have.has(w)) || null;
}

// Sounds used for practice words: known sounds, or introduced ones if too few are known yet.
export function practiceSounds(child, content) {
  const known = soundsKnown(child);
  const words = content.C.WORDS.filter((w) => w.pattern === 'cvc' || w.pattern === 'vc');
  const count = (set) => words.filter((w) => w.gs.every((g) => set.has(g))).length;
  return count(known) >= 5 ? known : soundsIntroduced(child);
}

export function textContext(child, content, siblingName) {
  return makeContext({
    taught: practiceSounds(child, content),
    trickyTaught: trickyIntroduced(child),
    allTricky: TRICKY_WORDS,
    names: [child.name, siblingName].filter(Boolean),
    lexicon: content.lexicon,
  });
}

export function fillNames(text, child, siblingName) {
  return text.replace(/\{NAME\}/g, child.name || 'Sam').replace(/\{NAME2\}/g, siblingName || 'Mum');
}

// Practice sentences this child can read now.
export function readableSentences(child, content, siblingName) {
  const ctx = textContext(child, content, siblingName);
  return content.C.SENTENCES.filter((s) => (siblingName || !s.includes('{NAME2}')) && checkText(s, ctx).ok);
}

export function readableStories(child, content, siblingName) {
  const ctx = textContext(child, content, siblingName);
  return content.C.STORIES.filter(
    (st) => (siblingName || ![st.title, ...st.lines].some((l) => l.includes('{NAME2}'))) && [st.title, ...st.lines].every((l) => checkText(l, ctx).ok),
  );
}

// Choose practice words and make up words for blending checks.

function practiceWordPool(child, content) {
  const sounds = practiceSounds(child, content);
  const patterns = child.stage >= 4 ? ['vc', 'cvc', 'cvcc', 'digraph'] : ['vc', 'cvc'];
  return content.C.WORDS.filter((w) => w.pos !== 'name' && patterns.includes(w.pattern) && w.gs.every((g) => sounds.has(g)));
}

function chooseNewPracticeWord(child, content, rng, exclude = new Set()) {
  const have = new Set(S.itemsOfKind(child.items, 'word').map((it) => it.key));
  const seen = new Set(child.seenWords || []);
  const pool = practiceWordPool(child, content).filter((w) => !have.has(w.w) && !seen.has(w.w) && !exclude.has(w.w));
  if (!pool.length) return null;
  // Words starting with a sound you can hold are easier to blend (Gonzalez-Frey & Ehri 2021).
  const easy = pool.filter((w) => GRAPHEME_MAP[w.gs[0]]?.continuous);
  const pref = easy.length && rng() < 0.7 ? easy : pool;
  // Prefer pictured words so there is a reward to reveal.
  const pictured = pref.filter((w) => w.emoji);
  return pick(pictured.length && rng() < 0.7 ? pictured : pref, rng);
}

export function makeNonword(child, content, rng, exclude = new Set()) {
  const sounds = practiceSounds(child, content);
  const seen = new Set(child.seenWords || []);
  const vowels = VOWELS.filter((v) => sounds.has(v));
  const starts = [...sounds].filter((g) => g.length === 1 && !VOWELS.includes(g) && g !== 'x');
  const ends = starts.filter((g) => !['c', 'h', 'j', 'v', 'w', 'y', 'r', 'k'].includes(g));
  if (!vowels.length || !starts.length || !ends.length) return null;
  for (let tries = 0; tries < 60; tries++) {
    const gs = [pick(starts, rng), pick(vowels, rng), pick(ends, rng)];
    const w = gs.join('');
    const sounded = w.replace(/c/g, 'k');
    if (content.lexicon.has(w) || seen.has(w) || exclude.has(w)) continue;
    if (NONWORD_BLOCKLIST.some((b) => w.includes(b) || sounded.includes(b))) continue;
    if (gs[0] === gs[2] && rng() < 0.7) continue;
    return { w, gs };
  }
  return null;
}

function chooseUnseenCheck(child, content, rng, exclude) {
  const real = chooseNewPracticeWord(child, content, rng, exclude);
  if (real && rng() < 0.5) return { target: real, nonword: false };
  const nw = makeNonword(child, content, rng, exclude);
  if (nw) return { target: nw, nonword: true };
  return real ? { target: real, nonword: false } : null;
}

// After two weeks or more away, the first day back is review only: no new letters
// or tricky words. Kindergartners lost letter fluency over a summer break (Hobbs &
// Overby 2019); the two weeks and the one day are our choice.
export function backFromBreak(child, today) {
  const before = (child.bursts || []).map((b) => b.day).filter((d) => d < today);
  if (!before.length) return false;
  return daysBetween(before.reduce((a, b) => (a > b ? a : b)), today) >= 14;
}

// Build a burst for the child's current stage.

function planWords(steps) {
  return new Set(steps.flatMap((s) => (s.child && s.child.word ? [s.child.word.join('')] : [])));
}

export function buildBurst({ child, content, today, rng = Math.random, variant = 'cards', siblingName, settings = {} }) {
  const perWeek = settings.newPerWeek ?? 3;
  const trickyPerWeek = settings.trickyPerWeek ?? 2;
  const steps = [];
  const notes = [];
  const used = new Set();
  const due = S.dueItems(child.items, today);
  // Leave out review words whose sounds are no longer in the practice set.
  const sounds = practiceSounds(child, content);
  const wordReady = (it) => {
    if (it.kind !== 'word') return true;
    const w = content.lexicon.get(it.key);
    return !!w && w.gs.every((g) => sounds.has(g));
  };
  // Weakest first, but with two or more slots the last one goes to whatever has
  // waited longest, so letters that keep failing can't hold the rest back.
  // Mixing a likely-easy review in with hard ones also keeps success high, as
  // incremental rehearsal does (Tucker & Burns). The split is our design choice.
  const takeDue = (kinds, n) => {
    const pool = due.filter((it) => kinds.includes(it.kind) && !used.has(it.id) && wordReady(it));
    const out = pool.slice(0, n > 1 ? n - 1 : n);
    const waited = pool.filter((it) => !out.includes(it)).sort((a, b) => (a.due < b.due ? -1 : a.due > b.due ? 1 : 0));
    if (n > 1 && waited.length) out.push(waited[0]);
    out.forEach((it) => used.add(it.id));
    return out;
  };

  const welcomeBack = backFromBreak(child, today);
  const pushLetter = (it) => steps.push(it.kind === 'sound' ? letterSoundStep(child, it) : letterNameStep(child, it));

  const tryIntroduceSound = (perWeekCap) => {
    const g = nextNewSound(child);
    if (!g) return false;
    if (welcomeBack) {
      notes.push('No new letter today. After a break, the first day back is review.');
      return false;
    }
    const gate = S.canIntroduce({ items: child.items, log: child.log || [], kind: 'sound', today, perWeek: perWeekCap });
    if (!gate.ok) {
      notes.push(`No new letter this time: ${gate.reason}`);
      return false;
    }
    steps.push(introLetterStep(child, g));
    return true;
  };

  const stage = child.stage || 1;

  if (stage === 1) {
    // Give first sounds and spoken blending more practice. Phoneme awareness
    // supports later reading (Hulme et al. 2012); the weighting is a design choice.
    const first = rng() < 0.6 ? firstSoundOralStep : pick([oralBlendStep, rhymeStep, syllableStep], rng);
    const second = pick([firstSoundOralStep, oralBlendStep, rhymeStep, syllableStep].filter((f) => f !== first), rng);
    steps.push(first(child, content, rng), second(child, content, rng));
    const reviews = [...takeDue(['sound'], 1), ...takeDue(['name'], 1)];
    if (reviews.length) {
      reviews.forEach(pushLetter);
    } else if (!tryIntroduceSound(Math.min(perWeek, 2))) {
      if (child.name) steps.push(nameCardStep(child));
    }
  }

  if (stage === 2) {
    const nReviews = variant === 'cards' ? 3 : 2;
    takeDue(['sound'], nReviews).forEach(pushLetter);
    takeDue(['name'], 1).forEach(pushLetter);
    tryIntroduceSound(perWeek);
    if (steps.length < 4) {
      const pickStep = firstSoundPickStep(child, content, rng);
      if (pickStep && (variant === 'tiles' || rng() < 0.5)) steps.push(pickStep);
    }
    while (steps.length < 4) {
      const f = pick([firstSoundOralStep, oralBlendStep, oralBlendStep], rng);
      steps.push(f(child, content, rng));
    }
  }

  // From stage 3, letter names share the letter slots with sounds, so names
  // learned earlier keep coming back (Piasta, Purpura & Wagner 2010 taught both).
  if (stage === 3) {
    takeDue(['sound', 'name'], 2).forEach(pushLetter);
    const dueWords = takeDue(['word'], 2);
    dueWords.forEach((it) => {
      const w = content.lexicon.get(it.key);
      if (w) steps.push(blendWordStep(child, content, w, it));
    });
    if (dueWords.length < 2) {
      const w = chooseNewPracticeWord(child, content, rng);
      if (w) steps.push(blendWordStep(child, content, w, null));
    }
    // About every third burst, check blending on a word they have never practised
    // (not even earlier in this burst).
    const bursts = (child.bursts || []).length;
    if (bursts % 3 === 2) {
      const chk = chooseUnseenCheck(child, content, rng, planWords(steps));
      if (chk) steps.push(blendCheckStep(child, content, chk.target, chk.nonword));
    }
    // Letters keep coming during blending, within the weekly limit.
    if (steps.length < 5) tryIntroduceSound(perWeek);
    if (variant === 'tiles' && steps.length < 5) {
      const inPlan = planWords(steps);
      const w = pick(practiceWordPool(child, content).filter((x) => !inPlan.has(x.w)), rng);
      if (w) steps.push(spellStep(child, content, w));
    }
    if (steps.length < 3) steps.push(oralBlendStep(child, content, rng));
  }

  if (stage >= 4) {
    takeDue(['sound', 'name'], 1).forEach(pushLetter);
    // Remaining letters and the two-letter sounds (sh, ch, th, ck, ee, oo...).
    tryIntroduceSound(perWeek);
    const dueTricky = takeDue(['tricky'], 1);
    if (dueTricky.length) {
      steps.push(trickyStep(dueTricky[0]));
    } else {
      const t = welcomeBack ? null : nextNewTricky(child);
      const gate = t && S.canIntroduce({ items: child.items, log: child.log || [], kind: 'tricky', today, perWeek: trickyPerWeek });
      if (t && gate.ok) steps.push(introTrickyStep(t));
      else if (t && gate) notes.push(`No new tricky word this time: ${gate.reason}`);
    }
    const dueWords = takeDue(['word'], 1);
    if (dueWords.length) {
      const w = content.lexicon.get(dueWords[0].key);
      if (w) steps.push(blendWordStep(child, content, w, dueWords[0]));
    } else {
      const w = chooseNewPracticeWord(child, content, rng);
      if (w) steps.push(blendWordStep(child, content, w, null));
    }
    const sentences = readableSentences(child, content, siblingName);
    const recent = new Set(child.recentTexts || []);
    const fresh = sentences.filter((s) => !recent.has(s));
    const s = pick(fresh.length ? fresh : sentences, rng);
    if (s) steps.push({ ...readTextStep(child, s, siblingName), textKey: s });
    else notes.push('No practice sentence fits yet. Teach a few more sounds or tricky words.');
  }

  // Fill short bursts with practice on the weakest letters, then listening games.
  if (steps.length < 2) {
    const extra = S.itemsOfKind(child.items, 'sound')
      .filter((it) => !used.has(it.id))
      .sort((a, b) => a.box - b.box)
      .slice(0, 2 - steps.length);
    extra.forEach((it) => {
      used.add(it.id);
      steps.push(letterSoundStep(child, it));
    });
  }
  while (steps.length < 2) steps.push(pick([firstSoundOralStep, oralBlendStep, rhymeStep], rng)(child, content, rng));
  if (stage >= 3 && soundsIntroduced(child).size < 6) {
    notes.push('Few letters known yet for this stage. Stage 2 may fit better for now.');
  }

  steps.splice(5);
  steps.push(finishStep(child, content, rng));
  return { steps: steps.map((s, i) => ({ ...s, n: i })), notes, stage, variant };
}

// Add introduced items and scored results to the child, then return the child.
export function applyResult(child, step, correct, today) {
  child.items = child.items || {};
  child.log = child.log || [];
  child.skills = child.skills || {};
  if (step.create) {
    for (const c of step.create) {
      const id = S.itemId(c.kind, c.key);
      if (!child.items[id]) child.items[id] = S.newItem(c.kind, c.key, today);
    }
  }
  if (!step.scored || correct === null || correct === undefined) {
    return child;
  }
  if (step.itemId) {
    const it = child.items[step.itemId];
    if (it) {
      // For a newly introduced word, this records its first attempt.
      child.items[step.itemId] = S.review(it, correct, today);
    }
  }
  if (step.skill) {
    const sk = child.skills[step.skill] || { attempts: 0, correct: 0, goodDays: [], recent: [] };
    sk.attempts += 1;
    if (correct) {
      sk.correct += 1;
      if (!sk.goodDays.includes(today)) sk.goodDays.push(today);
    }
    sk.recent = [...(sk.recent || []), correct ? 1 : 0].slice(-10);
    child.skills[step.skill] = sk;
  }
  if (step.seenWord) child.seenWords = [...new Set([...(child.seenWords || []), step.seenWord])];
  if (step.textKey) child.recentTexts = [...(child.recentTexts || []), step.textKey].slice(-20);
  child.log.push({ day: today, type: step.type, id: step.itemId || step.skill || step.type, correct: !!correct, scored: true });
  if (child.log.length > 3000) child.log = child.log.slice(-3000);
  return child;
}
