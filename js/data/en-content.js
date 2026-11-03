// Practice content: word bank, sentences, stories and listening games.
//
// Stored as compact text to keep the app small, and expanded into objects when the app loads.
// Each word's sounds come from splitting it into the graphemes in en.js (longest match first),
// and its shape (cvc, cvcc, digraph...) from those sounds. tests/content.test.js checks it all.
//
// Formats:
//   WORD_TEXT        word or word=emoji (the emoji is the picture shown for the word)
//   NAME_TEXT        decodable first names used in sentences and stories
//   SENTENCE_TEXT    one sentence per line; {NAME} and {NAME2} are filled in on the device
//   STORY_TEXT       id | title | line | line ...
//   RHYME_TEXT       word=emoji, a word that rhymes with it, a word that does not
//   SYLLABLE_TEXT    the word in spoken beats=emoji (mon-key=🐒)
//   FIRST_SOUND_TEXT sound, words that start with it / one word that does not

import { segment } from '../decodable.js';
import { VOWELS } from './en.js';

const WORD_TEXT = `
am an at in it on if up us mat man=👨 tin=🥫 map=🗺️ pan=🍳 pin=📌 pit pot=🍲 top tot=👶 lot lap
lip=👄 lid men net=🥅 pen=🖊️ pet den fin fan pad dad=👨 mum=👩 cat=🐱 dog=🐶 pig=🐷 hen=🐔
ram=🐏 rat=🐀 bat=🦇 fox=🦊 sun=☀️ bed=🛏️ hat=🎩 cap=🧢 web=🕸️ leg=🦵 mug=☕ cup=🥤 van=🚐
bus=🚌 jet=✈️ nut=🌰 yam bag=👜 tag=🏷️ tap=🚰 cab=🚕 ran him but fog=🌫️ kid=🧒 pup=🐶 rug rag
peg log=🪵 fig wig bib rib tub jug bug bud bun cob cod cot cub cut=✂️ dip dot gap gum hem hip
hub hut jam kit lab mud pod pop rim rod sap sip sum vet zip sat sit pat nap=😴 tip mop nod did
let led met fed fit get dig hop hum jog rub run=🏃 sob=😭 hug=🤗 mix fix tug wag win=🏆 tan dim
mad=😠 sad=😢 set red=🔴 wet=💦 hot=🥵 big bad fun not ten=🔟 six yet yes=👍 yum=😋 can had got
sand lamp tent mint nest list mist pond hand band land milk silk desk tusk belt felt gift loft
lift bank tank bunk gulp lump bump jump camp pant dent bell=🔔 doll hill mill well mess fuss
kiss puff=💨 cuff huff send mend bend lend help hunt melt rest test dust dunk sink wink limp
dump miss tell sell fill toss damp soft best left next pink dull and just must flag frog crab
drum plum slug spot stem step twin trip grip trim brim clip grin sled skid swim plan drop tram
stop plot pram spin slip snap skip clap flap flip flop grab plop drip drag trot slot flat snug
glum stamp stand plant stump trunk skunk plank clamp crisp blend print crust dress=👗 spring
string stomp blink smell spill spell grand text quiz duck=🦆 sock=🧦 rock lock neck sack pack
rack deck chick=🐤 chip chin chat chop shed shell=🐚 ship=🚢 shop fish=🐟 dish wish mesh moth
cloth thing thud ring=💍 king=🤴 wing song gong bee=🐝 seed=🌱 leek reed tree=🌳 sheep=🐑 cheek
teeth=🦷 queen=👸 sheet feet=🦶 moon=🌙 spoon=🥄 broom=🧹 room roof boot=🥾 hoop=⭕ pool=🏊
tool=🔧 zoo stool quack quit kick lick pick peck tuck check shut rush mash dash hush thank think
sing hang bang swing sting bring cling feed need see feel seem keep beep sleep=😴 sweep meet
zoom quick thick thin rich long strong green=🟢 sweet deep keen then them this that with much
such soon too three box=📦 wax hid sag gust shelf wind off lost still drink dock stick rip
`;

