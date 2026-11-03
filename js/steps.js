// One practice step at a time. Child helpers are called only when building a step.
import { GRAPHEME_MAP } from './data/en.js';
import * as S from './scheduler.js';
import { pick, shuffle, capitalize } from './util.js';
import { nameInitial, soundsIntroduced, fillNames } from './session.js';

// Praise the process (Kamins & Dweck 1999; Gunderson et al. 2013).
const PRAISE = {
  sound: ['You looked carefully and said the sound.', 'You looked at the shape and remembered the sound.', 'You said the sound clearly.'],
  name: ['You said its name and its sound.', 'You looked carefully at the shape.'],
  blend: ['You said each sound and slid them together.', 'You kept the sounds joined up.', 'You worked it out yourself, sound by sound.'],
  listen: ['You listened carefully.', 'You heard the sounds in the word.', 'You listened for the sounds.'],
  spell: ['You said it slowly and found the sounds.', 'You heard every sound in that word.'],
  tricky: ['You remembered the tricky word.', 'You spotted the tricky part.'],
  text: ['You read every word. Tell me what happened.', 'You pointed to each word as you read.'],
  effort: ['You kept trying.', 'That was a hard one and you stuck with it.'],
};

export function praise(kind, rng = Math.random) {
  return pick(PRAISE[kind] || PRAISE.effort, rng);
}

// Stretch continuous sounds ("mmmaaat") and keep stop sounds short
// (Gonzalez-Frey & Ehri 2021).
function stretched(gs) {
  return gs.map((g) => (GRAPHEME_MAP[g]?.continuous ? g.repeat(g.length > 1 ? 2 : 3) : g)).join('');
}

function sayList(gs) {
  return gs.map((g) => GRAPHEME_MAP[g]?.say.split(' (')[0] || g).join(' - ');
}

// Build the script and display for each step.

// Adults tend to step in within a second (Rowe 1986), which turns a slow but
// right answer into a miss. Speed itself is not scored: at 4-5, untimed
// letter-sound knowledge predicted reading and a speed measure did not
// (Clayton et al. 2020).
const WAIT = 'Give them a little time to answer before you help.';

function keywordLine(x) {
  const sound = x.say.split(' (')[0];
  const word = capitalize(x.keyword);
  if (x.kpos === 'end') return `"${word}" ends with ${sound}.`;
  if (x.kpos === 'middle') return `"${word}" has ${sound} in the middle.`;
  return `"${word}" starts with ${sound}.`;
}

export function introLetterStep(child, g) {
  const x = GRAPHEME_MAP[g];
  const nameLine = x.digraph
    ? `Say: "These two letters together say ${x.say}."`
    : `Say: "This letter is called '${x.name}'. It says ${x.say}, like ${x.keyword}."`;
  return {
    type: 'intro-letter',
    title: x.digraph ? `New sound: ${g}` : `New letter: ${g}`,
    child: { big: g, emoji: x.emoji, sub: x.keyword },
    script: [
      `Show the card (or this screen). ${nameLine}`,
      `Point to the ${x.emoji} picture, then to the letter. Say: ${keywordLine(x)}`,
      `Trace the letter with a finger while you both say ${x.say}. Then draw a big one with a crayon.`,
      `Ask: "What does it say?" Help as much as needed. This first time does not count.`,
    ],
    tip: x.tip,
    scored: false,
    create: [
      { kind: 'sound', key: g },
      ...(x.digraph ? [] : [{ kind: 'name', key: g }]),
    ],
  };
}

export function letterSoundStep(child, item) {
  const x = GRAPHEME_MAP[item.key];
  // Pictures help while teaching (de Graaff et al. 2007), so the introduction and
  // the model after a miss show one. The scored check shows the letter alone, so a
  // right answer means they know the letter, not the picture. That split is our
  // judgement, not a tested rule.
  return {
    type: 'letter-sound',
    title: 'What sound?',
    child: { big: item.key, hint: x.emoji },
    script: [`Point to the letter, with any picture covered. Ask: "What does this one say?"`, WAIT],
    answer: x.say,
    model: [`Say: "This says ${x.say}, like ${x.keyword} ${x.emoji}. Say it with me: ${x.say}."`, 'Then ask once more. Only the first try counts.'],
    tip: x.tip,
    praise: 'sound',
    scored: true,
    itemId: item.id,
  };
}

