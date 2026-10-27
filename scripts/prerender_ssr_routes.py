"""Generate public static HTML from the same JSON consumed by Angular.

This is build-time static rendering, not an Angular SSR runtime. Authenticated
studios remain client-rendered and protected by the existing guards and APIs.
"""
from pathlib import Path
from html import escape
import argparse
import json
import re
import xml.etree.ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
CONTENT = ROOT / 'frontend/src/app/features/landing'
PUBLIC = ROOT / 'frontend/public'
DIST = ROOT / 'frontend/dist/loomweaver-v2/browser'
ORIGIN = 'https://loom-weaver.com'
PAGES = json.loads((CONTENT / 'landing-seo-pages.json').read_text(encoding='utf-8'))
ASSETS = json.loads((CONTENT / 'landing-assets.json').read_text(encoding='utf-8'))
FAQS = json.loads((CONTENT / 'landing-faqs.json').read_text(encoding='utf-8'))
AUTH = {'login', 'register'}
ALIASES = {'welcome': 'home', 'marketing': 'home',
           'features/virtual-tabletop': 'vtt', 'features/campaign-memory': 'ai-campaign-assistant',
           'features/worldbuilding-ai': 'campaign-manager', 'features/world-atlas-quests': 'battlemap-builder',
           'features/creator-marketplace': 'features'}


def image(src, alt, eager=False):
    return (f'<img src="{escape(src)}" alt="{escape(alt)}" width="1280" height="720" '
            f'loading="{"eager" if eager else "lazy"}" decoding="async"'
            f'{" fetchpriority=high" if eager else ""}>')


def links():
    return ''.join(f'<a href="{escape(p["path"])}">{escape(p["navLabel"])}</a>'
                   for key, p in PAGES.items() if key not in AUTH)


def body(page):
    available = ''.join(f'<li>{escape(x)}</li>' for x in page['availableToday'])
    planned = ''.join(f'<li>{escape(x)}</li>' for x in page['plannedNext'])
    sections = ''
    for key, title, text in [
        ('why', 'One connected world', 'Keep campaign notes, maps, and studio tools within reach.'),
        ('features', 'Run the story, not the software.', 'Explore the V2 product pages and the development roadmap.'),
        ('experience', 'Campaign memory and tabletop play', 'Illustrative previews show the intended connected studio experience.'),
        ('pricing', 'Players can participate for free', 'Free player participation is a core LoomWeaver product requirement.'),
        ('marketplace', 'Creator-first marketplace', 'The planned marketplace uses an 85/15 creator revenue split.'),
        ('faq', 'Frequently asked questions', '')]:
        extra = ''.join(f'<details><summary>{escape(q["question"])}</summary><p>{escape(q["answer"])}</p></details>' for q in FAQS) if key == 'faq' else ''
        sections += f'<section id="{key}" class="ssr-card"><h2>{title}</h2>{image(ASSETS[key+"Image"], "LoomWeaver "+key+" illustration")}<p>{text}</p>{extra}</section>'
    return f'''<div class="ssr-lw-shell">
<header class="ssr-topnav"><a class="ssr-brand" href="/">{image(ASSETS['brandLogoWordmark'], 'LoomWeaver', True)}<span><strong>LoomWeaver</strong><small>Your Campaign. One Living World.</small></span></a>
<nav aria-label="Primary navigation">{links()}</nav><a href="/login">Sign In</a><a href="/register">Start Free</a></header>
<main class="ssr-wrap"><section class="ssr-hero-grid"><div><span class="ssr-eyebrow">{escape(page['eyebrow'])}</span>
<h1>{escape(page['h1Line1'])}<br><em>{escape(page['h1Highlight'])}</em></h1><p>{page['leadHtml']}</p>
<a class="ssr-btn" href="/login?returnUrl={escape(page['studioRoute'])}">Open Studio</a></div>{image(page['screenshot'], page['screenshotAlt'], True)}</section>
<section class="ssr-card"><h2>{escape(page['spotlightTitle'])}</h2><p>{escape(page['spotlightDescription'])}</p>
<p>V2 is in development. Studio illustrations are previews; release gates determine which capabilities are ready.</p>
<h3>Available Today</h3><ul>{available}</ul><h3>In Development / Planned</h3><ul>{planned}</ul></section>{sections}</main>
<footer class="ssr-wrap"><p>LoomWeaver — Your Campaign. One Living World. · loom-weaver.com</p><nav aria-label="Footer navigation">{links()}<a href="/login">Sign In</a><a href="/register">Create Free Account</a></nav></footer></div>'''


