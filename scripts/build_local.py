#!/usr/bin/env python3
"""Compose a local mirror of the Webflow page at site/index.html.

Mirrors what is live in Webflow as closely as a static file can:
  * native sections (webflow/sections/NN-*.html + .css, plus 00-base.css)
  * font embed (embeds/font.html) in <head>
  * the three Code Embeds exactly as pasted (embeds/dist/*.html) in their slots
  * page behaviours (embeds/page-behaviours.html) at the end of <body>

Images are served from assets/images (copied to site/a/) because they are not
yet uploaded to Webflow's asset library.

Usage: python3 scripts/build_local.py
"""
import glob
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SECTIONS = os.path.join(ROOT, 'webflow', 'sections')
EMBEDS = os.path.join(ROOT, 'embeds')
SITE = os.path.join(ROOT, 'site')
ASSET_DIR = 'a/'          # site/a/ <- assets/images/
TIMELINE_IMG_BASE = ASSET_DIR + 'hist/'


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def main():
    css = [read(os.path.join(SECTIONS, '00-base.css'))]
    body = []
    for h in sorted(glob.glob(os.path.join(SECTIONS, '[0-9][0-9]-*.html'))):
        css.append(read(h[:-5] + '.css'))
        body.append(read(h))
    markup = '\n'.join(body).replace('src="ASSET:', 'src="' + ASSET_DIR)

    for name in ('timeline', 'quiz', 'predict'):
        slot = f'<div class="embed-slot" data-embed="{name}"></div>'
        if slot not in markup:
            raise SystemExit(f'embed slot for {name} not found in sections')
        emb = read(os.path.join(EMBEDS, 'dist', f'{name}.html'))
        # the timeline reads its image base from the closest [data-img-base] ancestor
        attrs = f' data-img-base="{TIMELINE_IMG_BASE}"' if name == 'timeline' else ''
        markup = markup.replace(slot, f'<div class="embed-slot" data-embed="{name}"{attrs}>{emb}</div>')

    font = read(os.path.join(EMBEDS, 'font.html'))
    behaviours = read(os.path.join(EMBEDS, 'page-behaviours.html'))

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intro to AI (local mirror)</title>
{font}
<style>
/* local stand-ins for Webflow's normalize + body styles */
body {{ color: #fff; font-family: Switzer, Arial, sans-serif; -webkit-font-smoothing: antialiased; }}
* {{ box-sizing: border-box; }}
img {{ max-width: 100%; vertical-align: middle; display: inline-block; }}
h1 {{ font-size: 38px; line-height: 44px; margin: 20px 0 10px; font-weight: bold; }}
h2 {{ font-size: 32px; line-height: 36px; margin: 20px 0 10px; font-weight: bold; }}
h3 {{ font-size: 24px; line-height: 30px; margin: 20px 0 10px; font-weight: bold; }}
h4 {{ font-size: 18px; line-height: 24px; margin: 10px 0; font-weight: bold; }}
p {{ margin: 0 0 10px; }}
ul, ol {{ margin: 0 0 10px; padding-left: 40px; }}
/* ---- section CSS (as pasted into WHTML) ---- */
{chr(10).join(css)}
</style></head>
<body>
{markup}
{behaviours}
</body></html>
"""
    os.makedirs(SITE, exist_ok=True)
    dst_assets = os.path.join(SITE, ASSET_DIR)
    if os.path.isdir(dst_assets):
        shutil.rmtree(dst_assets)
    shutil.copytree(os.path.join(ROOT, 'assets', 'images'), dst_assets)
    with open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
    print(f'site/index.html written ({len(doc):,} bytes)')


if __name__ == '__main__':
    main()
