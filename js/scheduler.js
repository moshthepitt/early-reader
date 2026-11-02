// Spaced review for letter sounds, letter names, practice words and tricky words.
//
// Evidence: spacing helps preschoolers (Vlach et al. 2008; Seabrook et al. 2005),
// learning tracks the number of different days (Childers & Tomasello 2002),
// and asking again after growing delays beats rewards (Fritz et al. 2007).
// Intervals and thresholds below are design choices extrapolated from that work.

import { addDays, weekStart } from './util.js';

// Days until the next review, by box.
const INTERVALS = [0, 1, 2, 4, 7, 14, 30];
const MAX_BOX = INTERVALS.length - 1;

// "Known" = right on the first try on this many different days, and not currently failing.
// A right answer after a miss the same day does not count: the child was shown the
// answer that day, and recall soon after a correction is weak evidence of memory
// (Fritz et al. 2007 tested recall again after a delay). Two days is a design choice.
const KNOWN_DAYS = 2;
// "Secure" = right on 3+ different days and spaced out to a week or more.
const SECURE_DAYS = 3;

export function itemId(kind, key) {
  return `${kind}:${key}`;
}

export function newItem(kind, key, today) {
  return {
    id: itemId(kind, key),
    kind,
    key,
    box: 0,
    due: today,
    introduced: today,
    lastSeen: null,
    goodDays: [],
    attempts: 0,
    firstTryCorrect: 0,
    lastResult: null,
    lastMissed: null,
  };
}

// Record one first-try result. Returns a new item; does not mutate.
export function review(item, correct, today) {
  const next = { ...item, goodDays: [...item.goodDays], attempts: item.attempts + 1, lastSeen: today, lastResult: correct };
  if (!correct) {
    // Missed: back to the start, try again in a later burst today.
    next.box = 0;
    next.due = today;
    next.lastMissed = today;
    return next;
  }
  next.firstTryCorrect += 1;
  if (item.lastMissed === today) {
    // Right after being shown it earlier today: good practice, not yet a good day.
    next.box = 1;
    next.due = addDays(today, INTERVALS[1]);
  } else if (!next.goodDays.includes(today)) {
    next.goodDays.push(today);
    next.box = Math.min(item.box + 1, MAX_BOX);
    next.due = addDays(today, INTERVALS[next.box]);
  }
  return next;
}

export function status(item) {
  if (!item) return 'new';
  const missedLastTime = item.lastResult === false || (!!item.lastMissed && item.lastMissed === item.lastSeen);
  if (missedLastTime || item.box === 0) return item.goodDays.length ? 'wobbly' : 'learning';
  if (item.goodDays.length >= SECURE_DAYS && item.box >= 4) return 'secure';
  if (item.goodDays.length >= KNOWN_DAYS) return 'known';
  return 'learning';
}

export function isKnown(item) {
  const s = status(item);
  return s === 'known' || s === 'secure';
}

function isDue(item, today) {
  return item.due <= today;
}

// Due items, weakest first.
export function dueItems(items, today, kinds = null) {
  return Object.values(items)
    .filter((it) => (!kinds || kinds.includes(it.kind)) && isDue(it, today))
    .sort((a, b) => a.box - b.box || (a.due < b.due ? -1 : a.due > b.due ? 1 : 0) || a.attempts - b.attempts);
}

export function itemsOfKind(items, kind) {
  return Object.values(items).filter((it) => it.kind === kind);
}

function introducedThisWeek(items, kind, today) {
  const start = weekStart(today);
  return itemsOfKind(items, kind).filter((it) => it.introduced >= start && it.introduced <= today).length;
}

function introducedToday(items, kind, today) {
  return itemsOfKind(items, kind).filter((it) => it.introduced === today).length;
}

// Share of first-try successes over the last n scored attempts in the log.
function recentAccuracy(log, n = 12) {
  const recent = log.filter((e) => e.scored).slice(-n);
  if (!recent.length) return null;
  return recent.filter((e) => e.correct).length / recent.length;
}

// Whether to add a new letter (or tricky word) today.
// Rules: a cap per week (2-4 letters a week, Vadasy & Sanders 2021 found a faster
// pace did not dilute learning), at most one new item a day, few wobbly items,
// and recent success near 80% (Rosenshine 2012; "effortful but successful").
export function canIntroduce({ items, log, kind, today, perWeek, maxShaky = 3, minAccuracy = 0.75 }) {
  if (introducedToday(items, kind, today) >= 1) return { ok: false, reason: 'One new item a day is plenty.' };
  if (introducedThisWeek(items, kind, today) >= perWeek) return { ok: false, reason: `Already ${perWeek} new this week.` };
  const shaky = itemsOfKind(items, kind).filter((it) => !isKnown(it)).length;
  if (shaky >= maxShaky) return { ok: false, reason: `${shaky} still being learned. Review first.` };
  const acc = recentAccuracy(log);
  const scoredCount = log.filter((e) => e.scored).length;
  if (acc !== null && scoredCount >= 5 && acc < minAccuracy) {
    return { ok: false, reason: `Recent success ${Math.round(acc * 100)}%. Aim for about 80% before adding more.` };
  }
  return { ok: true };
}
