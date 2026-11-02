# How Early Reader works

Teaching a young child to read is mostly known science. Link letters to sounds. Train the ear to hear the separate sounds inside a word. Blend sounds into words without pauses. And talk a lot about books. Where families struggle is keeping it going for months: lessons run long, children get bored, parents run out of steam.

So Early Reader does the remembering and the planning, and you do the teaching. Each time you open it, it tells you the next small thing to do with each child, and what to say while you do it.

## Two kinds of time

**Story time** builds language: vocabulary, understanding, and the habit of talking about stories. It doesn't teach the letters, and it isn't meant to. The studies are clear that reading aloud builds language strongly, but on its own it does little for decoding.

**Practice bursts** build the code: letter sounds, hearing sounds in words, and blending. Each burst lasts two or three minutes. Short goes spread over the day and over different days stick better than one long lesson, so the app asks for two to four bursts a day rather than one sitting.

You need both. The [parent guide](parents-guide.md) explains how to run each one.

## What happens in a burst

When you start a burst, the app looks at everything your child has met and picks a few things:

- **Reviews that are due.** Every letter, word and tricky word comes back after a gap that grows each time your child gets it right on the first try: later the same day, then after 1, 2, 4, 7, 14 and 30 days. A miss sends it back to the start.
- **At most one new thing**, and only if your child is ready for it. The app holds back new letters when recent answers are right less than about three times in four, when three or more letters are still shaky, or when it has already added this week's two to four.
- **An easy win to finish**, chosen when you reach the end, so it's never something your child just missed.

A letter counts as "known" once your child gets it right on two different days. One good afternoon isn't enough, and that's on purpose.

Only the first try counts. A slow answer is fine as long as it's their own, so give them a moment before you step in. If your child needs help, you show them, they try again, and the app notes it was hard.

## Four stages

1. **Sound play.** Listening games without letters, plus the letters in your child's name.
2. **Letter sounds.** Names and sounds together, two to four new letters a week, each with a picture that fades away as the letter sticks.
3. **Blending.** Sounding out short words like "sat", starting with sounds you can stretch ("sssaaat").
4. **First reading.** Tricky words, two-letter sounds like "sh" and "ee", then short sentences and stories.

The app watches for signs that a child is ready to move on - picking out first sounds reliably over several days, knowing about 12 letter sounds, sounding out new words most of the time - and suggests it. You decide.

## Every word is checked

Anything the app asks your child to read is checked word by word first. A word passes only if every sound in it has been taught to that child, or if it's a tricky word they've learned, or it's their name. Small details count: in "dogs" the s sounds like a "z", so plurals like that wait until your child has met "is", where s says "z" for the first time.

The same check runs on any text you paste in, including stories from an AI tool. Words that aren't ready show up in red.

## Made-up words

Children are good at memorising. A child can "read" a favourite book without decoding a single word. In one study of baby reading videos, parents were sure their babies could read when they couldn't. So during blending, the app sometimes shows a word your child has never practised, or a made-up "monster name" like "fip". Getting those right is the real sign of sounding out.

## Where your data lives

Everything you type into Early Reader is saved on your device, in this browser: your children's names, their progress, your settings and any sounds you record.

There is no Early Reader server. There are no accounts, no sign-in and no database somewhere holding your family's details. The app is a set of files your browser downloads once from GitHub Pages, the same way it would download any website, and after that it runs on your phone or computer even without internet. The website host sees that the files were downloaded. It never sees anything you type, because nothing you type is ever sent anywhere.

That has one downside: if you clear your browser data or lose your phone, the progress goes with it. Settings has "Export backup", which saves everything to a file you keep.

## What it leaves out

No chat with your child, no cartoon characters, no streaks or rewards to chase, no ads.

No speech recognition. Today's systems get most of a preschooler's words wrong, so you are the judge of every answer.

## AI, if you want it

You don't need AI to use Early Reader. Two features can use it: questions for a book you're reading, and new practice stories. In both, the app writes a prompt for you to copy into whatever AI chat tool you use. It removes your children's names first. Whatever comes back, you read before using, and practice stories go through the word check.

AI never talks to your child here. That's a firm line, and the research behind it is in the report below.

## Where the ideas come from

Every choice above comes from research on how young children learn to read, what parents have tried at home, and what AI can and can't do at this age. The [research report](research/report.md) has the details and the sources.

Some parts are my own judgment calls built on that research: the order of the letters, the length of a burst, the review gaps and the checks for moving up a stage. Nobody has tested an app like this with a parent teaching their own 3-year-old. If you use it, I'd like to hear how it goes - open an issue on [GitHub](https://github.com/moshthepitt/early-reader/issues).