def schema():
    return {'@context': 'https://schema.org', '@graph': [
        {'@type': 'WebSite', '@id': ORIGIN+'/#website', 'name': 'LoomWeaver',
         'alternateName': ['LoomWeaver TTRPG', 'LoomWeaver VTT', 'Loom-Weaver', 'Loom Weaver'],
         'url': ORIGIN+'/', 'publisher': {'@id': ORIGIN+'/#organization'}},
        {'@type': 'Organization', '@id': ORIGIN+'/#organization', 'name': 'LoomWeaver',
         'url': ORIGIN+'/', 'logo': ORIGIN+ASSETS['brandLogoWordmark'],
         'sameAs': ['https://github.com/Trashami/LoomWeaverV2']},
        {'@type': 'SoftwareApplication', 'name': 'LoomWeaver', 'url': ORIGIN+'/',
         'applicationCategory': 'GameApplication', 'operatingSystem': 'Web Browser',
         'description': PAGES['home']['description']},
        {'@type': 'FAQPage', 'mainEntity': [
            {'@type': 'Question', 'name': q['question'],
             'acceptedAnswer': {'@type': 'Answer', 'text': q['answer']}} for q in FAQS]}]}


STYLE = '''<style id="public-prerender-style">
html,body{margin:0;background:#05100c;color:#dce8e1}
html.lw-studio-boot .ssr-lw-shell{display:none!important}
.ssr-lw-shell{background:#05100c;color:#dce8e1;font:15px/1.65 Inter,system-ui,sans-serif;min-height:100vh}
.ssr-lw-shell *{box-sizing:border-box}.ssr-lw-shell a{color:#d9b77a;text-decoration:none}
.ssr-wrap{max-width:1380px;margin:auto;padding:28px}.ssr-topnav{display:flex;align-items:center;gap:20px;flex-wrap:wrap;background:#0c1313;border-bottom:1px solid #514733;padding:14px 24px}
.ssr-brand{display:flex;align-items:center;gap:16px}.ssr-brand img{width:136px;height:42px;object-fit:contain}.ssr-brand small{display:block;color:#9eb8ab;font-size:11px}
.ssr-lw-shell nav{display:flex;gap:16px;flex-wrap:wrap}.ssr-topnav nav{flex:1;font-size:12px}.ssr-lw-shell img{max-width:100%;height:auto;object-fit:cover}
.ssr-hero-grid{display:grid;grid-template-columns:1fr 1fr;gap:38px;align-items:center;padding:48px 0}.ssr-lw-shell h1{font:clamp(36px,4vw,64px)/1.12 Georgia,serif;color:#f5efe2}.ssr-lw-shell h1 em{color:#49e892;font-style:normal}
.ssr-card{margin:24px 0;padding:28px;border:1px solid #514733;background:#0b1814;border-radius:3px}.ssr-card>img{display:block;width:100%;max-height:320px;object-fit:cover}
.ssr-btn{display:inline-block;padding:12px 22px;border:1px solid #d9b77a}.ssr-lw-shell details{padding:12px;border-bottom:1px solid #294335}.ssr-lw-shell summary{cursor:pointer}
@media(max-width:760px){.ssr-hero-grid{grid-template-columns:1fr}.ssr-wrap{padding:16px}.ssr-topnav{gap:12px}.ssr-topnav nav{flex-basis:100%;order:3}}
</style><script id="lw-boot-guard">(function(){try{var p=(location.pathname||'/').replace(/\\/+$/,'')||'/';var h=(location.hostname||'').toLowerCase();var sub=/^(maps|vtt|vtt3d|actionbuilder|effectbuilder|3dassets|generator)\\./.test(h);var tok=(window.localStorage&&localStorage.getItem('mw_auth_token'))||document.cookie.indexOf('mw_auth_token=')!==-1;var pub={'/':'1','/vtt':'1','/campaign-manager':'1','/battlemap-builder':'1','/effect-builder':'1','/encounter-builder':'1','/3d-assets':'1','/ai-campaign-assistant':'1','/features':'1','/about':'1','/welcome':'1','/marketing':'1','/login':'1','/register':'1'};if((!pub[p]&&p.indexOf('/features/')!==0)||(sub&&tok)){document.documentElement.classList.add('lw-studio-boot');}}catch(e){}})();</script>'''


