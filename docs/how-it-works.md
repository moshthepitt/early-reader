# How Early Reader works

What to teach a young child learning to read is fairly settled. Link letters to sounds. Train the ear to hear the separate sounds inside a word. Blend sounds into words without pauses. And talk a lot about books. Where families struggle is keeping it going for months: lessons run long, children get bored, parents run out of steam.

So Early Reader does the remembering and the planning, and you do the teaching. Each time you open it, it tells you the next small thing to do with each child, and what to say while you do it.

## Two kinds of time

**Story time** builds language: vocabulary, understanding, and the habit of talking about stories. Pointing out the words and playing with sounds as you read can build early reading skills too. Children still need help linking letters to sounds, and that's what the bursts are for.

**Practice bursts** build the code: letter sounds, hearing sounds in words, and blending. Each burst lasts two or three minutes. Short goes spread over the day and over different days seem to stick better than one long lesson, so the app asks for two to four bursts a day rather than one sitting.

You need both. The [parent guide](parents-guide.md) explains how to run each one.

## What happens in a burst

When you start a burst, the app looks at everything your child has met and picks a few things:

- **Reviews that are due.** A new letter, word or tricky word comes back later the same day. Each day your child gets it right first try, the gap grows: 1, 2, 4, 7, 14, then 30 days. A miss brings it back later the same day and starts the gaps again. The shakiest come first. Where a burst has room for two reviews, one goes to whatever has waited longest, so nothing gets stuck behind a letter your child keeps finding hard.
- **At most one new letter**, and only if your child is ready for it. From stage 3 a burst can also bring a new word to sound out, and from stage 4 a new tricky word. The app holds back new letters when recent answers are right less than about three times in four, when three letters are still being learned, when it has added one today, or when it has already added this week's two to four. Rhyme and clapping are played together and not scored, so they never hold anything back. After two weeks or more away, the first day back has no new letters or tricky words.
- **An easy win to finish**, chosen when you reach the end, so it's never something your child just missed.

A letter counts as "known" once your child gets it right first try on two different days. One good afternoon isn't enough, and that's on purpose. If they needed help with a letter earlier in the day, getting it right later that day is good practice, but it doesn't count towards known. The app checks it again the next day.

Only the first try counts. A slow answer is fine as long as it's their own, so give them a moment before you step in. If your child needs help, you show them, they try again, and the app notes it was hard. If you skip a turn, nothing is saved.

## Four stages

1. **Sound play.** Listening games without letters, plus the letters in your child's name.
2. **Letter sounds.** Names and sounds together, two to four new letters a week. Each new letter comes with a picture to help it stick. When the app checks a letter, it shows the letter alone, so a right answer means your child knows the letter itself.
3. **Blending.** Sounding out short words like "sat", mostly ones that start with a sound you can stretch ("sssaaat").
4. **First reading.** Tricky words, two-letter sounds like "sh" and "ee", then short sentences and stories.

The app watches for signs that a child is ready to move on, and suggests it. The Progress tab shows each check and how close your child is. You decide.

## Every word is checked

Anything the app asks your child to read is checked word by word first. A word passes only if every sound in it has been taught to that child, or if it's a tricky word they've learned, or it's their name or a brother's or sister's. Small details count: in "dogs" the s sounds like a "z", so plurals like that wait until your child has met "is", where s says "z" for the first time.

The same check runs on any text you paste in, including stories from an AI tool. Words that aren't ready show up in red, and words the app doesn't know show up in yellow. Swap out both before you print.

## Made-up words

Children are good at memorising. A child can "read" a favourite book without decoding a single word. In one study of baby reading videos, parents were sure their babies could read when they couldn't. So during blending, the app sometimes shows a word your child has never practised, or a made-up "monster name" like "fip". Getting those right is the real sign of sounding out.

## Where your data lives

Everything you type into Early Reader is saved on your device, in this browser: your children's names, their progress, your settings and any sounds you record.

There is no Early Reader server. There are no accounts, no sign-in and no database somewhere holding your family's details. The app is a set of files your browser downloads from GitHub Pages, the same way it would download any website. It keeps a copy, so it runs on your phone or computer even without internet, and checks for updates when you're online. The website host sees that the files were downloaded. It never sees anything you type, because nothing you type is ever sent anywhere.

The app asks your browser not to clear your saved data when the phone runs low on space, though the browser can say no. And if you clear your browser data or lose your phone, the progress goes with it. Settings has "Export backup", which saves everything to a file you keep.

## What it leaves out

No chat with your child, no cartoon characters, no streaks or rewards to chase, no ads.

No speech recognition. Even the best systems still get many of a preschooler's words wrong, so you are the judge of every answer.

## AI, if you want it

You don't need AI to use Early Reader. Two features can use it: questions for a book you're reading, and new practice stories. In both, the app writes a prompt for you to copy into whatever AI chat tool you use. It removes your children's names first. Whatever comes back, you read before using, and practice stories go through the word check.

AI never talks to your child here. That's a firm line, and the research behind it is in the [research report](research/report.md).

## Where the ideas come from

The [research report](research/report.md) has the studies behind these choices, with sources.

Some parts are my own judgement calls built on that research: the order of the letters, the length of a burst, the review gaps and the checks for moving up a stage. Nobody has tested an app like this with a parent teaching their own 3-year-old. If you use it, I'd like to hear how it goes - open an issue on [GitHub](https://github.com/moshthepitt/early-reader/issues).
