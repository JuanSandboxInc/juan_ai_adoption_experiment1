#!/usr/bin/env python3
"""Compose a local mirror of the live Webflow page (v2) at site/index.html.

Mirrors what is published at https://sb-ai-adoption-page.webflow.io/intro-to-ai
as closely as a static file can:

  * section order and source (old = webflow/sections, v2 = webflow/sections-v2):
      01 nav (old) · 02 hero (v2) · 03 what is AI (v2) · 04 history (old: timeline + quiz embeds)
      05 how it works (v2 shell + howitworks embed) · 06 LLMs (v2) · 07 reasoning (v2)
      08 risks (v2) · 09 public interest (v2) · 10 references (v2) · 11 CTA (old)
      12 glossary (v2) · 13 footer (old)
  * CSS: 00-base.css + 00-base2.css + each section's CSS (as pasted into WHTML)
  * font embed (embeds/font.html) in <head>
  * Code Embeds in their slots: timeline, quiz (embeds/dist), howitworks (embeds/src)
  * reasoning slots: live they hold an <img> of an animated WebP; locally media/*.webp
  * page behaviours (embeds/page-behaviours.html) and the concatenated v2 section
    scripts (embeds/dist/sections-v2-scripts.html) at the end of <body>

Not mirrored: Webflow publishes native <button> as <a href="#" class="w-button">.
The local mirror keeps real <button>s, so tests must select by class / data attributes.

Images are served from assets/images (-> site/a/) and assets/media (-> site/media/).
The timeline embed loads its photos from Webflow's CDN, which may be unreachable locally.

Usage: python3 scripts/build_local.py
"""
import os
import shutil

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OLD = os.path.join(ROOT, 'webflow', 'sections')
NEW = os.path.join(ROOT, 'webflow', 'sections-v2')
EMBEDS = os.path.join(ROOT, 'embeds')
SITE = os.path.join(ROOT, 'site')

ORDER = [
    ('01-nav', OLD), ('02-hero', NEW), ('03-what-is-ai', NEW), ('04-history', OLD),
    ('05-how-it-works', NEW), ('06-llms', NEW), ('07-reasoning', NEW), ('08-risks', NEW),
    ('09-public-interest', NEW), ('10-references', NEW), ('11-cta', OLD), ('12-glossary', NEW),
    ('13-footer', OLD),
]

REASONING_IMG = {
    'reason-video': ('media/reason.webp',
                     'An input passes through a neural network into a loop of plan, evaluate and conclude'),
    'agentic-video': ('media/agentic.webp',
                      'An agent plans steps, uses tools and checks results until the task is done'),
}


def read(path):
    with open(path, encoding='utf-8') as f:
        return f.read()


def main():
    css = [read(os.path.join(OLD, '00-base.css')), read(os.path.join(NEW, '00-base2.css'))]
    body = []
    for name, d in ORDER:
        css.append(read(os.path.join(d, name + '.css')))
        body.append(read(os.path.join(d, name + '.html')))
    markup = '\n'.join(body).replace('src="ASSET:', 'src="a/')

    embeds = {
        'timeline': read(os.path.join(EMBEDS, 'dist', 'timeline.html')),
        'quiz': read(os.path.join(EMBEDS, 'dist', 'quiz.html')),
        'howitworks': read(os.path.join(EMBEDS, 'src', 'howitworks.html')),
    }
    for key, (src, alt) in REASONING_IMG.items():
        embeds[key] = (f'<img src="{src}" alt="{alt}" loading="lazy" '
                       'style="display:block;width:100%;height:100%;object-fit:cover">')
    for key, html in embeds.items():
        slot = f'<div class="embed-slot" data-embed="{key}"></div>'
        if slot not in markup:
            raise SystemExit(f'embed slot for {key} not found in sections')
        markup = markup.replace(slot, f'<div class="embed-slot" data-embed="{key}">{html}</div>')
    if 'data-embed="predict"' in markup:
        raise SystemExit('predict embed slot is still present; it was retired in v2')

    font = read(os.path.join(EMBEDS, 'font.html'))
    behaviours = read(os.path.join(EMBEDS, 'page-behaviours.html'))
    scripts = read(os.path.join(EMBEDS, 'dist', 'sections-v2-scripts.html'))

    doc = f"""<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intro to AI (local mirror, v2)</title>
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
{scripts}
</body></html>
"""
    os.makedirs(SITE, exist_ok=True)
    for sub, src in (('a', os.path.join(ROOT, 'assets', 'images')),
                     ('media', os.path.join(ROOT, 'assets', 'media'))):
        dst = os.path.join(SITE, sub)
        if os.path.isdir(dst):
            shutil.rmtree(dst)
        shutil.copytree(src, dst)
    with open(os.path.join(SITE, 'index.html'), 'w', encoding='utf-8') as f:
        f.write(doc)
    print(f'site/index.html written ({len(doc):,} bytes)')


if __name__ == '__main__':
    main()
