"""Compose the v2 (Boaz-aligned) page locally: webflow/v2site/index.html"""
import os, shutil, glob
S = '/tmp/claude-0/-home-claude/5f089c09-0eca-57f6-a3a6-b7e96f4817a9/scratchpad'
OLD, NEW = S + '/webflow/sections', S + '/webflow/sections2'
OUT = S + '/webflow/v2site'
ORDER = [('01-nav', OLD), ('02-hero', NEW), ('03-what-is-ai', NEW), ('04-history', OLD), ('05-how-it-works', NEW),
         ('06-llms', NEW), ('07-reasoning', NEW), ('08-risks', NEW), ('09-public-interest', NEW),
         ('10-references', NEW), ('11-cta', OLD), ('12-glossary', NEW), ('13-footer', OLD)]
r = lambda p: open(p, encoding='utf-8').read()
css = [r(OLD + '/00-base.css'), r(NEW + '/00-base2.css')]
body = []
for name, d in ORDER:
    css.append(r(f'{d}/{name}.css')); body.append(r(f'{d}/{name}.html'))
m = '\n'.join(body).replace('src="ASSET:', 'src="a/')
emb = {
    'timeline': r(S + '/repo/embeds/dist/timeline.html'),
    'quiz': r(S + '/repo/embeds/dist/quiz.html'),
    'howitworks': r(S + '/scripted/embeds/howitworks.html'),
    'reason-video': r(S + '/scripted/embeds/reason-video.html'),
    'agentic-video': r(S + '/scripted/embeds/agentic-video.html'),
}
for k, v in emb.items():
    if k.endswith('video'):
        base = k.split('-')[0]
        v = v.replace('VIDEO_URL_MP4', f'media/{base}.mp4').replace('VIDEO_URL_WEBM', f'media/{base}.webm').replace('POSTER_URL', f'media/{base}-poster.jpg')
    slot = f'<div class="embed-slot" data-embed="{k}"></div>'
    assert slot in m, k
    m = m.replace(slot, f'<div class="embed-slot" data-embed="{k}">{v}</div>')
js = ''.join(f'<script>\n{r(p)}\n</script>\n' for p in sorted(glob.glob(NEW + '/js/*.js')))
doc = f"""<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Intro to AI v2 (local)</title>
<style>{r(S + '/fonts.css')}</style>
<style>
body {{ margin:0; background:#13181d; color:#fff; font-family: Switzer, Arial, sans-serif; -webkit-font-smoothing: antialiased; }}
* {{ box-sizing: border-box; }} img {{ max-width:100%; vertical-align:middle; display:inline-block; }}
h1 {{ font-size:38px; line-height:44px; margin:20px 0 10px; font-weight:bold; }} h2 {{ font-size:32px; line-height:36px; margin:20px 0 10px; font-weight:bold; }}
h3 {{ font-size:24px; line-height:30px; margin:20px 0 10px; font-weight:bold; }} p {{ margin:0 0 10px; }} ul, ol {{ margin:0 0 10px; padding-left:40px; }}
html {{ scroll-behavior:smooth }} .chapter-nav-list::-webkit-scrollbar{{display:none}}
{chr(10).join(css)}
</style></head><body>
{m}
{r(S + '/webflow/page-footer.html')}
{js}</body></html>"""
os.makedirs(OUT, exist_ok=True)
for sub, src in (('a', S + '/repo/assets/images'), ('media', NEW + '/media')):
    if os.path.isdir(f'{OUT}/{sub}'): shutil.rmtree(f'{OUT}/{sub}')
    shutil.copytree(src, f'{OUT}/{sub}')
open(OUT + '/index.html', 'w', encoding='utf-8').write(doc)
print(len(doc))
