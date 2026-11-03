// Progress summaries and "ready for the next stage?" checks.
//
// Stage checks from docs/research/report.md (design choices, not tested cut-offs).
// These require right answers over several days:
// 1 -> 2: picks out first sounds, 6 of the last 8, right on 3+ days; knows the first letter of their name
// 2 -> 3: gives the sounds of about a dozen letters on separate days, including 2+ vowels
// 3 -> 4: sounds out unseen and made-up words, 5 of the last 6, right on 3+ days
//
// Check skills on new material. Parents can overestimate reading from familiar books
// (Neuman et al. 2014).

import { GRAPHEME_MAP, VOWELS, TRICKY_WORDS } from './data/en.js';
import * as S from './scheduler.js';
import { backFromBreak, nameInitial, soundsKnown, teachingOrder } from './session.js';
import { weekStart } from './util.js';

export function stageCheck(child) {
  const stage = child.stage || 1;
  const skills = child.skills || {};
  if (stage === 1) {
    const fs = skills['first-sound'] || { goodDays: [], recent: [] };
    const fsHits = lastHits(fs, 8);
    const initial = nameInitial(child.name);
    const initialItem = initial ? child.items[S.itemId('sound', initial)] : null;
    const initialOk = !initial || S.isKnown(initialItem);
    return {
      ready: fsHits >= 6 && fs.goodDays.length >= 3 && initialOk,
      next: 2,
      progress: [
        { label: 'First sounds right (out of the last 8)', have: fsHits, need: 6 },
        { label: 'Days with a first sound right', have: fs.goodDays.length, need: 3 },
        { label: initial ? `Knows the sound of "${initial}" (first letter of their name)` : 'First letter of their name', have: initialOk ? 1 : 0, need: 1 },
      ],
    };
  }
  if (stage === 2) {
    const known = soundsKnown(child);
    const vowels = VOWELS.filter((v) => known.has(v)).length;
    return {
      ready: known.size >= 12 && vowels >= 2,
      next: 3,
      progress: [
        { label: 'Letter sounds known', have: known.size, need: 12 },
        { label: 'Vowel letters known (a e i o u)', have: vowels, need: 2 },
      ],
    };
  }
  if (stage === 3) {
    const sk = skills['blend-unseen'] || { recent: [], goodDays: [] };
    const hits = lastHits(sk, 6);
    return {
      ready: hits >= 5 && sk.goodDays.length >= 3,
      next: 4,
      progress: [
        { label: 'New-word checks right (out of the last 6)', have: hits, need: 5 },
        { label: 'Days with a new word right', have: sk.goodDays.length, need: 3 },
      ],
    };
  }
  return { ready: false, next: null, progress: [] };
}

// Right answers among the last n tries (counts only when there are n tries).
function lastHits(skill, n) {
  const last = (skill.recent || []).slice(-n);
  return last.length >= n ? last.reduce((a, b) => a + b, 0) : 0;
}

export function soundGrid(child) {
  return teachingOrder(child).map((g) => {
    const snd = child.items[S.itemId('sound', g)];
    const nam = child.items[S.itemId('name', g)];
    return {
      g,
      x: GRAPHEME_MAP[g],
      sound: snd ? S.status(snd) : 'new',
      name: GRAPHEME_MAP[g].digraph ? null : nam ? S.status(nam) : 'new',
    };
  });
}

export function trickyGrid(child) {
  return TRICKY_WORDS.map((w) => {
    const it = child.items[S.itemId('tricky', w)];
    return { w, status: it ? S.status(it) : 'new' };
  });
}

export function wordStats(child) {
  const words = S.itemsOfKind(child.items, 'word');
  return {
    practised: words.length,
    known: words.filter(S.isKnown).length,
  };
}

export function weekSummary(child, today) {
  const start = weekStart(today);
  const bursts = (child.bursts || []).filter((b) => b.day >= start && b.day <= today);
  const days = new Set(bursts.map((b) => b.day));
  const seconds = bursts.reduce((a, b) => a + (b.seconds || 0), 0);
  const moods = bursts.map((b) => b.mood).filter(Boolean);
  const scored = bursts.reduce((a, b) => a + (b.scored || 0), 0);
  const correct = bursts.reduce((a, b) => a + (b.correct || 0), 0);
  return {
    bursts: bursts.length,
    days: days.size,
    minutes: Math.round(seconds / 60),
    stops: bursts.filter((b) => b.stoppedEarly).length,
    moods: { keen: moods.filter((m) => m === 'keen').length, ok: moods.filter((m) => m === 'ok').length, low: moods.filter((m) => m === 'low').length },
    accuracy: scored ? Math.round((correct / scored) * 100) : null,
  };
}

export function todaySummary(child, today) {
  const bursts = (child.bursts || []).filter((b) => b.day === today);
  const last = bursts[bursts.length - 1];
  return {
    count: bursts.length,
    seconds: bursts.reduce((a, b) => a + (b.seconds || 0), 0),
    lastEndedAt: last ? last.endedAt : null,
  };
}

// Suggest a change after several hard bursts, or review after a long break.
export function moodHint(child, today) {
  const recent = (child.bursts || []).slice(-6);
  const low = recent.filter((b) => b.mood === 'low' || b.stoppedEarly).length;
  if (recent.length >= 4 && low >= 3) {
    return 'Several recent bursts ended early or felt hard. Try shorter bursts, a different game, or a break of a few weeks. A break is fine.';
  }
  if (backFromBreak(child, today)) {
    return 'Welcome back. Today is review only, with no new letters. Letters usually come back quickly.';
  }
  return null;
}