const NAME_TEXT = 'sam pam tim ted meg ben dan kim tom max pip nat';

const SENTENCE_TEXT = `
Sam sat on a mat.
Tim sits on a mat.
Nat is in a tent.
Pam pats a pet.
Pip naps on a lap.
Sam is a man.
A man lifts a net.
The tin is on top.
The lid fits the tin.
The pot is on a mat.
Dad lifts the pot.
Sam lifts a lid.
Tim taps the tin.
Nat pats the mat.
Pam is on a mat.
Is it a map?
Is it a tin?
Is the lid on?
Is the mat damp?
The mat is damp.
The sand is damp.
Sam sits in sand.
Tim pats the sand.
The nest is in mist.
The mist is damp.
A fan is on.
The fan is not on.
Dad is in a tent.
A lamp is in it.
The lamp is on.
Sam met Tim.
Pam met Nat.
Nat lets Pip nap.
Dad lets Sam sit.
Sam is not sad.
Tim is not mad.
I sit on a mat.
I nap in a tent.
I pat the pet.
I lift a net.
I tap the tin.
I am in a tent.
I am on top.
A pin is on it.
A pen is in it.
The pen is on top.
The map is damp.
Pam lifts the map.
Pip slips in sand.
Dad lifts Pip.
Sam sets a net.
Nat lifts the net.
The top spins on a mat.
Tim spins the top.
The pet is fed.
The cat can nap.
The dog can sit.
Meg has a red bag.
Ben has a pet pig.
Dan can hop.
Kim can get a cup.
Tom has a big hat.
Max has a red cap.
The hen is in a pen.
The ram can run.
The rat hid in a box.
A bat hangs in the shed.
The fox can run.
The sun is hot.
The bed is soft.
The cap is on the bed.
A bug is on a log.
The red bus can stop.
The jet can zoom.
The van is big.
The cab is red.
The web is on the log.
His leg is wet.
Her bag is pink.
The mug is hot.
The cup is not hot.
The nut is in a bag.
The yam is in the pot.
The tag is on the bag.
The tap is on.
The tap can drip.
The rug is damp.
The peg is in the bag.
The log is in mud.
The bib is red.
The tub is big.
The jug has milk in it.
A bud is on the stem.
The bun is on a dish.
Mum has a cob.
The cub can nap.
Get a rag to mop up.
We can mop it up.
I can sip milk in a cup.
He can hum a song.
She can jog with Mum.
We can run to the shop.
Can I hug the pup?
The pup can wag.
I can mix the dip.
Dad can fix the lock.
A big bag can sag.
Yes, it is fun!
The sand is in the pit.
The lamp is next to me.
A tent is at the camp.
We can rest in it.
The pond has a duck.
The band has a drum.
Milk is in the cup.
The silk is soft.
The desk has a lamp.
The belt is in the bag.
The gift is in a box.
He can help his mum.
She can lend me a pen.
The wax can melt.
The cup can sink.
Can you wink at me?
The flag is red.
The frog is on a rock.
The crab is on sand.
The drum is big.
The plum is in my hand.
The slug is on a reed.
The stem has a bud.
Do not slip on the step.
The sled can skid.
The duck is on the pond.
The tram can stop.
The pram is next to Mum.
We can clap with them.
The flag can flap.
I can flip the lid.
She has a big grin.
The flat rock is wet.
The pup is snug in bed.
The plant is in a pot.
A skunk is on the stump.
The trunk is thick.
The plank is long.
We can stomp in mud.
The bell can ring.
The doll is in bed.
The well is deep.
The puff of wind is soft.
We can smell the mint.
You can spell Sam.
The dress is green.
The duck can quack.
The sock is on my bed.
The chick is with the hen.
The ship is at the dock.
The fish is in the pool.
We can get chips at the shop.
The shell is on sand.
The moth has thin wings.
This cloth is soft.
That is a big ring.
The king has a red bed.
We can sing a song.
Can you swing with me?
The bee is on the leek.
A sheep is in the pen.
The seed is in the mud.
The queen can see the tree.
My teeth are wet.
The sheet is on the bed.
My feet can get wet.
The moon is up.
My spoon is in the dish.
The broom is in the shed.
The boot is next to the bed.
The hoop is on the mat.
They can swim in the pool.
We need a tool to fix this.
Some sheep sleep in the shed.
Come and see the zoo.
I like the sweet plum.
All three hens can see me.
Be still as I fix this.
The duck was in the pond.
Mum said to get the cup.
No, the cup is not hot.
Go into the shop with me.
He is wet, so get a rag.
{NAME} has a pet dog.
{NAME} can sit with Sam.
{NAME} has a big red hat.
{NAME} can tap the drum.
{NAME} can pat the cat.
{NAME} is snug in bed.
{NAME} can help me mop.
{NAME} can get the milk.
{NAME} has a pink shell.
{NAME} can hop with Kim.
{NAME} can plant a seed.
{NAME} can ring the bell.
{NAME} can feed the sheep.
{NAME} can see the moon.
{NAME} has a green sock.
{NAME} can sing with {NAME2}.
{NAME} and {NAME2} can clap.
{NAME2} has a red cup.
{NAME2} can help {NAME}.
{NAME} and {NAME2} like this song.
`;

