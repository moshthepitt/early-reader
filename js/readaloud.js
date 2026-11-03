// Story time coaching: dialogic reading, pointing at print, and sound prompts.
//
// Evidence: dialogic reading raised preschoolers' expressive vocabulary (Mol et al. 2008,
// d = 0.59; larger for younger children); preschoolers look at print under 5% of the time
// unless adults point it out (Evans & Saint-Aubin 2005); pointing out print helped reading
// two years later (Piasta et al. 2012); parents in the Tender Shoots trial who talked about
// word sounds helped beginning reading a year later (doi:10.1002/rrq.500).

import { redactNames } from './util.js';

export const PEER = [
  { step: 'Ask', text: 'Ask a question about the page.' },
  { step: 'Praise or help', text: 'If the answer is right, praise what they noticed. If not, gently give the right word.' },
  { step: 'Add a little', text: 'Repeat what they said and add a little: "Yes, a dog! A big, muddy dog."' },
  { step: 'Ask again', text: 'Ask again so they can use the new words: "What kind of dog?"' },
];

export const CROWD = [
  { type: 'Finish the line', example: 'Leave a gap at the end of a line for them to fill in: "The cat sat on the ___."', best: 'Rhyming or repeated lines.' },
  { type: 'What happened?', example: '"What happened to the bear at the start?"', best: 'After a page turn or at the end.' },
  { type: 'Tell me about the picture', example: '"Tell me what is happening in this picture."', best: 'Busy pictures.' },
  { type: 'What, where, why', example: '"What is this called?" "Where is the duck going?" "Why is she sad?"', best: 'New words and feelings.' },
  { type: 'Link it to their life', example: '"Have you ever been to the beach like this?"', best: 'Pages that remind them of home or something they did.' },
];

export const PRINT_POINTERS = [
  'Point to the title: "This is the title. It tells us the name of the book."',
  'Run your finger under the words as you read one line.',
  '"Where do I start reading on this page?" Let them point.',
  '"Can you find a letter from your name on this page?"',
  '"This is a word. Let\'s count the words in this line."',
  'Point to a big or special word (a shout, a sound effect): "This word says BOOM!"',
  '"This is the letter s. It says sss. Can you find another s?"',
  'Point to a speech bubble or quotation: "These words show what she is saying."',
];

export const SOUND_PROMPTS = [
  'Pick two things on the page that start with the same sound: "sun... sock... sss!"',
  'Say a word from the page slowly, stretching the first sound: "mmmoon". Ask: "What sound does it start with?"',
  'Find a rhyme in the book and pause before it so they say it.',
  'Say "Listen to the robot. What\'s the word?", then say a word from the picture in parts: "d - o - g".',
  'Clap the beats of a character\'s name together.',
];

export const TIPS = [
  'Read one or two books a day, with all your children together if you have more than one.',
  'Ask 3-5 questions per book. You can leave some pages without questions to keep the story moving.',
  'Print books lead to more back-and-forth talk than e-books, especially those with games or things to tap (Munzer et al. 2019).',
  'Read favourites again. Familiar books leave room for more talk.',
  'Follow their lead. If they want to talk about a picture, give them time.',
];

// A prompt for any AI chat tool to prepare questions for one book. Family names typed
// into the title or notes are replaced with "the child".
export function buildBookPrompt({ title, author = '', pageNotes = '', redact = [] }) {
  const t = redactNames(String(title || '').trim().slice(0, 140), redact);
  const a = redactNames(String(author || '').trim().slice(0, 80), redact);
  const notes = redactNames(String(pageNotes || '').trim().slice(0, 2500), redact);
  return [
    'I am a parent reading a picture book aloud to my young children, aged about 3 to 5. Help me prepare dialogic reading prompts.',
    '',
    `Book: "${t}"${a ? ` by ${a}` : ''}.`,
    notes ? `What happens on each page (my notes):\n${notes}` : 'If you do not know this book well, say so and give prompts that work for any page instead of inventing plot details.',
    '',
    'Please give me the following in short, plain lines:',
    '1. For each page spread (or every 2-3 pages): 3-5 questions of these kinds: finish the line, what happened, tell me about the picture, what/where/why, and link it to their own life. Label each with its kind in those plain words.',
    '2. Up to 6 harder or new words from the book with a meaning in one line that a child can understand.',
    '3. 2-3 "point to the print" moments (title, a big word, a letter to find, following the words with a finger).',
    '4. 2 sound games using words from the book (two words that start with the same sound, or a rhyme to pause on).',
    '5. 3 questions for after the book to help them retell it.',
    '',
    'Keep it warm and simple. Questions should be things a 3- to 5-year-old can answer. Do not ask me for personal details about my children.',
  ].join('\n');
}
