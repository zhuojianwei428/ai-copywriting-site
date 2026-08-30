import re, glob

KW = 'ai copywriting tools'
files = (['index.html', 'tools.html', 'privacy.html', 'terms.html', 'contact.html']
         + sorted(glob.glob('tools/*.html'))
         + sorted(glob.glob('for-*.html'))
         + sorted(glob.glob('blog/*.html')))

print('%-56s %-4s %-4s %-4s %s' % ('FILE', 'TTL', 'H1', 'DESC', 'BODY'))
zero = []
for f in files:
    s = open(f, encoding='utf-8').read()
    t = re.search(r'<title>(.*?)</title>', s, re.S)
    h = re.search(r'<h1[^>]*>(.*?)</h1>', s, re.S)
    d = re.search(r'<meta name="description" content="(.*?)"', s, re.S)
    body = re.sub(r'<script.*?</script>|<style.*?</style>', ' ', s, flags=re.S)
    body = re.sub(r'<[^>]+>', ' ', body)

    def clean(m):
        return re.sub(r'\s+', ' ', m.group(1)).strip().lower() if m else ''

    tt, hh, dd = clean(t), clean(h), clean(d)
    n = len(re.findall(re.escape(KW), body.lower()))
    mark = lambda x: 'Y' if KW in x else '-'
    if not (KW in tt or KW in hh or KW in dd or n):
        zero.append(f)
    print('%-56s %-4s %-4s %-4s %d' % (f, mark(tt), mark(hh), mark(dd), n))

print('\n0-keyword pages:', len(zero), zero)

# CJK scan
cjk = re.compile(r'[\u4e00-\u9fff\u3000-\u303f\uff00-\uffef]')
tot = 0
for f in files + ['style.css']:
    s = open(f, encoding='utf-8').read()
    for i, line in enumerate(s.splitlines(), 1):
        for m in cjk.finditer(line):
            tot += 1
            print('CJK %s:%d %s' % (f, i, m.group()))
print('TOTAL CJK:', tot)
