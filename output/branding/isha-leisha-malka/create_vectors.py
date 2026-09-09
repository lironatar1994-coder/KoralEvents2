from pathlib import Path
from fontTools.ttLib import TTFont
from fontTools.pens.svgPathPen import SVGPathPen
import cairosvg

OUT = Path(__file__).parent
font = TTFont('C:/Windows/Fonts/arialbd.ttf')
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
units = font['head'].unitsPerEm
plum, gold, ivory = '#611B43', '#B98B37', '#FBF7EF'

def lettering(text, size, baseline):
    # Hebrew has no contextual shaping here; reverse the logical string to
    # place these Hebrew-only lines and their enclosing quotes left to right.
    names = [cmap[ord(c)] for c in text[::-1]]
    scale = size / units
    width = sum(glyphs[n].width for n in names) * scale
    x = (1000 - width) / 2
    result = []
    for name in names:
        pen = SVGPathPen(glyphs)
        glyphs[name].draw(pen)
        if pen.getCommands():
            result.append(f'<path transform="translate({x:.3f} {baseline}) scale({scale:.6f} {-scale:.6f})" d="{pen.getCommands()}"/>')
        x += glyphs[name].width * scale
    return f'<g fill="{plum}">' + ''.join(result) + '</g>'

def crown():
    return f'''<g fill="{gold}">
    <circle cx="500" cy="188" r="34"/>
    <circle cx="320" cy="259" r="29"/>
    <circle cx="680" cy="259" r="29"/>
    <path d="M300 307 Q392 354 466 242 Q477 231 484 246 Q458 321 422 370 L407 445 L354 445 Z"/>
    <path d="M700 307 Q608 354 534 242 Q523 231 516 246 Q542 321 578 370 L593 445 L646 445 Z"/>
    <path d="M484 263 Q465 337 472 375 Q476 398 500 408 Q524 398 528 375 Q535 337 516 263 Q557 324 553 374 Q549 431 500 442 Q451 431 447 374 Q443 324 484 263Z"/>
    <path d="M356 454 Q500 412 644 454 L635 482 Q500 447 365 482Z"/>
    </g>'''

def svg(content, background=None):
    rect = f'<rect width="1000" height="1000" fill="{background}"/>' if background else ''
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1000 1000" role="img"><title>&quot;אשה לאשה מלכה&quot;</title>' + rect + content + '</svg>'

full = crown() + lettering('"אשה לאשה', 105, 639) + lettering('מלכה"', 179, 808)
icon = '<g transform="translate(-120 -34) scale(1.24)">' + crown() + '</g>'
# Keep the compact mark centered inside a circular avatar crop.
icon = '<g transform="translate(0 135)">' + icon + '</g>'
for name, content, bg in [
    ('logo-vector-transparent', full, None),
    ('logo-vector-ivory', full, ivory),
    ('profile-icon', icon, plum),
    ('symbol-transparent', icon, None),
]:
    path = OUT / f'{name}.svg'
    path.write_text(svg(content, bg), encoding='utf-8')
    cairosvg.svg2png(url=str(path), write_to=str(OUT / f'{name}.png'), output_width=1600, output_height=1600)
cairosvg.svg2png(url=str(OUT / 'profile-icon.svg'), write_to=str(OUT / 'profile-icon-96.png'), output_width=96, output_height=96)
print('Created four SVG files, four full-size PNG files and a 96px icon preview.')