const STORY_TEXT = `
sam-on-the-mat | Sam on the Mat | Sam lifts a mat. | A pin is on the mat. | Sam lifts the pin. | Sam sits on the mat.
tim-and-a-tin | Tim and a Tin | Tim lifts a tin. | The lid is not on. | Tim taps the lid. | The lid fits the tin.
pip-in-a-pit | Pip in a Pit | Pip is in a sand pit. | Pip slips in the sand. | Dad lifts Pip. | Pip sits on a mat.
nat-and-a-net | Nat and a Net | Nat lifts a net. | A top is in the net. | Nat tips the net. | The top is on a mat. | Nat spins the top.
pam-and-a-map | Pam and a Map | Pam lifts a map. | The map slips in a pot. | The pot is damp. | Pam lifts the map. | Pam sets the map on a mat.
dad-and-a-lid | Dad and a Lid | Dad lifts a pot. | The lid is in a tin. | Dad lifts the lid. | The lid fits the pot.
sam-naps | Sam Naps | Sam is in a tent. | A lamp is on. | Sam taps the lamp. | The lamp is not on. | Sam naps in the tent.
tim-and-a-top | Tim and a Top | Tim spins a top. | The top slips in a net. | Tim lifts the net. | Tim sets the top on a mat. | The top spins on the mat.
meg-and-the-cat | Meg and the Cat | Meg has a pet cat. | The cat is not on the mat. | Meg can see a red cap. | The cat is in the cap! | Meg pats the cat.
ben-and-the-pig | Ben and the Pig | Ben has a pet pig. | The pig is in mud. | Ben has a big tub. | The pig can get in it. | Ben can get the pig wet. | The pig is wet and snug.
kim-and-the-cup | Kim and the Cup | Kim has a cup of milk. | The cup tips on the mat. | The mat is wet. | Kim gets a rag. | Kim and Mum mop it up.
max-and-the-cap | Max and the Cap | Max has a red cap. | A gust lifts the cap. | The cap lands on a log. | Dad can get the cap. | Max has his cap on.
tom-and-the-bus | Tom and the Bus | Tom is at the bus stop. | A big red bus can stop. | Tom has no bag! | His bag is next to Dad. | Dad hands Tom the bag. | Tom and Dad go on the bus.
dan-and-the-ram | Dan and the Ram | Dan can see a ram. | The ram has a tag. | The tag is in a web. | Dan gets Dad to help. | Dad lifts the web off the tag. | The ram can run with his tag.
the-pink-gift | The Pink Gift | Pam has a pink gift. | Meg lifts the lid. | A red hat is in it! | Meg has the hat on. | Pam and Meg grin.
the-lost-drum | The Lost Drum | Nat can tap a drum. | The drum is not on the desk. | Nat can see it in a box. | A cat naps next to it. | Nat lets the cat nap. | Nat taps the drum in the shed.
the-flat-tent | The Flat Tent | Sam and Dad camp in a tent. | A peg slips in the mud. | The tent is flat! | Dad gets the peg. | Sam can help fix the tent. | Sam and Dad rest in it.
the-frog-on-the-log | The Frog on the Log | A frog sits on a log. | The log tips in the pond. | The frog can hop. | It lands on a flat rock. | The frog sits in the sun.
the-plum-in-the-bag | The Plum in the Bag | Mum has a plum in a bag. | Ted can see a bag. | Is the plum in it? | Ted lifts the flap. | The plum is in the bag! | Ted has a big grin.
the-sock-and-the-pup | The Sock and the Pup | A sock is on the bed. | The pup runs off with it. | Mum has a soft rag. | The pup can tug the rag. | Mum gets the sock. | The pup is snug with the rag.
the-bell-in-the-shed | The Bell in the Shed | Kim has a bell. | The bell is not on the desk. | Kim and Dad go in the shed. | A bell hangs on a red string. | The cat taps the string. | Kim can ring the bell too.
the-duck-and-the-chick | The Duck and the Chick | A duck is in the pond. | A chick sits on the bank. | The chick can see a seed. | The seed slips into mud. | The chick pecks at the mud. | The duck can quack at the chick.
a-shell-for-meg | Meg and a Shell | Meg and Ben sit on sand. | Ben can see a shell. | The shell has sand in it. | Ben tips the sand on his hand. | Meg has a shell on her shelf.
the-ship-in-the-tub | The Ship in the Tub | Tom has a ship in the tub. | A big drip lands on the deck. | The ship tips! | Tom lifts the ship. | He tips the drips into the tub. | The ship is in the tub.
the-song-for-the-king | The King and the Song | Max is a king in a red hat. | The king has no song. | Pam can hum a song. | Max can sing with Pam. | The king has a song to sing!
the-seed-in-the-pot | The Seed in the Pot | Ted has a seed. | He plants it in a pot. | The mud is not wet. | Ted gets a drink in a cup. | He tips some in the pot. | Soon he can see a green bud.
the-sheep-and-the-gift | The Sheep and the Gift | A sheep is next to the pen. | It has a red bell. | The bell is in a net. | Ben can help his sheep. | He lifts the bell with his hand. | The sheep can go into the pen.
a-boot-in-the-room | A Boot in the Room | A boot is in the room. | Sam needs his sock too. | The sock is not in the boot. | Sam lifts the sheet. | His sock is on the bed! | Sam can get his boots on.
the-moon-and-the-cloud | The Moon | The moon is up. | Pip is in his tent. | Pip can see no moon. | Dad lifts the tent flap. | Pip can see the moon! | Pip can sleep in his tent.
name-and-the-net | {NAME} and the Net | {NAME} has a net. | A red cap is in the pond. | {NAME2} gets a long stick. | The net fits on the stick. | They can get the cap. | They set the wet cap in the sun.
name-and-the-drum | {NAME} and the Drum | {NAME} has a drum. | {NAME2} has no drum. | {NAME} has a tin too. | {NAME2} can tap the tin. | They can tap and sing a song.
name-at-the-shop | {NAME} at the Shop | {NAME} and Mum go to the shop. | They need milk and a bun. | The bag has a rip. | Mum gets a big box. | {NAME} can set the milk in it. | The bun fits in it too.
name-and-the-bee | {NAME} and the Bee | {NAME} can see a bee. | The bee is on a sheet. | {NAME2} can see a green bud. | The bee lifts off. | It lands on the bud. | They let the bee be.
name-and-the-hoop | {NAME} and the Hoop | {NAME} has a red hoop. | It slips into the shed. | {NAME2} can see it. | The hoop is next to a broom. | They get the hoop. | They can spin it on the mat.
name-and-the-soup | {NAME} and the Spoon | {NAME} has a dish of dip. | The spoon is not on the desk. | {NAME2} can see it in a cup. | They get the spoon. | {NAME} can get some dip. | {NAME2} has some dip too.
the-three-green-seeds | The Three Seeds | {NAME} has three seeds. | A seed slips on the mat. | {NAME2} can see it on the mat. | They set the seeds in three pots. | They keep the mud wet. | Soon three green stems come up.
`;