export function letterNameStep(child, item) {
  const x = GRAPHEME_MAP[item.key];
  return {
    type: 'letter-name',
    title: 'What is it called?',
    child: { big: item.key },
    script: [`Ask: "What is this letter called?"`, WAIT, `Then ask: "And what does it say?" This part does not count towards the score.`],
    answer: `${x.name} (says ${x.say})`,
    model: [`Say: "This is '${x.name}'. It says ${x.say}."`, 'Then ask once more.'],
    praise: 'name',
    scored: true,
    itemId: item.id,
  };
}

// Rhyme is played together, not scored: it isn't needed before letters and sounds
// (Brady 2020). Show one first, then let them try (Letters and Sounds, Phase One).
export function rhymeStep(child, content, rng) {
  const [m, r] = shuffle(content.C.RHYME_SETS, rng);
  const [first, second] = shuffle([r.b, r.odd], rng);
  return {
    type: 'rhyme',
    title: 'Rhyme time',
    child: { sub: `${r.a} ... ${first} or ${second}?` },
    script: [
      `Show them first: "${m.a}, ${m.b}. They rhyme. They sound the same at the end."`,
      `Then ask: "Which one rhymes with ${r.a}: ${first} or ${second}?" (It's ${r.b}.)`,
      'Say the words slowly. If they aren\'t sure, say the rhyme together. Keep it playful.',
    ],
    scored: false,
  };
}

// Clapping is played together too. Clapping and then counting tests copying more
// than hearing, so the script shows where the beats fall and nothing is scored.
export function syllableStep(child, content, rng) {
  const words = content.C.SYLLABLE_WORDS;
  // Mostly one and two beats; longer words now and then.
  const s = pick(rng() < 0.75 ? words.filter((x) => x.n <= 2) : words, rng);
  return {
    type: 'syllables',
    title: 'Clap the beats',
    child: { emoji: s.emoji },
    script: [
      `Say "${s.w}". Then say it slowly in beats, clapping on each one: "${s.parts.join('\u00a0·\u00a0')}"\u00a0${'👏'.repeat(s.n)}`,
      'Do it together, then let them try on their own. Counting the claps is optional.',
    ],
    tipTitle: 'How to find the beats',
    tip: 'Put the back of your hand under your chin and say the word slowly. Each time your chin drops is a beat. Tapping knees or stamping feet works as well as clapping.',
    scored: false,
  };
}

function findFirstSoundSet(content, g) {
  const key = g === 'c' ? 'k' : g;
  return content.C.FIRST_SOUND_SETS.find((x) => x.sound === key);
}

// Ask which word starts differently, using speech only, after showing one word
// that starts with the sound
// (Sound Foundations, Byrne et al. 2000, discussed in docs/research/report.md).
export function firstSoundOralStep(child, content, rng) {
  const easy = ['s', 'm', 'f', 'l', 'n', 'z', 'v', 'r'];
  const pool = content.C.FIRST_SOUND_SETS.filter((x) => (child.stage <= 1 ? easy.includes(x.sound) : true));
  const set = pick(pool.length ? pool : content.C.FIRST_SOUND_SETS, rng);
  const x = GRAPHEME_MAP[set.sound];
  const [ex, ...rest] = shuffle(set.words, rng);
  const two = rest.slice(0, 2);
  const options = shuffle([...two, set.odd], rng);
  return {
    type: 'first-sound-oral',
    title: 'Odd one out',
    child: { choices: options.map((o) => ({ emoji: o.emoji, label: o.w })) },
    script: [
      `Show one first: "${ex.w}... ${x.say.split(' (')[0]}-${ex.w}. ${capitalize(ex.w)} starts with ${x.say.split(' (')[0]}."`,
      `Name each picture, stretching the first sound: ${options.map((o) => `"${o.w}"`).join(', ')}.`,
      `Ask: "Which one does not start with ${x.say.split(' (')[0]}?"`,
    ],
    answer: set.odd.w,
    model: [`Say: "${two[0].w} and ${two[1].w} both start with ${x.say.split(' (')[0]}. ${set.odd.w} starts differently."`],
    praise: 'listen',
    scored: true,
    skill: 'first-sound',
  };
}

