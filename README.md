# Early Reader

I want my kids, aged 3 and 4, reading as early as possible. Before building anything I had the research done: what the studies say about teaching preschoolers to read at home, what parents and homeschoolers have tried, and where AI fits. The full report is in [docs/research/report.md](docs/research/report.md).

What to teach turns out to be fairly settled. Link letters to sounds, train the ear to hear the sounds inside words, blend sounds without pauses, and talk a lot about books. Home programmes mostly fail on delivery - lessons run too long, kids get bored, parents stop. In two recent UK trials, parents of 3- and 4-year-olds got through 58-65% of the planned sessions and the programme showed no effect. So this app has one job: tell the parent what to do next, two minutes at a time, and remember what each child knows.

**Use it:** [moshthepitt.github.io/early-reader](https://moshthepitt.github.io/early-reader/)
**Parents, start here:** [A parent's guide to Early Reader](docs/parents-guide.md), then [how it works](docs/how-it-works.md) and [books to read aloud](docs/books.md). All three are inside the app too.

## How it works

The screen is for the parent. The kids work with printed cards, letter tiles and a pencil.

Each day has two kinds of time:

- **Story time** - one or two books, both kids together. The app gives you questions to ask, places to point at the words and sound games to play with the book. This is where vocabulary comes from, and it matters as much as the letters.
- **Practice bursts** - two to four a day for each child, two or three minutes each, spread out. A burst mixes review with at most one new thing. You read the script, the child answers, you tap "Right first try" or "Needed help". After a miss the app shows you what to model. Every burst ends on something the child knows well, and the Stop button ends early on an easy win.

Each child moves through four stages at their own pace:

1. **Sound play** - rhyme, clapping syllables, spotting the first sound in a word, "robot talk" (c-a-t... cat!) and the letters in their own name.
2. **Letter sounds** - letter names and sounds together, two to four new letters a week, with review spread over days.
3. **Blending** - sounding out short words like "sat" and "mat", with the occasional made-up word to check they are really blending and not remembering.
4. **First reading** - tricky words like "the" and "was", then short sentences and tiny stories.

The app suggests when a child is ready to move up. You decide.

There is also a Texts screen listing the sentences and stories each child can read right now, a Print screen for cards, tiles and story booklets, and a Sounds screen that shows how to say each sound and lets you record yourself. Most of us (me included, probably) say "muh" when we mean "mmm".

## What it leaves out

The app never talks to the children. There is no chat, no cartoon companion, no streaks and no ads.

There is no speech recognition either. A benchmark from October 2026 found current models get 58-76% of preschoolers' words wrong, so the parent judges every answer.

Nothing leaves the device. Names, progress and voice recordings stay in the browser. Where AI helps (questions for a specific book, new practice stories), the app writes a prompt you paste into whatever AI chat tool you use. Your children's names are swapped for "the child" or a `{NAME}` placeholder, and whatever comes back gets checked word by word against what that child has been taught. AI breaks phonics rules a lot.

## Small on purpose

The first visit is four requests and about 43 KB over the wire (114 KB unpacked). After that it works offline, so it costs nothing to use on a data bundle. There are no frameworks and no runtime dependencies: plain JavaScript modules, bundled for hosting by [esbuild](https://esbuild.github.io/). The build fails if a change pushes the first load over budget.

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

The research is also honest about expectations. Early phonics gives real short-term skills, but later starters catch up by about age 11. The wins that seem to last are vocabulary, enjoying books and reaching reading without tears. In English, getting to solid decoding takes about two and a half years.

Not done yet:

- A Kiswahili track. The engine doesn't care which language it teaches; the data isn't written.
- Recordings of each sound by someone who teaches phonics.
- A font with the single-storey "a" kids learn to write.

MIT licensed. What have I missed?
