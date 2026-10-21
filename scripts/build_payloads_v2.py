"""Build WHTML payloads for the v2 sections: webflow/payloads-v2/NN-name.json ({html, css}).

Each payload carries only the CSS rules whose classes the section uses (base + section CSS).
:focus-visible rules are dropped from the payload (WHTML rejects them) and live in embeds/font.html.
Usage: python3 scripts/build_payloads_v2.py
"""
import re, json, os
S = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), 'webflow')
def blocks(css):
    out=[]; i=0; css=re.sub(r'/\*.*?\*/','',css,flags=re.S)
    while True:
        j=css.find('{',i)
        if j<0: break
        head=css[i:j].strip()
        if head.startswith('@media'):
            depth=1;k=j+1
            while depth:
                if css[k]=='{':depth+=1
                elif css[k]=='}':depth-=1
                k+=1
            out.append(('media',head,blocks(css[j+1:k-1]))); i=k
        else:
            k=css.find('}',j); out.append(('rule',head,css[j+1:k].strip())); i=k+1
    return out
def keep(sel,used):
    if ':focus-visible' in sel: return False
    cls=set(re.findall(r'\.([A-Za-z0-9_-]+)',sel)); return cls and cls<=used
def emit(bl,used):
    parts=[]
    for b in bl:
        if b[0]=='rule':
            sels=[s.strip() for s in b[1].split(',') if keep(s,used)]
            if sels: parts.append(f"{', '.join(sels)} {{ {b[2]} }}")
        else:
            inner=emit(b[2],used)
            if inner: parts.append(f"{b[1]} {{ {inner} }}")
    return ' '.join(parts)
base=blocks(open(S+'/sections/00-base.css').read())+blocks(open(S+'/sections-v2/00-base2.css').read())
os.makedirs(S+'/payloads-v2',exist_ok=True)
for f in sorted(os.listdir(S+'/sections-v2')):
    if not re.match(r'\d\d-[a-z-]+\.html$',f): continue
    n=f[:-5]; h=open(f'{S}/sections-v2/{f}').read()
    used=set(c for a in re.findall(r'class="([^"]*)"',h) for c in a.split())
    css=emit(base,used)+' '+emit(blocks(open(f'{S}/sections-v2/{n}.css').read()),used)
    h=re.sub(r'\s*\n\s*',' ',h).strip()
    json.dump({'html':h,'css':css.strip()},open(f'{S}/payloads-v2/{n}.json','w'),ensure_ascii=False)
    print(n,len(h),len(css), 'ASSET' in h)