// Which letter does this word start with? Uses letters the child has met.
export function firstSoundPickStep(child, content, rng) {
  const have = [...soundsIntroduced(child)].filter((g) => g.length === 1 && findFirstSoundSet(content, g));
  if (have.length < 2) return null;
  const target = pick(have, rng);
  const other = pick(have.filter((g) => g !== target && !(['c', 'k'].includes(g) && ['c', 'k'].includes(target))), rng);
  if (!other) return null;
  const set = findFirstSoundSet(content, target);
  let word = pick(set.words, rng);
  if (target === 'c' || target === 'k') {
    const matching = set.words.filter((w) => w.w.startsWith(target));
    if (!matching.length) return null;
    word = pick(matching, rng);
  }
  const x = GRAPHEME_MAP[target];
  return {
    type: 'first-sound-pick',
    title: 'Which letter starts it?',
    child: { emoji: word.emoji, choices: shuffle([target, other], rng).map((g) => ({ letter: g })) },
    script: [
      `Say: "${word.w}... ${x.say.split(' (')[0]}-${word.w}." Stretch the first sound.`,
      `Ask: "Which letter makes the first sound in ${word.w}?" (Use letter tiles or point on screen.)`,
    ],
    answer: target,
    model: [`Say: "${word.w} starts with ${x.say.split(' (')[0]}. This letter says ${x.say.split(' (')[0]}." Point to ${target}.`],
    praise: 'listen',
    scored: true,
    skill: 'first-sound',
  };
}

// Robot talk: the parent says the word in parts and the child joins it up.
// Say what to listen for before the sounds, so nothing comes between the sounds and
// the answer (Letters and Sounds, Phase One). If it is too hard, programmes show the
// answer, give two pictures to point to and use bigger parts (Phillips et al. 2008).
export function oralBlendStep(child, content, rng) {
  const words = content.C.WORDS.filter((w) => w.pattern === 'cvc' && w.emoji);
  const easyStart = words.filter((w) => GRAPHEME_MAP[w.gs[0]]?.continuous);
  const [w, ex] = shuffle(easyStart.length > 1 ? easyStart : words, rng);
  const chunks = child.stage <= 1;
  const split = (x) => `${GRAPHEME_MAP[x.gs[0]].say.split(' (')[0]} ... ${x.w.slice(x.gs[0].length)}`;
  const said = chunks ? split(w) : sayList(w.gs);
  const other = pick(words.filter((x) => x.gs[0] !== w.gs[0] && x.emoji !== w.emoji), rng);
  const big = pick(content.C.SYLLABLE_WORDS.filter((x) => x.n === 2), rng);
  return {
    type: 'oral-blend',
    title: 'Robot talk',
    child: { reveal: w.emoji, sub: 'Listen...', pair: shuffle([w.emoji, other.emoji], rng) },
    script: [`Say: "Listen to the robot. What's the word?"`, `Then talk like a robot: "${said}".`, `${WAIT} Then tap the card to show the picture.`],
    tipTitle: 'How robot talk works',
    tip: `Try one yourself first: "${chunks ? split(ex) : sayList(ex.gs)}" ... "${ex.w}". Hold sounds like mmm and sss, and keep the parts close together. Don't add "uh". If they get stuck, say it again closer together until it is the word.`,
    answer: w.w,
    model: [
      `Point to the two pictures. Say "${split(w)}" and let them point to the one the robot said.`,
      `Then say it together, closer each time, until it is the word: "${w.w}!"`,
      `Still hard? Try bigger parts another time, like "${big.parts.join(' ... ')}" ... "${big.w}".`,
    ],
    praise: 'listen',
    scored: true,
    skill: 'oral-blend',
  };
}

export function blendWordStep(child, content, wordEntry, item) {
  return {
    type: 'blend-word',
    title: 'Sound it out',
    child: { word: wordEntry.gs, reveal: wordEntry.emoji || null },
    script: [
      `Point under each letter as they say its sound. Keep the sounds joined with no gaps: "${stretched(wordEntry.gs)}".`,
      `Ask: "What word is it?" Then show the picture if there is one.`,
    ],
    answer: wordEntry.w,
    model: [`Point and show them how: "${stretched(wordEntry.gs)} ... ${wordEntry.w}!" Then let them try again.`],
    praise: 'blend',
    scored: true,
    itemId: item ? item.id : `word:${wordEntry.w}`,
    create: item ? undefined : [{ kind: 'word', key: wordEntry.w }],
  };
}

export function blendCheckStep(child, content, target, isNonword) {
  return {
    type: 'blend-check',
    title: isNonword ? 'Monster word check' : 'New word check',
    child: { word: target.gs },
    script: isNonword
      ? ['This is a made-up monster name. Say: "Can you sound out the monster\'s name?"', 'Do not help on this first try. It shows whether they can blend without relying on memory.']
      : ['This word is new to them. Say: "Can you sound this one out?"', 'Do not help on this first try. It shows whether they can blend without relying on memory.'],
    answer: isNonword ? `${target.w} (made-up: "${stretched(target.gs)}")` : target.w,
    model: [`After their try, show them how: "${stretched(target.gs)} ... ${target.w}".`],
    praise: 'blend',
    scored: true,
    skill: 'blend-unseen',
    seenWord: target.w,
  };
}

