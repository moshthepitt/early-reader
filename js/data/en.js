// English sound inventory, teaching order and tricky words.
//
// Evidence notes (sources in docs/research/report.md):
// - Teach letter names and sounds together (Piasta, Purpura & Wagner 2010, mean age 3.8).
// - Early letters: the child's own name, letters whose name contains their sound
//   (b, d, f, j, k, l, m, n, p, s, t, v, x, z), and sounds you can stretch for blending.
// - The exact order below is a design choice. No study has tested one order against another.

export const LANGUAGE = 'en';

// continuous: the sound can be held ("mmm") which makes blending easier.
// nameHasSound: the letter name contains the sound ("em" has /m/).
// say: the sound itself, as the parent says it inside a script line. Short and clean,
// never with an added "uh". How to make it goes in the tip, never in say.
// kpos: where the sound is in the keyword (default 'start'): "duck" ends with ck.
export const GRAPHEMES = [
  { g: 's', sound: '/s/', say: 'sss', name: 'ess', nameHasSound: true, continuous: true, keyword: 'snake', emoji: '🐍', tip: 'Hiss like a snake: "sssss". Teeth together. Not "suh".' },
  { g: 'a', sound: '/a/', say: 'a', name: 'ay', nameHasSound: false, continuous: true, keyword: 'apple', emoji: '🍎', tip: 'Short "a" as in "at" and "apple". Not the letter name "ay".' },
  { g: 't', sound: '/t/', say: 't', name: 'tee', nameHasSound: true, continuous: false, keyword: 'tiger', emoji: '🐯', tip: 'Quick, whispered "t" from the tip of the tongue. Not "tuh".' },
  { g: 'm', sound: '/m/', say: 'mmm', name: 'em', nameHasSound: true, continuous: true, keyword: 'monkey', emoji: '🐒', tip: 'Lips together and hum: "mmmm". Not "muh".' },
  { g: 'i', sound: '/i/', say: 'i', name: 'eye', nameHasSound: false, continuous: true, keyword: 'insect', emoji: '🐞', tip: 'Short "i" as in "it" and "insect". Not the letter name "eye".' },
  { g: 'n', sound: '/n/', say: 'nnn', name: 'en', nameHasSound: true, continuous: true, keyword: 'nose', emoji: '👃', tip: 'Tongue behind top teeth and hum through the nose: "nnnn". Not "nuh".' },
  { g: 'p', sound: '/p/', say: 'p', name: 'pee', nameHasSound: true, continuous: false, keyword: 'pig', emoji: '🐷', tip: 'Small puff of air from the lips. Hold a hand in front of the mouth to feel it. Not "puh".' },
  { g: 'o', sound: '/o/', say: 'o', name: 'oh', nameHasSound: false, continuous: true, keyword: 'orange', emoji: '🍊', tip: 'Short "o" as in "on" and "orange". Not the letter name "oh".' },
  { g: 'd', sound: '/d/', say: 'd', name: 'dee', nameHasSound: true, continuous: false, keyword: 'dog', emoji: '🐶', tip: 'Quick "d" from the tip of the tongue. Keep it short. Not "duh".' },
  { g: 'f', sound: '/f/', say: 'fff', name: 'ef', nameHasSound: true, continuous: true, keyword: 'fish', emoji: '🐟', tip: 'Top teeth on bottom lip and blow: "ffff". Not "fuh".' },
  { g: 'l', sound: '/l/', say: 'lll', name: 'el', nameHasSound: true, continuous: true, keyword: 'lion', emoji: '🦁', tip: 'Tongue tip up behind the top teeth: "llll". Not "luh".' },
  { g: 'e', sound: '/e/', say: 'e', name: 'ee', nameHasSound: false, continuous: true, keyword: 'egg', emoji: '🥚', tip: 'Short "e" as in "egg" and "bed". Not the letter name "ee".' },
  { g: 'g', sound: '/g/', say: 'g', name: 'jee', nameHasSound: false, continuous: false, keyword: 'goat', emoji: '🐐', tip: 'Hard "g" from the back of the throat, as in "goat". Short. Not "guh". The name "jee" does not help here.' },
  { g: 'c', sound: '/k/', say: 'k', name: 'see', nameHasSound: false, continuous: false, keyword: 'cat', emoji: '🐱', tip: 'A short click from the back of the throat, as in "cat". Not "kuh". The name "see" does not help here.' },
  { g: 'k', sound: '/k/', say: 'k', name: 'kay', nameHasSound: true, continuous: false, keyword: 'key', emoji: '🔑', tip: 'Short click from the back of the throat, same as c. Not "kuh".' },
  { g: 'r', sound: '/r/', say: 'rrr', name: 'ar', nameHasSound: false, continuous: true, keyword: 'rabbit', emoji: '🐰', tip: 'Growl gently like a dog: "rrrr". Not "ruh".' },
  { g: 'h', sound: '/h/', say: 'h', name: 'aitch', nameHasSound: false, continuous: false, keyword: 'hat', emoji: '👒', tip: 'A quick breath out, like fogging a mirror. Not "huh".' },
  { g: 'u', sound: '/u/', say: 'u', name: 'you', nameHasSound: false, continuous: true, keyword: 'umbrella', emoji: '☂️', tip: 'Short "u" as in "up" and "umbrella". Not the letter name "you".' },
  { g: 'b', sound: '/b/', say: 'b', name: 'bee', nameHasSound: true, continuous: false, keyword: 'ball', emoji: '⚽', tip: 'Lips together, then a quick pop. Short. Not "buh".' },
  { g: 'j', sound: '/j/', say: 'j', name: 'jay', nameHasSound: true, continuous: false, keyword: 'juice', emoji: '🧃', tip: 'Short "j" as in "juice". Not "juh".' },
  { g: 'v', sound: '/v/', say: 'vvv', name: 'vee', nameHasSound: true, continuous: true, keyword: 'van', emoji: '🚐', tip: 'Top teeth on bottom lip and buzz: "vvvv". Not "vuh".' },
  { g: 'w', sound: '/w/', say: 'w', name: 'double-you', nameHasSound: false, continuous: false, keyword: 'watermelon', emoji: '🍉', tip: 'Round lips, as if about to blow a kiss, then open: "w". Not "wuh".' },
  { g: 'y', sound: '/y/', say: 'y', name: 'why', nameHasSound: false, continuous: false, keyword: 'yo-yo', emoji: '🪀', tip: 'Short "y" as in "yes" and "yo-yo". Not "yuh". The name "why" does not help here.' },
  { g: 'z', sound: '/z/', say: 'zzz', name: 'zed', nameHasSound: true, continuous: true, keyword: 'zebra', emoji: '🦓', tip: 'Buzz like a bee: "zzzz". Not "zuh".' },
  { g: 'x', kpos: 'end', sound: '/ks/', say: 'ks', name: 'ex', nameHasSound: true, continuous: false, keyword: 'box', emoji: '📦', tip: 'Two quick sounds "ks", as at the end of "box".' },
  { g: 'qu', sound: '/kw/', say: 'kw', name: 'q-u', nameHasSound: false, continuous: false, keyword: 'queen', emoji: '👸', tip: 'Two letters, one sound chunk: "kw" as in "queen".', digraph: true },
  { g: 'ck', kpos: 'end', sound: '/k/', say: 'k', name: 'c-k', nameHasSound: false, continuous: false, keyword: 'duck', emoji: '🦆', tip: 'Two letters, one sound: "k" at the end of "duck".', digraph: true },
  { g: 'ss', kpos: 'end', sound: '/s/', say: 'sss', name: 'double s', nameHasSound: false, continuous: true, keyword: 'dress', emoji: '👗', tip: 'Two letters, one sound: "sss" at the end of "dress".', digraph: true },
  { g: 'll', kpos: 'end', sound: '/l/', say: 'lll', name: 'double l', nameHasSound: false, continuous: true, keyword: 'bell', emoji: '🔔', tip: 'Two letters, one sound: "lll" at the end of "bell".', digraph: true },
  { g: 'ff', kpos: 'end', sound: '/f/', say: 'fff', name: 'double f', nameHasSound: false, continuous: true, keyword: 'puff', emoji: '💨', tip: 'Two letters, one sound: "fff" at the end of "puff".', digraph: true },
  { g: 'sh', sound: '/sh/', say: 'shh', name: 's-h', nameHasSound: false, continuous: true, keyword: 'ship', emoji: '🚢', tip: 'Two letters, one sound: "shhh", like asking for quiet.', digraph: true },
  { g: 'ch', sound: '/ch/', say: 'ch', name: 'c-h', nameHasSound: false, continuous: false, keyword: 'chick', emoji: '🐤', tip: 'Two letters, one sound: a short sneeze "ch" as in "chick".', digraph: true },
  { g: 'th', sound: '/th/', say: 'th', name: 't-h', nameHasSound: false, continuous: true, keyword: 'thumb', emoji: '👍', tip: 'Two letters, one sound: tongue tip between the teeth and blow, as in "thumb". In "this" and "that", add your voice.', digraph: true },
  { g: 'ng', kpos: 'end', sound: '/ng/', say: 'ng', name: 'n-g', nameHasSound: false, continuous: true, keyword: 'ring', emoji: '💍', tip: 'Two letters, one sound: the hum at the end of "ring".', digraph: true },
  { g: 'ee', kpos: 'end', sound: '/ee/', say: 'ee', name: 'double e', nameHasSound: false, continuous: true, keyword: 'bee', emoji: '🐝', tip: 'Two letters, one sound: long "ee" as in "bee".', digraph: true },
  { g: 'oo', kpos: 'middle', sound: '/oo/', say: 'oo', name: 'double o', nameHasSound: false, continuous: true, keyword: 'moon', emoji: '🌙', tip: 'Two letters, one sound: long "oo" as in "moon".', digraph: true },
];