def render(base, page):
    html = re.sub(r'<script type="application/ld\+json">[\s\S]*?</script>', '', base)
    html = re.sub(r'<script id="lw-boot-guard">[\s\S]*?</script>', '', html)
    html = re.sub(r'<style[\s\S]*?</style>', '', html)
    html = re.sub(r'<title>.*?</title>', '<title>'+escape(page['title'])+'</title>', html)
    for key, value in [('description', page['description']), ('robots', 'noindex, follow' if page['slug'] in AUTH else 'index, follow, max-image-preview:large'), ('twitter:title', page['title']), ('twitter:description', page['description'])]:
        html = re.sub(r'<meta name="'+key+r'" content="[^"]*">', f'<meta name="{key}" content="{escape(value, quote=True)}">', html)
    for key,value in [('og:title',page['title']),('og:description',page['description']),('og:url',page['canonical'])]:
        html = re.sub(r'<meta property="'+key+r'" content="[^"]*">', f'<meta property="{key}" content="{escape(value, quote=True)}">', html)
    html = re.sub(r'<link rel="canonical" href="[^"]*">', '<link rel="canonical" href="'+page['canonical']+'">',html)
    html = html.replace('</head>', '<script type="application/ld+json">'+json.dumps(schema()).replace('<',r'\u003c')+'</script>'+STYLE+'</head>')
    html = re.sub(r'<lw-root>[\s\S]*?</lw-root>', '<lw-root>'+body(page)+'</lw-root>', html)
    return "\n".join(line.rstrip() for line in html.splitlines()) + "\n"


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--source',action='store_true');args=parser.parse_args()
    index=ROOT/'frontend/src/index.html' if args.source else DIST/'index.html'
    if not index.exists(): raise SystemExit('Build output missing: '+str(index))
    base=index.read_text(encoding='utf-8')
    if args.source:
        index.write_text(render(base,PAGES['home']),encoding='utf-8')
    else:
        for key,page in PAGES.items():
            dest=DIST/page['path'].lstrip('/')/'index.html';dest.parent.mkdir(parents=True,exist_ok=True)
            dest.write_text(render(base,page),encoding='utf-8')
        for route,key in ALIASES.items():
            dest=DIST/route/'index.html';dest.parent.mkdir(parents=True,exist_ok=True);dest.write_text(render(base,PAGES[key]),encoding='utf-8')
    sitemap=ET.Element('urlset',xmlns='http://www.sitemaps.org/schemas/sitemap/0.9')
    for key,page in PAGES.items():
        if key not in AUTH: ET.SubElement(ET.SubElement(sitemap,'url'),'loc').text=page['canonical']
    xml=ET.tostring(sitemap,encoding='utf-8',xml_declaration=True)
    (PUBLIC/'sitemap.xml').write_bytes(xml)
    if not args.source: (DIST/'sitemap.xml').write_bytes(xml)
    print('Generated public HTML, structured data and sitemap from shared landing JSON.')


if __name__ == '__main__':
    main()
