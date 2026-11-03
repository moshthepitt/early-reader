# Early Reader

I want my kids, aged 3 and 4, reading as early as possible. Before building anything I had the research done: what the studies say about teaching preschoolers to read at home, what parents and homeschoolers have tried, and where AI fits. The full report is in [docs/research/report.md](docs/research/report.md).

What to teach turns out to be fairly settled. Link letters to sounds, train the ear to hear the sounds inside words, blend sounds without pauses, and talk a lot about books. Home programmes often stall on delivery - lessons run too long, kids get bored, parents stop. In two recent UK trials, parents of 3- and 4-year-olds got through 58-65% of the planned sessions and the programme showed no effect. So the app tells the parent what to do next, two minutes at a time, and remembers what each child knows.

**Use it:** [moshthepitt.github.io/early-reader](https://moshthepitt.github.io/early-reader/)
**Parents, start here:** [A parent's guide to Early Reader](docs/parents-guide.md), then [how it works](docs/how-it-works.md) and [books to read aloud](docs/books.md). All three are inside the app too.

## How it works

The screen is for the parent, apart from a bright card at the top of each step that shows your child the letter, word or pictures. The kids also work with printed cards, letter tiles and a pencil.

Each day has two kinds of time:

- **Story time** - one or two books, all the kids together. The app gives you questions to ask, places to point at the words and sound games to play with the book. This builds vocabulary, and it matters as much as the letters.
- **Practice bursts** - two to four a day for each child, two or three minutes each, spread out. A burst mixes review with at most one new letter; from stage 3 it can also bring a new word to sound out. You read the script, the child answers, you tap "Right first try" or "Needed help". After a miss the app shows you what to model. Every burst ends on something easy, usually something the child knows well, and the Stop button ends early on an easy win.

Each child moves through four stages at their own pace:

1. **Sound play** - rhyme and clapping the beats in words, played together, spotting the first sound in a word, "robot talk" (sss ... un... sun!) and the letters in their own name.
2. **Letter sounds** - letter names and sounds together, two to four new letters a week, with review spread over days.
3. **Blending** - sounding out short words like "sat" and "mat", with the occasional made-up word to check they are really blending and not remembering.
4. **First reading** - tricky words like "the" and "was", then short sentences and tiny stories.

The app suggests when a child is ready to move up. You decide.

There is also a Texts screen listing the sentences and stories each child can read right now, which prints any story as a little booklet, a Print screen for cards and tiles, and a Sounds screen that shows how to say each sound and lets you record yourself. Most of us (me included, probably) say "muh" when we mean "mmm".

## What it leaves out

The app never talks to the children. There is no chat, no cartoon companion, no streaks and no ads.

There is no speech recognition either. A benchmark from October 2026 found Whisper, a widely used speech model, got 58-76% of preschoolers' words wrong. Newer systems do better but still struggle with 3- and 4-year-olds, so the parent judges every answer.

Everything you enter is saved on your device, in the browser: names, progress, voice recordings. There is no Early Reader server, no account and no database, so there is nowhere for any of it to be sent. GitHub Pages hands your browser the app's files, and that's the only contact. Where AI helps (questions for a specific book, new practice stories), the app writes a prompt you paste into whatever AI chat tool you use. Your children's names are swapped for "the child" or a `{NAME}` placeholder. Practice stories that come back get checked word by word against what that child has been taught, because AI breaks phonics rules a lot. Questions for a book are for you, so read them over yourself.

## Small on purpose

The first visit is four requests and about 46 KB over the wire (127 KB unpacked). The reading font, 12 KB, follows once the page has loaded. After that it works offline and uses almost no data. There are no frameworks and no runtime dependencies: plain JavaScript modules, bundled for hosting by [esbuild](https://esbuild.github.io/). The build fails if a change pushes the first load over budget.

## The look

The colours and the zigzag come from the kiondo, the sisal basket woven in Kikuyu and Kamba homes. The parent's screens are calm: cream, brown and one green. The child's card is the bright page, edged with a woven band, and the sounds under a word are beads on a string - a round bead for each sound, a long one where two letters make one sound.

Letters are set in Andika, SIL's typeface for early readers, which has the single-storey "a" and "g" children learn to write. The app carries a small copy renamed "ER Letters", as the font's licence asks; `scripts/make-font.py` rebuilds it.

The link preview that WhatsApp and other apps show is drawn in the same style, in `images/share-card.html`. `node scripts/render-share-card.cjs` turns it into the image.

## Working on it

```sh
npm install
npm start               # serves the source at http://localhost:8080, no build needed
npm test                # engine, content checks and a simulated child practising for months
npm run build           # bundles into dist/ and checks the size budget
npm run test:browser    # clicks through the built app on a phone and a desktop screen
```

The browser test needs Chromium; set `CHROME_PATH` if it isn't in the Playwright cache. Every push to `main` runs the tests and publishes `dist/` to GitHub Pages. Notes for coding agents are in [AGENTS.md](AGENTS.md).

## What I don't know yet

The letter order, burst lengths, review gaps and stage checks are my choices, based on the studies but not tested anywhere. No study has looked at a parent teaching their own 3-year-old to decode with an app like this. The simulated children in the tests move through all four stages in one to two months; real kids will be slower and less tidy.

Don't expect a lasting head start. Early phonics gives real short-term skills, but in one New Zealand school comparison later starters had caught up by about age 11. Vocabulary is the gain with the best evidence of lasting. I also care about them enjoying books and getting there without tears, though that's my priority, not a finding. In English, getting to solid decoding takes two and a half years or more.

Not done yet:

- A Kiswahili track. The engine doesn't care which language it teaches; the data isn't written.
- Recordings of each sound by someone who teaches phonics.

MIT licensed. What have I missed?