// Rhyme sets: a word, a word that rhymes with it, and one that doesn't, each with the
// picture the child sees. The odd word shares neither the vowel nor the first sound,
// in British or Kenyan English (where hug and cat share a vowel).
const RHYME_TEXT = `
cat=🐱 hat=👒 dog=🐶, bed=🛏️ red=🔴 sun=☀️, hen=🐔 pen=🖊️ fish=🐟, man=👨 van=🚐 dog=🐶,
pin=📌 tin=🥫 cup=🥤, sock=🧦 clock=🕐 pig=🐷, duck=🦆 truck=🚚 bee=🐝, bell=🔔 shell=🐚 cup=🥤,
fish=🐟 dish=🍽️ hand=✋, king=🤴 ring=💍 dog=🐶, bee=🐝 tree=🌳 cat=🐱, sheep=🐑 sleep=😴 cat=🐱,
moon=🌙 spoon=🥄 sock=🧦, boat=⛵ coat=🧥 sun=☀️, goat=🐐 boat=⛵ pig=🐷, cake=🎂 snake=🐍 dog=🐶,
star=⭐ car=🚗 hen=🐔, mouse=🐭 house=🏠 tree=🌳, train=🚂 rain=🌧️ duck=🦆, blue=🔵 shoe=👟 hat=👒,
nose=👃 rose=🌹 cup=🥤, light=💡 kite=🪁 dog=🐶, ball=⚽ wall=🧱 fish=🐟, toy=🧸 boy=👦 hat=👒,
book=📖 look=👀 sun=☀️, dog=🐶 frog=🐸 bee=🐝, hug=🤗 mug=☕ fish=🐟, net=🥅 jet=✈️ sun=☀️,
bat=🦇 hat=👒 pig=🐷, pen=🖊️ ten=🔟 cup=🥤, feet=🦶 sweet=🍬 bus=🚌
`;

