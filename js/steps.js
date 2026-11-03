// One practice step at a time. Child helpers are called only when building a step.
import { GRAPHEME_MAP, VOWELS } from './data/en.js';
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

// How the parent writes and says sounds. Every line a parent reads aloud is spelled the
// way it is said, so nobody has to turn a description into a sound mid-game.

// The sound on its own: "sss", "t", "a".
const sound = (x) => x.say;

// The sound for the parent's answer box, with its picture word: "a, as in apple".
const soundAnswer = (x) => `${x.say}, as in ${x.keyword}`;

// The first sound of a word, from its spelling: "sh" in "ship", "c" in "cat".
function firstGrapheme(word) {
  const w = word.toLowerCase();
  return ['sh', 'ch', 'th', 'qu'].find((d) => w.startsWith(d)) || w[0];
}

// A word with its first sound drawn out, spelled the way it is said. Sounds you can
// hold are held: "zzzero", "mmmoon", "shhhip". Stop sounds can't be held, so they
// bounce: "p-p-panda", "c-c-cat". Vowels bounce too, because "eeegg" and "ooox" read
// as the long "ee" and "oo". Programmes such as Read Write Inc. call these stretchy
// and bouncy sounds.
export function sayFirst(word) {
  const g = firstGrapheme(word);
  const x = GRAPHEME_MAP[g];
  const start = word.slice(0, g.length);
  if (x?.continuous && !VOWELS.includes(g)) return start + g.slice(-1).repeat(2) + word.slice(g.length);
  return `${start}-${start.toLowerCase()}-${word}`;
}

// A sound with its picture word, so a lone letter like "t" isn't read as its name:
// "t, like t-t-tiger", "ks, like the end of box".
function soundLike(x) {
  if (x.kpos === 'end') return `${sound(x)}, like the end of ${x.keyword}`;
  if (x.kpos === 'middle') return `${sound(x)}, like the middle of ${x.keyword}`;
  return `${sound(x)}, like ${sayFirst(x.keyword)}`;
}

// A word sounded out with no gaps: hold the sounds you can hold, keep stops short
// (Gonzalez-Frey & Ehri 2021). Short e and o are written once, because "eee" and "ooo"
// read as the long sounds in "bee" and "moon". Two-letter sounds hold on their last
// letter ("shhh"), and ng is written once because "nggg" reads as a hard g.
function held(gs) {
  return gs
    .map((g) => {
      if (!GRAPHEME_MAP[g]?.continuous || ['e', 'o', 'ng'].includes(g)) return g;
      if (g.length === 1) return g.repeat(3);
      return g[0] === g[1] ? g[0].repeat(3) : g + g[1].repeat(2);
    })
    .join('');
}

// The model after a miss in Sound it out. A word with nothing to hold ("dog", "bed")
// would read "dog ... dog", so it shows each sound first instead.
function blendModel(gs, w) {
  const h = held(gs);
  return h === w ? `"${sayList(gs)}", then faster with no gaps: "${w}!"` : `"${h} ... ${w}!"`;
}

function sayList(gs) {
  return gs.map((g) => (GRAPHEME_MAP[g] ? sound(GRAPHEME_MAP[g]) : g)).join(' - ');
}

// Build the script and display for each step.

// Adults tend to step in within a second (Rowe 1986), which turns a slow but
// right answer into a miss. Speed itself is not scored: at 4-5, untimed
// letter-sound knowledge predicted reading and a speed measure did not
// (Clayton et al. 2020).
const WAIT = 'Give them a little time to answer before you help.';

// The picture word, said so the sound stands out: "T-t-tiger. Tiger starts with t."
function keywordLine(x) {
  const word = capitalize(x.keyword);
  if (x.kpos === 'end') return `${word} ends with ${sound(x)}.`;
  if (x.kpos === 'middle') return `${word} has ${sound(x)} in the middle.`;
  return `${capitalize(sayFirst(x.keyword))}. ${word} starts with ${sound(x)}.`;
}

// The picture word alone, for the model after a miss: "T-t-tiger." or "Duck ends with k."
function keywordCue(x) {
  return x.kpos ? keywordLine(x) : `${capitalize(sayFirst(x.keyword))}.`;
}

