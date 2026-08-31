#!/usr/bin/env python3
# 全站 SEO 基建注入 + 组件统一（导航 / logo / 页脚）
# 幂等：可反复运行，重复运行不会叠加标记块。
#
# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
# ★ 上线前只改这一行：换成你的真实域名（结尾不要带斜杠） ★
#   改完后跑一次 python _build.py 即可全站替换 canonical/sitemap/robots/og
SITE_URL = "https://aiwritereview.com"
# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★
# 站点名和联系邮箱在 _config.py 里改（页脚、法务页、结构化数据共用）
from _config import SITE_NAME
from _config import HIDE_TOOLS
# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

import os, re, glob, json, time

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

# 工具名（与 tools/ 下页面一一对应，用于首页 ItemList）
TOOL_SLUGS = [
    ("claude.html", "Claude"), ("sudowrite.html", "Sudowrite"),
    ("hemingway.html", "Hemingway Editor"), ("lex.html", "Lex.page"),
    ("copyai.html", "Copy.ai"), ("jasper.html", "Jasper"),
    ("rytr.html", "Rytr"), ("writesonic.html", "Writesonic"),
    ("chatgpt.html", "ChatGPT"), ("notion-ai.html", "Notion AI"),
    ("grammarlygo.html", "GrammarlyGO"),
]

AUDIENCE_PAGES = [
    ("for-office-workers.html", "Best AI Copywriting Tools for Office Workers"),
    ("for-content-creators.html", "Best AI Copywriting Tools for Content Creators"),
    ("for-self-media.html", "Best AI Copywriting Tools for Social Media Creators"),
    ("for-beginners.html", "Best AI Copywriting Tools for Beginners"),
]


def build_jsonld(p):
    """结构化数据。刻意不写 reviewRating：站内没有真实打分，造假会被 Google 处罚。"""
    root = SITE_URL.rstrip("/")
    url = page_url(p)
    blocks = []

    def breadcrumb(trails):
        items = [{"@type": "ListItem", "position": 1, "name": "Home", "item": root + "/"}]
        for i, (nm, it) in enumerate(trails, start=2):
            items.append({"@type": "ListItem", "position": i, "name": nm, "item": it})
        return {"@type": "BreadcrumbList", "itemListElement": items}

    if p == "index.html":
        blocks.append({
            "@context": "https://schema.org", "@type": "WebSite",
            "name": SITE_NAME, "url": root + "/",
            "description": "Real-tested AI copywriting tool reviews, graded on one thing: does the output sound human?",
        })
        if not HIDE_TOOLS:
            blocks.append({
                "@context": "https://schema.org", "@type": "ItemList",
                "name": "Tested AI copywriting tools",
                "numberOfItems": len(TOOL_SLUGS),
                "itemListElement": [
                    {"@type": "ListItem", "position": i,
                     "name": nm, "url": "%s/tools/%s" % (root, slug)}
                    for i, (slug, nm) in enumerate(TOOL_SLUGS, start=1)
                ],
            })

    elif p.startswith("tools/") and p != "tools.html":
        slug = os.path.basename(p)
        name = dict(TOOL_SLUGS).get(slug, slug.replace(".html", "").title())
        blocks.append({
            "@context": "https://schema.org", "@type": "SoftwareApplication",
            "name": name, "applicationCategory": "BusinessApplication",
            "operatingSystem": "Web", "url": url,
        })
        blocks.append(breadcrumb([("Tested tools", root + "/tools.html"), (name, url)]))

    elif p == "tools.html":
        blocks.append({
            "@context": "https://schema.org", "@type": "CollectionPage",
            "name": "The 11 tested AI copywriting tools", "url": url,
        })
        blocks.append(breadcrumb([("Tested tools", url)]))

    elif p.startswith("blog/"):
        blocks.append({
            "@context": "https://schema.org", "@type": "Article",
            "headline": "Blog — Real-Tested AI Copywriting Tools",
            "url": url, "author": {"@type": "Organization", "name": SITE_NAME},
            "publisher": {"@type": "Organization", "name": SITE_NAME},
        })
        blocks.append(breadcrumb([("Blog", url)]))

    elif p == "privacy.html" or p == "terms.html":
        nm = "Privacy Policy" if p == "privacy.html" else "Terms of Service"
        blocks.append({
            "@context": "https://schema.org", "@type": "WebPage",
            "name": "%s | %s" % (nm, SITE_NAME), "url": url,
        })
        blocks.append(breadcrumb([(nm, url)]))

    elif p == "contact.html":
        # 刻意不写 "email" 字段：JSON-LD 没法做实体混淆，写进去等于把邮箱
        # 明文喂给爬虫。页面正文里那套 &#...; 混淆就够了。
        blocks.append({
            "@context": "https://schema.org", "@type": "ContactPage",
            "name": "Contact %s" % SITE_NAME, "url": url,
        })
        blocks.append(breadcrumb([("Contact", url)]))

    elif p.startswith("for-"):
        nm = dict(AUDIENCE_PAGES).get(p, p.replace(".html", "").replace("-", " ").title())
        blocks.append({
            "@context": "https://schema.org", "@type": "ItemList",
            "name": nm, "url": url,
        })
        # NOTE: index.html no longer has an #audiences section, so the breadcrumb
        # goes straight Home -> page instead of pointing at a dead anchor.
        blocks.append(breadcrumb([(nm, url)]))

    if not blocks:
        return ""
    out = []
    for b in blocks:
        if "@context" not in b:
            b = dict(b, **{"@context": "https://schema.org"})
        out.append('<script type="application/ld+json">' + json.dumps(b, ensure_ascii=False) + "</script>")
    return "\n".join(out) + "\n"