// Words split into spoken beats for the parent to model. These are how the word
// sounds when said slowly, not a lesson in splitting written words.
const SYLLABLE_TEXT = `
dog=🐶 cat=🐱 sun=☀️ moon=🌙 fish=🐟 duck=🦆 pig=🐷 bed=🛏️ hat=🎩 bus=🚌
bee=🐝 frog=🐸 cake=🎂 tree=🌳 ap-ple=🍎 piz-za=🍕 rab-bit=🐰 ti-ger=🐯 li-on=🦁
mon-key=🐒 chick-en=🐔 cook-ie=🍪 rain-bow=🌈 ro-bot=🤖 car-rot=🥕 tur-tle=🐢 ze-bra=🦓
pan-da=🐼 pump-kin=🎃 do-nut=🍩 trac-tor=🚜 pen-guin=🐧 ba-na-na=🍌 el-e-phant=🐘
but-ter-fly=🦋 to-ma-to=🍅 po-ta-to=🥔 di-no-saur=🦕 kan-ga-roo=🦘 oc-to-pus=🐙 um-brel-la=☂️
tel-e-phone=☎️ bi-cy-cle=🚲 la-dy-bug=🐞 cat-er-pil-lar=🐛 wa-ter-mel-on=🍉 hel-i-cop-ter=🚁
al-li-ga-tor=🐊 av-o-ca-do=🥑 lo-co-mo-tive=🚂
`;

