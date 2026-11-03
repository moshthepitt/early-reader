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
  text: ['You read every word yourself.', 'You pointed to each word as you read.'],
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
// Every word said has its picture on the card: the example pair on top, then the word
// to rhyme with and the two to choose from.
export function rhymeStep(child, content, rng) {
  const sets = content.C.RHYME_SETS;
  const r = pick(sets, rng);
  // An example pair that shares no word or look-alike picture with the question, so a
  // word they just heard rhyme isn't the wrong answer next.
  const onCard = [r.a, r.b, r.odd];
  const m = pick(
    sets.filter((x) => x !== r && [x.a, x.b].every((e) => onCard.every((o) => o.w !== e.w && !content.C.lookAlike(o.emoji, e.emoji)))),
    rng,
  );
  const [first, second] = shuffle([r.b, r.odd], rng);
  return {
    type: 'rhyme',
    title: 'Rhyme time',
    child: { example: [m.a.emoji, m.b.emoji], emoji: r.a.emoji, choices: [first, second].map((o) => ({ emoji: o.emoji })) },
    script: [
      `Point to the ${m.a.emoji} and ${m.b.emoji} on top. Say: "${capitalize(m.a.w)}, ${m.b.w}. They rhyme. They sound the same at the end."`,
      `Point to the ${r.a.emoji}, then the two below. Ask: "Which one rhymes with ${r.a.w}: ${first.w} or ${second.w}?"`,
      `Not sure? Say it together: "${capitalize(r.a.w)}, ${r.b.w}. They rhyme!"`,
    ],
    answer: r.b.w,
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
      `Point to the ${s.emoji}. Say: "${capitalize(s.w)}."`,
      s.n === 1
        ? `Say it again with one clap: "${s.w}"\u00a0👏`
        : `Say it again in beats, one clap each: "${s.parts.join('\u00a0·\u00a0')}"\u00a0${'👏'.repeat(s.n)}`,
      'Now together. Then let them try on their own. No need to count the claps.',
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
  const easy = ['s', 'm', 'f', 'l', 'n', 'r'];
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
// The picture stays hidden until they have answered, so it can't give the word away
// and the two pictures after a miss are still a real choice.
export function oralBlendStep(child, content, rng) {
  const words = content.C.WORDS.filter((w) => w.pattern === 'cvc' && w.emoji);
  const easyStart = words.filter((w) => GRAPHEME_MAP[w.gs[0]]?.continuous);
  const w = pick(easyStart.length ? easyStart : words, rng);
  const chunks = child.stage <= 1;
  const onset = (x) => sound(GRAPHEME_MAP[x.gs[0]]);
  const rime = (x) => x.w.slice(x.gs[0].length);
  const split = `${onset(w)} ... ${rime(w)}`; // "mmm ... an"
  const said = chunks ? split : sayList(w.gs);
  // The second picture after a miss starts with another sound and can't be mistaken for the first.
  const other = pick(words.filter((x) => x.gs[0] !== w.gs[0] && x.emoji !== w.emoji && !content.C.lookAlike(x.emoji, w.emoji)), rng);
  return {
    type: 'oral-blend',
    title: 'Robot talk',
    child: { reveal: w.emoji, sub: 'Listen...', pair: shuffle([w.emoji, other.emoji], rng) },
    script: [
      `Say: "Listen to the robot. What's the word?"`,
      `Then talk like a robot: "${said}".`,
      `Wait for their answer. If they get it, tap "Show picture" to check together.`,
    ],
    tipTitle: 'How robot talk works',
    tip: 'Hold sounds like mmm and sss, and keep the parts close together. Don\'t add "uh" between them. Try the robot voice quietly to yourself before you start.',
    answer: w.w,
    model: [
      `Point to the two pictures. Say: "${split}. Which one is it?"`,
      `Then say it together, closer each time: "${split}", "${onset(w)}${rime(w)}", "${w.w}!"`,
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
    // Once built with tiles, the word isn't new any more, so it can't come back as a new-word check.
    seenWord: wordEntry.w,
  };
}

// The part of each tricky word that doesn't do what its letters usually do: what to
// point to, and what to say about it.
const TRICKY_PARTS = {
  the: ['e', 'This e says uh: thuh.'],
  I: ['I', 'On its own, this letter is a word. It says its name: I.'],
  a: ['a', 'On its own, this letter is a word. It says uh.'],
  is: ['s', 'This s says zzz: izzz.'],
  to: ['o', 'This o says oo: too.'],
  no: ['o', 'This o says its name: oh.'],
  go: ['o', 'This o says its name: oh.'],
  has: ['s', 'This s says zzz: hazzz.'],
  his: ['s', 'This s says zzz: hizzz.'],
  as: ['s', 'This s says zzz: azzz.'],
  he: ['e', 'This e says its name: ee.'],
  she: ['e', 'This e says its name: ee.'],
  we: ['e', 'This e says its name: ee.'],
  me: ['e', 'This e says its name: ee.'],
  be: ['e', 'This e says its name: ee.'],
  was: ['a and the s', 'These say o and zzz: wozzz.'],
  my: ['y', 'This y says eye.'],
  you: ['o and u', 'These two say oo.'],
  of: ['f', 'This f says vvv: ovvv.'],
  said: ['a and i', 'These two say e, like in bed: sed.'],
  are: ['whole word', 'It says ar.'],
  they: ['e and y', 'These two say ay.'],
  all: ['a', 'This a says aw.'],
  her: ['e and r', 'These two say ur.'],
  into: ['o', 'This o says oo: in-too.'],
  so: ['o', 'This o says its name: oh.'],
  do: ['o', 'This o says oo.'],
  like: ['i and the e', 'This i says its name, eye. The e is quiet.'],
  come: ['o and the e', 'This o says u, like in up. The e is quiet.'],
  some: ['o and the e', 'This o says u, like in up. The e is quiet.'],
};

export function introTrickyStep(word) {
  const [part, note] = TRICKY_PARTS[word] || ['tricky part', 'This part does not sound like its letters.'];
  return {
    type: 'intro-tricky',
    title: `New tricky word: ${word}`,
    child: { big: word },
    script: [
      `Point to the word. Say: "This is a tricky word. It says '${word}'."`,
      `Point to the ${part}. Say: "${note}"`,
      `Say it together three times: "${word}, ${word}, ${word}."`,
    ],
    scored: false,
    create: [{ kind: 'tricky', key: word }],
  };
}

export function trickyStep(item) {
  const [, note] = TRICKY_PARTS[item.key] || [null, 'Part of it does not sound like its letters.'];
  return {
    type: 'tricky-word',
    title: 'Tricky word',
    child: { big: item.key },
    script: ['Ask: "What does this tricky word say?"', WAIT],
    answer: item.key,
    model: [`Say: "This says '${item.key}'. ${note}" Then ask again.`],
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
      'Say: "Read this to me. Point to each word as you go."',
      'They sound out each word. Tricky words they can just say.',
      'Then ask: "What did it say?"',
    ],
    answer: fillNames(sentence, child, siblingName),
    model: ['Read it together, pointing to each word. Then let them read it again on their own.'],
    praise: 'text',
    scored: true,
    skill: 'text',
  };
}

// A name's first letter often says something other than the sound we teach for it:
// vowels (Imani, Ian, Ivy, Eunice, Amos, Owen), c, g, x and y (Cynthia, George, Xavier,
// Yvonne), and a letter followed by h (Chebet, Shiro, Philip). Then the card names the
// letter and the parent says the name the way they always do.
function nameSoundIsTaught(name, g) {
  if (!g || VOWELS.includes(g) || ['c', 'g', 'x', 'y'].includes(g)) return false;
  const plain = name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/^[^\p{L}]+/u, '');
  return plain[g.length] !== 'h';
}

// "Ch-ch-Chebet", "I-i-Imani": the start of a name, bounced, for the parent to say their way.
function bounceName(name) {
  const start = /^(ch|sh|th|ph|wh)/i.test(name) ? name.slice(0, 2) : name[0];
  return `${start}-${start.toLowerCase()}-${name}`;
}

export function nameCardStep(child) {
  const g = nameInitial(child.name);
  const x = g ? GRAPHEME_MAP[g] : null;
  return {
    type: 'name-card',
    title: 'My name',
    child: { text: child.name },
    script: [
      `Point to their name. Say: "This says ${child.name}. Your name!"`,
      x ? `Point to the first letter. Say: "This is '${x.name}'. It's the first letter of ${child.name}."` : 'Point to the first letter and say its name.',
      ...(!x
        ? []
        : nameSoundIsTaught(child.name, g)
          ? [`Say: "${sayFirst(child.name)}. ${child.name} starts with ${sound(x)}."`]
          : [`Say their name slowly, the way you always say it: "${bounceName(child.name)}."`]),
      'Let them point to the first letter and say it too.',
    ],
    scored: false,
  };
}

// The easy last step. `exclude` holds the ids of items missed in this burst, and
// 'name-card' if the burst has already shown it. `opts.stopped` is set after Stop.
export function finishStep(child, content, rng, exclude = new Set(), opts = {}) {
  const out = opts.stopped ? ['Tired or upset? Skip this, give them a hug and tap Finish.'] : [];
  const end = 'Stop there, while it is still fun.';
  // Finish with the best-known item, leaving out anything missed in this burst.
  const best = Object.values(child.items)
    .filter((it) => (it.kind === 'sound' || it.kind === 'word') && S.isKnown(it) && !exclude.has(it.id))
    .sort((a, b) => b.box - a.box || b.goodDays.length - a.goodDays.length)[0];
  if (best && best.kind === 'sound') {
    const x = GRAPHEME_MAP[best.key];
    return {
      type: 'finish',
      title: 'Finish on a win',
      child: { big: best.key, reveal: x.emoji },
      script: [...out, 'Point to the letter. Ask: "What does this one say?"', 'Then tap "Show picture" and cheer.', end],
      answer: soundAnswer(x),
      scored: false,
    };
  }
  if (best && best.kind === 'word') {
    const w = content.lexicon.get(best.key);
    if (w) {
      return {
        type: 'finish',
        title: 'Finish on a win',
        child: { word: w.gs, reveal: w.emoji || null },
        script: [...out, 'Ask: "Can you read this one?"', w.emoji ? 'Then tap "Show picture" and cheer.' : 'Then cheer.', end],
        answer: w.w,
        scored: false,
      };
    }
  }
  if (child.name && !exclude.has('name-card')) {
    const card = nameCardStep(child);
    return { ...card, type: 'finish', title: 'Finish on a win', script: [...out, ...card.script, end] };
  }
  const r = pick(content.C.RHYME_SETS, rng);
  return {
    type: 'finish',
    title: 'Finish on a win',
    child: { choices: [r.a, r.b].map((o) => ({ emoji: o.emoji })) },
    script: [...out, `Point to the ${r.a.emoji} and the ${r.b.emoji}. Say: "${capitalize(r.a.w)}, ${r.b.w}. They rhyme!"`, `Ask: "What else rhymes with ${r.a.w}?" Made-up words count.`, end],
    scored: false,
  };
}

// Choose the easy last step using this burst's results, including when Stop is pressed.
// `exclude` holds the ids of items missed in this burst.
export function stopStep(child, content, rng = Math.random, exclude = new Set(), opts = {}) {
  return finishStep(child, content, rng, exclude, opts);
}