export function introLetterStep(child, g) {
  const x = GRAPHEME_MAP[g];
  const it = x.digraph ? 'the two letters' : 'the letter';
  return {
    type: 'intro-letter',
    title: x.digraph ? `New sound: ${g}` : `New letter: ${g}`,
    child: { big: g, emoji: x.emoji, sub: x.keyword },
    script: [
      x.digraph ? `Point to the two letters. Say: "These two letters make one sound."` : `Point to the letter. Say: "This letter is called '${x.name}'."`,
      `Point to the ${x.emoji}, then ${it}. Say: "${keywordLine(x)} ${x.digraph ? 'These letters say' : 'This letter says'} ${sound(x)}."`,
      `Trace ${x.digraph ? 'them' : 'it'} with a finger while you both say "${sound(x)}". Then draw a big one with a crayon.`,
      `Ask: "What does it say?" Help as much as they need. This first time doesn't count.`,
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
    script: [`Point to the letter (on a printed card, cover the picture). Ask: "What does this one say?"`, WAIT],
    answer: soundAnswer(x),
    model: [`Point to the ${x.emoji}. Say: "${keywordCue(x)} This says ${sound(x)}. Say it with me: ${sound(x)}."`, 'Then ask once more. Only the first try counts.'],
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
    script: [`Ask: "What is this letter called?"`, WAIT, `Then ask: "And what does it say?" Only the name counts.`],
    answer: `'${x.name}' - it says ${soundAnswer(x)}`,
    model: [`Say: "This is '${x.name}'. It says ${soundLike(x)}."`, 'Then ask once more.'],
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
// The word shown first sits on top, apart from the three to choose from. The pictures
// have no labels: the game is by ear, and a child who knows some letters could match
// the labels by sight.
export function firstSoundOralStep(child, content, rng) {
  const easy = ['s', 'm', 'f', 'l', 'n', 'z', 'v', 'r'];
  const pool = content.C.FIRST_SOUND_SETS.filter((x) => (child.stage <= 1 ? easy.includes(x.sound) : true));
  const set = pick(pool.length ? pool : content.C.FIRST_SOUND_SETS, rng);
  const [ex, ...rest] = shuffle(set.words, rng);
  const two = rest.slice(0, 2);
  const odd = set.odd;
  const options = shuffle([...two, odd], rng);
  return {
    type: 'first-sound-oral',
    title: 'Odd one out',
    child: { emoji: ex.emoji, choices: options.map((o) => ({ emoji: o.emoji })) },
    script: [
      `Point to the ${ex.emoji} on top. Say: "${capitalize(sayFirst(ex.w))}. Hear how ${ex.w} starts?"`,
      `Point to each picture below and say it the same way: ${options.map((o) => `${o.emoji} "${sayFirst(o.w)}"`).join(', ')}.`,
      `Ask: "Which one doesn't start like ${ex.w}?"`,
    ],
    answer: `${odd.w} ${odd.emoji}`,
    model: [
      `Point to the ${two[0].emoji} and the ${two[1].emoji}. Say: "${capitalize(sayFirst(two[0].w))}, ${sayFirst(two[1].w)}. They start like ${ex.w}."`,
      `Point to the ${odd.emoji}. Say: "${capitalize(sayFirst(odd.w))}. ${capitalize(odd.w)} starts differently."`,
    ],
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
  return {
    type: 'first-sound-pick',
    title: 'Which letter starts it?',
    child: { emoji: word.emoji, choices: shuffle([target, other], rng).map((g) => ({ letter: g })) },
    script: [
      `Point to the ${word.emoji}. Say: "${capitalize(sayFirst(word.w))}. ${capitalize(word.w)}."`,
      `Point to the two letters (or put out those two tiles). Ask: "Which one does ${word.w} start with?"`,
      WAIT,
    ],
    answer: target,
    model: [`Point to the ${target}. Say: "${capitalize(sayFirst(word.w))}. ${capitalize(word.w)} starts with this letter." Then ask again.`],
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
      `Ask: "Can you sound it out?" Point under each letter as they say its sound.`,
      `Then ask: "What word is it?"`,
      ...(wordEntry.emoji ? ['If they get it, tap "Show picture" to check together.'] : []),
    ],
    answer: wordEntry.w,
    model: [`Point under each letter and show them: ${blendModel(wordEntry.gs, wordEntry.w)}`, 'Then let them try again.'],
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
    child: isNonword ? { word: target.gs, emoji: '👾' } : { word: target.gs },
    script: isNonword
      ? ['Point to the monster. Say: "This monster has a made-up name. Can you sound it out?"', "Don't help this time. This one shows whether they can sound out a word they haven't learned."]
      : ['Say: "Here\'s a new word. Can you sound it out?"', "Don't help this time. This one shows whether they can sound out a word they haven't learned."],
    answer: isNonword ? `${target.w} (made up: "${held(target.gs)}")` : target.w,
    model: [`Point under each letter and show them: ${blendModel(target.gs, target.w)}`],
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
    child: { emoji: wordEntry.emoji || '👂' },
    script: [
      `Say: "Can you make ${wordEntry.w} with your tiles? Say it slowly first."`,
      'Let them pick a tile for each sound. Then show the right spelling and praise the sounds they got.',
    ],
    answer: wordEntry.w,
    model: [`Say ${wordEntry.w} slowly together: "${sayList(wordEntry.gs)}".`, 'Find each tile with them, then point and read it back.'],
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
  // The name card, unless this burst has already shown it.
  if (child.name && !exclude.has('name-card')) return { ...nameCardStep(child), type: 'finish', title: 'Finish on a win' };
  const r = pick(content.C.RHYME_SETS, rng);
  return { type: 'finish', title: 'Finish on a win', child: { sub: `${r.a}, ${r.b}` }, script: [`Say: "${r.a}, ${r.b}... they rhyme!" Make up a silly rhyme together.`, 'Stop while it is still fun.'], scored: false };
}

// Choose the easy last step using this burst's results, including when Stop is pressed.
// `exclude` holds the ids of items missed in this burst.
export function stopStep(child, content, rng = Math.random, exclude = new Set()) {
  return finishStep(child, content, rng, exclude);
}
