// Practice texts: pick checked sentences and stories, build a prompt for any AI
// chat tool, and check whatever text comes back.
//
// Remove family names from the word list and topic before building the prompt.
// Stories use {NAME} placeholders, filled in on this device only.

import { checkText } from './decodable.js';
import { redactNames } from './util.js';
import { practiceSounds, trickyIntroduced, textContext } from './session.js';

// Never list a word that matches a family member's name, so prompts cannot contain it.
function allowedWordList(child, content, excludeNames = []) {
  const sounds = practiceSounds(child, content);
  const skip = new Set([child.name, ...excludeNames].filter(Boolean).map((n) => n.toLowerCase()));
  return content.C.WORDS.filter((w) => !skip.has(w.w) && w.gs.every((g) => sounds.has(g))).map((w) => (w.pos === 'name' ? w.w[0].toUpperCase() + w.w.slice(1) : w.w));
}

export function buildTextPrompt(child, content, { kind = 'story', lines = 5, topic = '', excludeNames = [] } = {}) {
  const words = allowedWordList(child, content, excludeNames);
  const tricky = trickyIntroduced(child);
  const cleanTopic = redactNames(topic.trim().slice(0, 120), [child.name, ...excludeNames]);
  const topicLine = cleanTopic ? `Topic: ${cleanTopic}.` : 'Topic: something a preschooler enjoys (animals, a park, a snack, a pet, a bath, a hat).';
  return [
    `Write a ${kind === 'story' ? `tiny story of ${lines} short sentences` : `list of ${lines} separate short sentences`} for a 4-year-old who is just learning to sound out words.`,
    '',
    'STRICT RULES:',
    '1. Use ONLY words from the ALLOWED WORDS list below, plus the TRICKY WORDS list. No other words at all, not even "and", "the" or "a" unless they appear in a list.',
    '2. You may add -s to a listed word (cat -> cats) and use \'s for ownership (Sam\'s).',
    '3. Use {NAME} for the main character (the child) and {NAME2} for a second character if you need one. Do not invent other names unless they are in the list.',
    '4. 3 to 7 words per sentence. Each sentence starts with a capital letter and ends with . ! or ?',
    `5. ${kind === 'story' ? 'Give it a beginning, a small problem or surprise, and a happy ending, so the child can retell it.' : 'Each sentence should make sense on its own and be easy to picture.'}`,
    '6. Use warm, simple and kind language. Nothing scary.',
    '7. Output only the sentences, one per line. If it is a story, put a short title on the first line using the same rules.',
    '',
    topicLine,
    '',
    `ALLOWED WORDS (${words.length}): ${words.join(', ')}`,
    '',
    `TRICKY WORDS: ${tricky.length ? tricky.join(', ') : '(none yet - do not use "the", "a", "I", "is" or "to")'}`,
  ].join('\n');
}

export function checkPasted(text, child, content, siblingName) {
  const ctx = textContext(child, content, siblingName);
  const lines = text
    .split(/\n+/)
    .map((l) => l.trim())
    .filter(Boolean);
  return lines.map((line) => ({ line, result: checkText(line, ctx) }));
}

export function explainStatus(t) {
  switch (t.status) {
    case 'decodable':
      return 'Can sound it out';
    case 'tricky':
      return 'Tricky word already taught';
    case 'name':
      return 'Name';
    case 'tricky-untaught':
      return 'Tricky word not taught yet';
    case 'needs':
      return `Needs sounds not taught yet: ${t.missing.join(', ')}`;
    case 'unlisted':
      return t.missing && t.missing.length
        ? `Not in the word list. Needs sounds not taught yet: ${t.missing.join(', ')}`
        : 'Not in the word list. It looks possible to sound out, but check that it sounds like its letters';
    case 'unsupported':
      return 'Contains numbers, symbols or letters outside the English alphabet. Write it in plain words';
    default:
      return 'Unknown word';
  }
}

