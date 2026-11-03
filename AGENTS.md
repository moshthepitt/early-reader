# Early Reader

Offline web app that coaches a parent teaching their own 3- to 5-year-old to read. Plain JavaScript modules in `js/`, bundled by `scripts/build.mjs` into `dist/` for hosting. Commands live in `package.json`.

## Sources of truth

- Why each teaching choice exists: `docs/research/report.md`. When code rests on a study, cite it in a comment, and add it to the report in the same change if the report doesn't have it.
- What parents are told: `docs/parents-guide.md` (how to use it), `docs/how-it-works.md` (how the engine decides) and `docs/books.md` (books to read aloud). The app renders all three. They name screens, buttons and numbers from the code; keep them in step.
- Sounds, teaching order and tricky words: `js/data/en.js`. Word bank, sentences and stories: `js/data/en-content.js`, guarded by `tests/content.test.js`.

## Invariants

- **Parent-led.** The screen speaks to the parent, apart from the child card at the top of each step, which shows only what that step is about. The rest is paper, tiles and pencil. AI features produce prompts the parent copies by hand, with family names passed through `redactNames`.
- **On-device.** There is no server. All data stays in localStorage and IndexedDB, and the only network requests are for the app's own files. Anything loaded or imported passes through `migrate` in `js/store.js` first.
- **Decodable.** Every text shown for a child to read passes `checkText` against that child's taught sounds and tricky words.
- **Escaped.** Every value interpolated into HTML goes through `escapeHtml`.
- **Light.** First load stays within the budget `npm run build` enforces (`BUDGET` in `scripts/build.mjs`). No frameworks or runtime dependencies.

## Writing

Anything a person reads - screens, game scripts, docs, commit messages - is written in Kelvin's voice: plain British English, short sentences, "you" for the parent, straight quotes, a spaced hyphen for asides. Use the unslop skill when you have it, and check every claim against `docs/research/report.md`. Praise lines praise the process ("You said each sound").

A tired parent reads game scripts mid-game with the phone in one hand. Every script line is:

- **Related.** Every word, example or picture it names is on the child card in that step, or is the thing being taught.
- **Said as written.** Words the parent says go inside quotes, spelt the way they sound: "zzzero", "mmm ... at". Notes for the parent go outside the quotes.
- **Glanceable.** One action per line.

## Done

A change is done when `npm test`, `npm run build` and `npm run test:browser` all pass, and `docs/parents-guide.md` and `docs/how-it-works.md` still match the screens they describe. Commits hold one logical change each, with a sentence-case imperative subject.

A change to what is scored, a game's format, the teaching order or the scheduler is a **teaching change**. Find the evidence first, add it to the report if it isn't there, and commit it apart from wording fixes.