pages = sorted([
    p.replace("\\", "/") for p in glob.glob("**/*.html", recursive=True)
    # 排除：备份目录、后台、以及构建产物（下划线开头的 html 片段，如 _article_list_snippet.html）
    if not p.replace("\\", "/").startswith(("_bak_legal/", "admin/"))
    and not os.path.basename(p).startswith("_")
])


def depth_prefix(p):
    """页面相对根目录的 ../ 前缀"""
    d = p.count("/")
    return "../" * d


def page_url(p):
    return "%s/%s" % (SITE_URL.rstrip("/"), p)


NAV_HEAD = """<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="{p}index.html"><span class="dot"></span>{SITE}<small>&nbsp;Real-Tested AI Writing</small></a>
<nav class="nav-links">
{links}
</nav>
{cta}
</div></header>"""


def build_nav(p, ah, at, ao, ac, ab):
    """导航栏。HIDE_TOOLS=True 时移除 'AI copywriting tools' 入口。
    CTA 固定指向 Blog（与首页一致，tools 隐藏后不再引导到工具页）。"""
    links = ['<a href="{p}index.html"{ah}>Home</a>'.format(p=p, ah=ah)]
    if not HIDE_TOOLS:
        links.append('<a href="{p}tools.html"{at}>AI copywriting tools</a>'.format(p=p, at=at))
    links += [
        '<a href="{p}for-office-workers.html"{ao}>Office workers</a>'.format(p=p, ao=ao),
        '<a href="{p}for-content-creators.html"{ac}>Content creators</a>'.format(p=p, ac=ac),
        '<a href="{p}blog/how-we-avoid-ai-hallucinations.html"{ab}>Blog</a>'.format(p=p, ab=ab),
    ]
    cta = '<a class="nav-cta" href="{p}blog/how-we-avoid-ai-hallucinations.html">View all blog posts →</a>'.format(p=p)
    return NAV_HEAD.format(p=p, SITE=SITE_NAME, links="\n".join(links), cta=cta)


