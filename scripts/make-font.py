"""Build fonts/er-letters-bold.woff2, the app's reading font.

It is Andika Bold from SIL International: the literacy typeface with the single-storey
"a" and "g" that children learn to write. Cut down to Latin letters (names such as
Émile and Wanjikũ included) to keep it small.

The Open Font License reserves the names "Andika" and "SIL", and a subset counts as a
modified version, so the copy is renamed "ER Letters". fonts/OFL.txt ships beside it.

Usage, with Andika-Bold.ttf from https://github.com/google/fonts/tree/main/ofl/andika:
    pip install fonttools brotli
    python3 scripts/make-font.py path/to/Andika-Bold.ttf
"""
import sys
from pathlib import Path

from fontTools import subset
from fontTools.ttLib import TTFont

source = Path(sys.argv[1])
out = Path(__file__).resolve().parent.parent / 'fonts' / 'er-letters-bold.woff2'

opts = subset.Options()
opts.flavor = 'woff2'
opts.layout_features = ['kern']
opts.hinting = False
opts.desubroutinize = True

font = TTFont(source)
codes = (
    list(range(0x20, 0x7F))  # Basic Latin
    + list(range(0xA0, 0x180))  # Latin-1 and Latin Extended-A
    + [0x2013, 0x2014, 0x2018, 0x2019, 0x201C, 0x201D, 0x2026, 0xB7]  # dashes, quotes, ellipsis
)
subsetter = subset.Subsetter(opts)
subsetter.populate(unicodes=codes)
subsetter.subset(font)

names = {1: 'ER Letters', 16: 'ER Letters', 3: 'ER Letters Bold', 4: 'ER Letters Bold', 6: 'ERLetters-Bold', 17: 'Bold'}
for rec in font['name'].names:
    if rec.nameID in names:
        rec.string = names[rec.nameID]

font.flavor = 'woff2'
font.save(out)
print(f'{out} {out.stat().st_size} bytes')