export const GRAPHEME_MAP = Object.fromEntries(GRAPHEMES.map((x) => [x.g, x]));

export const VOWELS = ['a', 'e', 'i', 'o', 'u'];

// Default teaching order. Design choice, not a tested sequence.
export const BASE_ORDER = [
  's', 'a', 't', 'm', 'i', 'n', 'p', 'o', 'd', 'f', 'l', 'e', 'g', 'c', 'k', 'r', 'h', 'u',
  'b', 'j', 'v', 'w', 'y', 'z', 'x', 'qu', 'ck', 'ss', 'll', 'ff', 'sh', 'ch', 'th', 'ng', 'ee', 'oo',
];

// Words that cannot be sounded out with the sounds taught here (or use a sound
// the child has not met, like s saying /z/). Taught as whole words, one at a time,
// in this order, from stage 4.
export const TRICKY_WORDS = [
  'the', 'I', 'a', 'is', 'to', 'no', 'go', 'has', 'his', 'as', 'he', 'she', 'we', 'me', 'be',
  'was', 'my', 'you', 'of', 'said', 'are', 'they', 'all', 'her', 'into', 'so', 'do', 'like', 'come', 'some',
];

// Letter-only sounds (single letters), used for stage 1-2 letter cards.
export const SINGLE_LETTERS = GRAPHEMES.filter((x) => x.g.length === 1).map((x) => x.g);

// Nonsense words used to check real blending must never spell anything rude.
// Checked against both the spelling and the likely pronunciation.
export const NONWORD_BLOCKLIST = [
  'fuk', 'fuc', 'fux', 'fuq', 'fuk', 'phuk', 'cok', 'kok', 'coc', 'koc', 'cox', 'kox', 'dik', 'dic', 'dix',
  'tit', 'tits', 'fag', 'cum', 'kum', 'jiz', 'jis', 'nig', 'nik', 'nyg', 'wog', 'sex', 'sux', 'puss', 'pus',
  'ass', 'arse', 'bum', 'poo', 'pee', 'wee', 'wanc', 'wank', 'god', 'gay', 'hoe', 'ho', 'pis', 'piss',
  'sht', 'shit', 'shat', 'crap', 'damn', 'dam', 'hel', 'hell', 'nob', 'knob', 'bon', 'slut', 'twat', 'git',
  'kik', 'kil', 'kill', 'gun', 'die', 'ded', 'dead', 'fat', 'tard', 'jap', 'paki', 'spic', 'dyk', 'dik',
  'cuk', 'kuk', 'muf', 'puk', 'dum', 'thot', 'tik', 'bich', 'bitch', 'jew', 'kafir',
];