export function spellStep(child, content, wordEntry) {
  return {
    type: 'spell-word',
    title: 'Build it with tiles',
    child: { emoji: wordEntry.emoji || null, sub: wordEntry.emoji ? '' : 'Listen...' },
    script: [
      `Say the word: "${wordEntry.w}". Ask them to say it slowly and pick a tile for each sound.`,
      `Accept close attempts. Then show the right spelling and praise the sounds they got right.`,
    ],
    answer: wordEntry.w,
    model: [`Say it slowly together, one sound at a time: ${sayList(wordEntry.gs)}. Build it with them.`],
    praise: 'spell',
    scored: true,
    skill: 'spelling',
  };
}

export function introTrickyStep(word) {
  return {
    type: 'intro-tricky',
    title: `New tricky word: ${word}`,
    child: { big: word },
    script: [
      `Say: "This is a tricky word. It says '${word}'. Part of it does not sound like its letters."`,
      `Sound out the letters that do work, then point to the tricky part.`,
      `Point to the word and say it together three times.`,
    ],
    scored: false,
    create: [{ kind: 'tricky', key: word }],
  };
}

export function trickyStep(item) {
  return {
    type: 'tricky-word',
    title: 'Tricky word',
    child: { big: item.key },
    script: ['Ask: "What does this tricky word say?"', WAIT],
    answer: item.key,
    model: [`Say: "This says '${item.key}'. It is tricky because part of it does not sound like its letters." Then ask again.`],
    praise: 'tricky',
    scored: true,
    itemId: item.id,
  };
}

export function readTextStep(child, sentence, siblingName) {
  return {
    type: 'read-text',
    title: 'Read a sentence',
    child: { text: fillNames(sentence, child, siblingName) },
    script: [
      'Ask them to point to each word and sound it out. They can say tricky words without sounding them out.',
      'Afterwards ask: "What happened?" or "Who was in it?"',
    ],
    answer: fillNames(sentence, child, siblingName),
    model: ['Read it together, pointing to each word. Then let them read it again on their own.'],
    praise: 'text',
    scored: true,
    skill: 'text',
  };
}

export function nameCardStep(child) {
  const g = nameInitial(child.name);
  const x = g ? GRAPHEME_MAP[g] : null;
  return {
    type: 'name-card',
    title: 'My name',
    child: { text: child.name },
    script: [
      `Show their name. Say: "This says ${child.name}! Your name."`,
      x ? `Point to the first letter: "This is '${x.name}'. It says ${x.say}."` : 'Point to the first letter and name it.',
      'Let them point to it and say it too.',
    ],
    scored: false,
  };
}

export function finishStep(child, content, rng, exclude = new Set()) {
  // Finish with the best-known item, leaving out anything missed in this burst.
  const best = Object.values(child.items)
    .filter((it) => (it.kind === 'sound' || it.kind === 'word') && S.isKnown(it) && !exclude.has(it.id))
    .sort((a, b) => b.box - a.box || b.goodDays.length - a.goodDays.length)[0];
  if (best && best.kind === 'sound') {
    const x = GRAPHEME_MAP[best.key];
    return { type: 'finish', title: 'Finish on a win', child: { big: best.key, emoji: x.emoji }, script: ['Show one they know well. Ask: "What does this one say?"', 'Celebrate, then stop while it is still fun.'], answer: x.say, scored: false };
  }
  if (best && best.kind === 'word') {
    const w = content.lexicon.get(best.key);
    if (w) return { type: 'finish', title: 'Finish on a win', child: { word: w.gs, reveal: w.emoji || null }, script: ['A word they know well. Let them read it.', 'Celebrate, then stop while it is still fun.'], answer: w.w, scored: false };
  }
  if (child.name) return { ...nameCardStep(child), type: 'finish', title: 'Finish on a win' };
  const r = pick(content.C.RHYME_SETS, rng);
  return { type: 'finish', title: 'Finish on a win', child: { sub: `${r.a}, ${r.b}` }, script: [`Say: "${r.a}, ${r.b}... they rhyme!" Make up a silly rhyme together.`, 'Stop while it is still fun.'], scored: false };
}


// Choose the easy last step using this burst's results, including when Stop is pressed.
// `exclude` holds the ids of items missed in this burst.
export function stopStep(child, content, rng = Math.random, exclude = new Set()) {
  return finishStep(child, content, rng, exclude);
}

