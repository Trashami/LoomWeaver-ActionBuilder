"""Validate initial HTML, metadata, schema, links, assets, and sitemap offline."""
from html.parser import HTMLParser
from pathlib import Path
import json
import xml.etree.ElementTree as ET
from prerender_ssr_routes import PAGES, ASSETS, AUTH, ALIASES, DIST, FAQS


class Document(HTMLParser):
    def __init__(self, html):
        super().__init__()
        self.tags = []
        self.schemas = []
        self.recording = False
        self.buffer = ''
        self.h1_count = 0
        self.feed(html)

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        self.tags.append((tag, attrs))
        if tag == 'h1':
            self.h1_count += 1
        if tag == 'script' and attrs.get('type') == 'application/ld+json':
            self.recording = True
            self.buffer = ''

    def handle_data(self, data):
        if self.recording:
            self.buffer += data

    def handle_endtag(self, tag):
        if tag == 'script' and self.recording:
            self.schemas.append(json.loads(self.buffer))
            self.recording = False


def check():
    failures = []

    def expect(condition, message):
        if not condition:
            failures.append(message)

    for key, page in PAGES.items():
        path = DIST / page['path'].lstrip('/') / 'index.html'
        expect(path.exists(), f'{key}: missing initial HTML')
        if not path.exists():
            continue
        html = path.read_text(encoding='utf-8')
        doc = Document(html)
        canonical = [a['href'] for t, a in doc.tags if t == 'link' and a.get('rel') == 'canonical']
        meta = {a.get('name', a.get('property')): a.get('content') for t, a in doc.tags if t == 'meta'}
        expect(canonical == [page['canonical']], f'{key}: canonical mismatch')
        expect(meta.get('description') == page['description'], f'{key}: description mismatch')
        expect(meta.get('og:title') == page['title'], f'{key}: title mismatch')
        expect(doc.h1_count == 1, f'{key}: expected one H1')
        expect(('noindex' in meta.get('robots', '')) == (key in AUTH), f'{key}: incorrect indexing policy')
        expect(page['h1Line1'] in html, f'{key}: missing route-specific heading')
        for tag, attrs in doc.tags:
            if tag == 'img' and attrs.get('src', '').startswith('/'):
                expect((DIST / attrs['src'].lstrip('/')).is_file(), f'{key}: missing image {attrs["src"]}')
        graph = [node for schema in doc.schemas for node in schema.get('@graph', [])]
        expect({'WebSite', 'Organization', 'SoftwareApplication', 'FAQPage'} <= {n['@type'] for n in graph}, f'{key}: missing schema')
        faq = next(n for n in graph if n['@type'] == 'FAQPage')
        expect([q['acceptedAnswer']['text'] for q in faq['mainEntity']] == [q['answer'] for q in FAQS], f'{key}: FAQ schema drift')
        hrefs = {a.get('href') for t, a in doc.tags if t == 'a'}
        expect({'/vtt', '/campaign-manager', '/battlemap-builder', '/ai-campaign-assistant', '/features', '/about', '/login', '/register'} <= hrefs, f'{key}: missing crawlable navigation')
    sitemap = ET.parse(DIST / 'sitemap.xml')
    urls = {x.text for x in sitemap.findall('.//{*}loc')}
    expect(urls == {p['canonical'] for k, p in PAGES.items() if k not in AUTH}, 'Sitemap does not match indexable canonical pages')
    for alias in ALIASES:
        expect((DIST / alias / 'index.html').is_file(), f'Missing alias {alias}')
    for src in ASSETS.values():
        expect((DIST / src.lstrip('/')).is_file(), f'Missing configured asset {src}')
    if failures:
        raise SystemExit('\n'.join(failures))
    print(f'PASS: {len(PAGES)} canonical pages, {len(ALIASES)} aliases, metadata, schema, image files, navigation and sitemap.')


if __name__ == '__main__':
    check()