const FIRST_SOUND_TEXT = `
s sun=☀️ snake=🐍 sock=🧦 snail=🐌 / dog=🐶
a apple=🍎 ant=🐜 ambulance=🚑 avocado=🥑 / fish=🐟
t tiger=🐯 tortoise=🐢 tomato=🍅 train=🚂 / moon=🌙
m mouse=🐭 moon=🌙 monkey=🐒 mango=🥭 / sun=☀️
n nose=👃 nut=🥜 nine=9️⃣ / bee=🐝
p pig=🐷 pizza=🍕 pineapple=🍍 pencil=✏️ / dog=🐶
d dog=🐶 duck=🦆 drum=🥁 dinosaur=🦕 / sun=☀️
f fish=🐟 frog=🐸 fire=🔥 flower=🌻 / pig=🐷
l lion=🦁 lemon=🍋 leaf=🍃 leg=🦵 / cat=🐱
g goat=🐐 girl=👧 grapes=🍇 guitar=🎸 / fish=🐟
k cat=🐱 cake=🎂 key=🔑 kite=🪁 / sun=☀️
r rabbit=🐰 rainbow=🌈 robot=🤖 rocket=🚀 / bed=🛏️
h hat=👒 hand=✋ house=🏠 helicopter=🚁 / pig=🐷
b ball=⚽ bus=🚌 banana=🍌 butterfly=🦋 / cat=🐱
j juice=🧃 jacket=🧥 jeans=👖 / moon=🌙
v van=🚐 vest=🎽 volcano=🌋 violin=🎻 / dog=🐶
w watermelon=🍉 watch=⌚ wool=🧶 web=🕸️ / fish=🐟
y yo-yo=🪀 yawn=🥱 yellow=🟡 / hat=👒
`;

const DIGRAPHS = new Set(['sh', 'ch', 'th', 'ng', 'ee', 'oo', 'qu', 'ck']);
const DOUBLES = new Set(['ss', 'll', 'ff']);
const SHAPES = { VC: 'vc', VCC: 'cvcc', CVC: 'cvc', CVCC: 'cvcc', CCVC: 'ccvc', CCVCC: 'ccvcc', CVCCC: 'cvccc' };

// "cat" -> cvc, "kiss" and "and" -> cvcc (ss counts as two consonants), "ship" -> digraph.
function shape(gs) {
  if (gs.some((g) => DIGRAPHS.has(g))) return 'digraph';
  const s = gs.map((g) => (VOWELS.includes(g) ? 'V' : DOUBLES.has(g) ? 'CC' : 'C')).join('');
  return SHAPES[s] || 'other';
}

function entry(token, pos) {
  const [w, emoji] = token.split('=');
  const gs = segment(w);
  return emoji ? { w, gs, pos, pattern: shape(gs), emoji } : { w, gs, pos, pattern: shape(gs) };
}

const tokens = (text) => text.split(/[\s,]+/).filter(Boolean);
const lines = (text) => text.split('\n').map((l) => l.trim()).filter(Boolean);
const picture = (token) => {
  const [w, emoji] = token.split('=');
  return { w, emoji };
};

export const WORDS = [...tokens(WORD_TEXT).map((t) => entry(t, 'word')), ...tokens(NAME_TEXT).map((t) => entry(t, 'name'))];

export const SENTENCES = lines(SENTENCE_TEXT);

export const STORIES = lines(STORY_TEXT).map((l) => {
  const [id, title, ...rest] = l.split(' | ');
  return { id, title, lines: rest };
});

export const RHYME_SETS = RHYME_TEXT.split(',').map((t) => tokens(t)).filter((t) => t.length).map(([a, b, odd]) => ({ a: picture(a), b: picture(b), odd: picture(odd) }));

export const SYLLABLE_WORDS = tokens(SYLLABLE_TEXT).map((t) => {
  const [said, emoji] = t.split('=');
  const parts = said.split('-');
  return { w: parts.join(''), parts, n: parts.length, emoji };
});

export const FIRST_SOUND_SETS = lines(FIRST_SOUND_TEXT).map((l) => {
  const [head, odd] = l.split(' / ');
  const [sound, ...words] = tokens(head);
  return { sound, words: words.map(picture), odd: picture(odd.trim()) };
});
