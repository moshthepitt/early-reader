# Early Reader

Offline web app that coaches a parent teaching their own 3- to 5-year-old to read. Plain JavaScript modules in `js/`, bundled by `scripts/build.mjs` into `dist/` for hosting. Commands live in `package.json`.

## Sources of truth

- Why each teaching choice exists: `docs/research/report.md`. Cite the study in a comment when code rests on one.
- What parents are told: `docs/parents-guide.md` (how to use it), `docs/how-it-works.md` (how the engine decides) and `docs/books.md` (books to read aloud). The app renders all three. They name screens, buttons and numbers from the code; keep them in step.
- Sounds, teaching order and tricky words: `js/data/en.js`. Word bank, sentences and stories: `js/data/en-content.js`, guarded by `tests/content.test.js`.

## Invariants

- **Parent-led.** The screen speaks to the parent; the child works with paper, tiles and pencil. AI features produce prompts the parent copies by hand, with family names passed through `redactNames`.
- **On-device.** All data stays in localStorage and IndexedDB. Anything loaded or imported passes through `migrate` in `js/store.js` first.
- **Decodable.** Every text shown for a child to read passes `checkText` against that child's taught sounds and tricky words.
- **Escaped.** Every value interpolated into HTML goes through `escapeHtml`.
- **Light.** First load stays within the budget `npm run build` enforces: four requests, 50 KB over the wire. No frameworks or runtime dependencies.

## Writing

User-facing text and docs: plain British English, short sentences, "you" for the parent, straight quotes, a spaced hyphen for asides. Praise lines praise the process ("You said each sound").

## Done

A change is done when `npm test`, `npm run build` and `npm run test:browser` all pass, and the guide still matches the screens it describes. Commits hold one logical change each, with a sentence-case imperative subject.
