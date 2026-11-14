#!/usr/bin/env python3
"""Copy the shirt art (dark version) out of tshirt-v2.html into the site's home page splash partial."""
import os, re
here = os.path.dirname(os.path.abspath(__file__))
src = open(os.path.join(here, 'tshirt-v2.html')).read()
svg = src[src.index('<svg'):src.index('</svg>') + len('</svg>')]
svg = re.sub(r' width="1200" height="1200"', ' class="splash-art" role="img" aria-labelledby="splash-title"', svg, count=1)
svg = svg.replace('<defs>', '<title id="splash-title">PocketCon 2027, February 6, live on Discord</title>\n  <defs>', 1)
# Fonts come from the page (Space Grotesk 700, JetBrains Mono 700), so set them inline instead of via the design file's classes.
svg = svg.replace('class="word"', 'font-family="Space Grotesk, sans-serif" font-weight="700"')
svg = svg.replace('class="mono"', 'font-family="JetBrains Mono, monospace" font-weight="700"')
out = os.path.join(here, '..', 'pb_pages', '_private', 'splash.svg')
os.makedirs(os.path.dirname(out), exist_ok=True)
open(out, 'w').write('<!-- Generated from design/tshirt-v2.html by design/splash.py; edit the design file, not this. -->\n' + svg + '\n')
print('wrote', os.path.relpath(out))