FOOTER_TPL = """<footer class="footer"><div class="wrap">
<div>© 2026 {SITE} &mdash; real-tested reviews of AI copywriting tools.</div>
<div class="footer-links">
<a href="{p}index.html">Home</a>
{links}
<a href="{p}for-office-workers.html">Office workers</a>
<a href="{p}for-content-creators.html">Content creators</a>
<a href="{p}blog/how-we-avoid-ai-hallucinations.html">Blog</a>
</div>
<div class="footer-legal">
<a href="{p}privacy.html">Privacy Policy</a>
<a href="{p}terms.html">Terms of Service</a>
<a href="{p}contact.html">Contact</a>
</div>
</div></footer>"""


def build_footer(p):
    """页脚。HIDE_TOOLS=True 时移除 'AI copywriting tools' 入口链接。"""
    links = ""
    if not HIDE_TOOLS:
        links = '<a href="{p}tools.html">AI copywriting tools</a>\n'.format(p=p)
    return FOOTER_TPL.format(p=p, SITE=SITE_NAME, links=links)

HEAD_START = "<!--SEO:START-->"
HEAD_END = "<!--SEO:END-->"


def build_head(p, title, desc):
    url = page_url(p)
    ogtype = "article" if (p.startswith("blog/") or p.startswith("tools/")) else "website"
    og_img = "%s/ai-copywriting-tools-og.png" % SITE_URL.rstrip("/")
    if os.path.exists(os.path.join(BASE, "ai-copywriting-tools-og.png")):
        og_lines = (
            '<meta property="og:image" content="%s" />\n' % og_img
            + '<meta property="og:image:width" content="1200" />\n'
            + '<meta property="og:image:height" content="630" />\n'
            + '<meta name="twitter:image" content="%s" />\n' % og_img
            + '<meta name="twitter:card" content="summary_large_image" />\n'
        )
    else:
        og_lines = '<meta name="twitter:card" content="summary" />\n'

    return (
        HEAD_START + "\n"
        + '<link rel="preconnect" href="https://fonts.googleapis.com" />\n'
        + '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />\n'
        + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Outfit:wght@400;500;600;700&family=Space+Grotesk:wght@500;600;700&display=swap" />\n'
        + '<link rel="icon" type="image/svg+xml" href="%sfavicon.svg" />\n' % depth_prefix(p)
        + '<link rel="canonical" href="%s" />\n' % url
        + '<meta name="robots" content="%s" />\n' % ("noindex,follow" if (HIDE_TOOLS and (p == "tools.html" or p.startswith("tools/"))) else "index,follow")
        + '<meta property="og:type" content="%s" />\n' % ogtype
        + '<meta property="og:site_name" content="%s" />\n' % SITE_NAME
        + '<meta property="og:title" content="%s" />\n' % title
        + '<meta property="og:description" content="%s" />\n' % desc
        + '<meta property="og:url" content="%s" />\n' % url
        + og_lines
        + '<meta name="twitter:title" content="%s" />\n' % title
        + '<meta name="twitter:description" content="%s" />\n' % desc
        + build_jsonld(p)
        + '<script defer src="%sjs/gsap.min.js"></script>\n' % depth_prefix(p)
        + '<script defer src="%sjs/ScrollTrigger.min.js"></script>\n' % depth_prefix(p)
        + '<script defer src="%sjs/animations.js"></script>\n' % depth_prefix(p)
        + HEAD_END + "\n"
    )


def attr_escape(s):
    return s.replace("&", "&amp;").replace('"', "&quot;").replace("<", "&lt;").replace(">", "&gt;")


changed = []

for p in pages:
    src = open(p, encoding="utf-8").read()
    orig = src

    # 1. 取 title / description
    m_title = re.search(r"<title>(.*?)</title>", src, re.S)
    m_desc = re.search(r'name="description"\s+content="(.*?)"', src, re.S)
    if not m_title:
        print("!! 缺 title，跳过:", p)
        continue
    title = attr_escape(m_title.group(1).strip())
    desc = attr_escape(m_desc.group(1).strip()) if m_desc else title

    # 2. 移除旧的 SEO 块，重新注入（幂等）
    src = re.sub(re.escape(HEAD_START) + r".*?" + re.escape(HEAD_END) + r"\n?", "", src, flags=re.S)
    src = src.replace("</title>", "</title>\n" + build_head(p, title, desc), 1)

    # 3. 统一导航（含当前页高亮）
    prefix = depth_prefix(p)
    # Determine which nav link should be active based on page path
    ah = ' class="active"' if p == "index.html" else ""
    at = ' class="active"' if (p == "tools.html" or p.startswith("tools/")) else ""
    ao = ' class="active"' if p == "for-office-workers.html" else ""
    ac = ' class="active"' if p == "for-content-creators.html" else ""
    ab = ' class="active"' if p.startswith("blog/") else ""
    src = re.sub(
        r"<header class=\"nav\">.*?</header>",
        lambda m: build_nav(prefix, ah, at, ao, ac, ab),
        src, count=1, flags=re.S)
    # 博客聚合页不需要 CTA 按钮
    if "how-we-avoid-ai-hallucinations" in p:
        src = re.sub(r'\n?<a class="nav-cta"[^>]*>.*?</a>', '', src, count=1)

    # 4. 统一页脚
    src = re.sub(
        r"<footer class=\"footer\">.*?</footer>",
        lambda m: build_footer(prefix),
        src, count=1, flags=re.S)

    # 5. 面包屑里指向首页 #tools 的链接改成真实页面
    src = src.replace('href="../index.html#tools"', 'href="../tools.html"')
    src = src.replace('href="index.html#tools"', 'href="tools.html"')

    if src != orig:
        open(p, "w", encoding="utf-8", newline="\n").write(src)
        changed.append(p)

# ---------- sitemap.xml ----------
LAST_MODIFIED = os.environ.get("SITEMAP_LASTMOD") or time.strftime("%Y-%m-%d")

urls = []
for p in pages:
    if HIDE_TOOLS and (p == "tools.html" or p.startswith("tools/")):
        continue
    if p == "index.html":
        loc, pri = SITE_URL.rstrip("/") + "/", "1.0"
    elif p == "tools.html":
        loc, pri = page_url(p), "0.9"
    elif p in ("privacy.html", "terms.html", "contact.html"):
        # 法务 / 联系页不是流量页，权重压低，避免和正文页抢抓取预算
        loc, pri = page_url(p), "0.3"
    else:
        loc, pri = page_url(p), "0.7"
    urls.append(
        "  <url>\n    <loc>%s</loc>\n    <lastmod>%s</lastmod>\n    <changefreq>monthly</changefreq>\n    <priority>%s</priority>\n  </url>"
        % (loc, LAST_MODIFIED, pri))

sitemap = ('<?xml version="1.0" encoding="UTF-8"?>\n'
           '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
           + "\n".join(urls) + "\n</urlset>\n")
open("sitemap.xml", "w", encoding="utf-8", newline="\n").write(sitemap)

# ---------- robots.txt ----------
if HIDE_TOOLS:
    robots = ("User-agent: *\n"
              "Disallow: /tools.html\n"
              "Disallow: /tools/\n"
              "\n"
              "Sitemap: %s/sitemap.xml\n" % SITE_URL.rstrip("/"))
else:
    robots = ("User-agent: *\nAllow: /\n\nSitemap: %s/sitemap.xml\n" % SITE_URL.rstrip("/"))
open("robots.txt", "w", encoding="utf-8", newline="\n").write(robots)

print("页面处理: %d / 改写: %d" % (len(pages), len(changed)))
for c in changed:
    print("  updated", c)
print("生成 sitemap.xml (%d 条), robots.txt" % len(urls))

if SITE_URL == "https://example.com":
    print("\n!!! WARNING !!! SITE_URL 还是 example.com 占位！")
    print("上线前必须改 _seo.py 第 6 行为真实域名，然后重新跑 _build.py\n")
