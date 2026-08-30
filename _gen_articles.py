#!/usr/bin/env python3
# 文章系统生成器（幂等，可重复运行）
# 用法：python _gen_articles.py
#
# 从 articles.json 读取文章数据：
#   1. 生成 blog/articles/{slug}.html 详情页
#   2. 生成文章列表 HTML 片段（供人群页 / 首页注入）

import os
import json
import glob
import re

BASE = os.path.dirname(os.path.abspath(__file__))
SITE_URL = "https://aiwritereview.com"
SITE_NAME = "CopyTools"

DATA_FILE = os.path.join(BASE, "articles.json")
ARTICLE_DIR = os.path.join(BASE, "blog", "articles")

# ---- shared page shell (head + nav + footer) ----
PAGE_SHELL_HEAD = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{title} | {site}</title>
<!--SEO:START-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&display=swap" />
<link rel="icon" type="image/svg+xml" href="{prefix}favicon.svg" />
<link rel="canonical" href="{url}" />
<meta name="robots" content="index,follow" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="{site}" />
<meta property="og:title" content="{title}" />
<meta property="og:description" content="{desc}" />
<meta property="og:url" content="{url}" />
<meta property="og:image" content="{image}" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{title}" />
<meta name="twitter:description" content="{desc}" />
<meta name="twitter:image" content="{image}" />
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"Article","headline":{title_json},"url":{url_json},"datePublished":{date_json},"publisher":{{"@type":"Organization","name":{site_json}}}}</script>
<!--SEO:END-->
<link rel="stylesheet" href="{prefix}style.css" />
</head>
<body>
<nav class="nav"><div class="nav-inner wrap">
<a class="logo" href="{prefix}index.html"><span>Copy</span><span class="grad">Tools</span></a>
<div class="nav-links">
<a href="{prefix}index.html">Home</a>
<a href="{prefix}tools.html">AI copywriting tools</a>
<a href="{prefix}for-office-workers.html">Office workers</a>
<a href="{prefix}for-content-creators.html">Content creators</a>
<a href="{prefix}blog/how-we-avoid-ai-hallucinations.html">Method</a>
</div>
</div></nav>

<div class="page-head"><div class="wrap">
<h1>{title}</h1>
<p class="breadcrumb"><a href="{prefix}index.html">Home</a> / <a href="{prefix}blog/how-we-avoid-ai-hallucinations.html">Blog</a> / {title}</p>
</div></div>

<section class="section"><div class="wrap">
<div class="prose">
{content}
</div>
</div></section>

<footer class="footer"><div class="wrap">
<div>&copy; 2026 {site}, Real-tested AI copywriting reviews.</div>
<div class="footer-links">
<a href="{prefix}index.html">Home</a>
<a href="{prefix}tools.html">AI copywriting tools</a>
<a href="{prefix}for-office-workers.html">Office workers</a>
<a href="{prefix}for-content-creators.html">Content creators</a>
<a href="{prefix}blog/how-we-avoid-ai-hallucinations.html">Method</a>
</div>
<div class="footer-legal">
<a href="{prefix}privacy.html">Privacy Policy</a>
<a href="{prefix}terms.html">Terms of Service</a>
<a href="{prefix}contact.html">Contact</a>
</div>
</div></footer>

</body>
</html>"""


def prefix(rel):
    return "../" * rel.count("/")


def load_articles():
    with open(DATA_FILE, encoding="utf-8") as f:
        return json.load(f).get("articles", [])


def generate_detail(art, idx):
    """生成单篇文章详情页 HTML"""
    slug = art.get("slug", f"article-{idx}")
    title = art.get("title", "[Untitled]")
    excerpt = art.get("subtitle", "")
    content = art.get("content", "<p>[Content pending]</p>")
    date = art.get("date", "")
    image = art.get("image", f"{SITE_URL}/og.png")

    url = f"{SITE_URL}/blog/articles/{slug}.html"
    rel = f"blog/articles/{slug}.html"
    pfx = prefix(rel)

    html = PAGE_SHELL_HEAD.format(
        title=title,
        site=SITE_NAME,
        url=url,
        desc=excerpt,
        image=image,
        prefix=pfx,
        content=content,
        title_json=json.dumps(title),
        url_json=json.dumps(url),
        date_json=json.dumps(date),
        site_name=json.dumps(SITE_NAME),
    )

    out_dir = ARTICLE_DIR
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{slug}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote {rel}")


def generate_list_snippet(articles):
    """生成文章列表 HTML 片段（用于注入到人群页等）"""
    if not articles:
        return (
            '<!--ARTICLES:START-->\n'
            '<div class="article-list">\n'
            '<p style="color:var(--text-faint);padding:20px;text-align:center">No articles yet. Check back soon!</p>\n'
            '</div>\n'
            '<!--ARTICLES:END-->'
        )

    items = []
    for art in articles:
        slug = art.get("slug", f"article-{articles.index(art)}")
        title = art.get("title", "[Untitled]")
        excerpt = art.get("subtitle", "")
        date = art.get("date", "")
        img = art.get("image", "")

        items.append(
            f'<a class="article-row" href="blog/articles/{slug}.html">\n'
            f'  <img class="article-thumb" src="{img}" alt="" loading="lazy" />\n'
            f'  <div class="article-body">\n'
            f'    <h3 class="article-title">{title}</h3>\n'
            f'    <p class="article-excerpt">{excerpt}</p>\n'
            f'    <span class="article-date">{date}</span>\n'
            f'  </div>\n'
            f'</a>'
        )

    return (
        '<!--ARTICLES:START-->\n'
        '<div class="article-list">\n'
        + "\n".join(items) + "\n"
        '</div>\n'
        '<!--ARTICLES:END-->'
    )


def inject_into_audience_pages(snippet):
    """将文章列表注入到人群页（替换 RELATED 区域）"""
    import re
    audience_pages = [
        "for-office-workers.html",
        "for-content-creators.html",
    ]
    mark_start = "<!--RELATED:START-->"
    mark_end = "<!--RELATED:END-->"
    for page in audience_pages:
        path = os.path.join(BASE, page)
        if not os.path.exists(path):
            continue
        with open(path, encoding="utf-8") as f:
            html = f.read()
        # 幂等：先剔除旧文章块
        html = re.sub(
            r"\n?" + re.escape("<!--ARTICLES:START-->") + r".*?" + re.escape("<!--ARTICLES:END-->") + r"\n?",
            "\n", html, flags=re.S,
        )
        # 在 footer 前插入文章列表
        chunk = "\n" + snippet + "\n"
        if "<footer" in html:
            html = html.replace("<footer", chunk + "\n<footer", 1)
        elif "</body>" in html:
            html = html.replace("</body>", chunk + "\n</body>", 1)
        with open(path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"injected articles into {page}")


def main():
    articles = load_articles()

    # 1. 生成详情页
    for i, art in enumerate(articles):
        generate_detail(art, i)

    # 2. 生成列表片段
    snippet = generate_list_snippet(articles)
    snippet_path = os.path.join(BASE, "_article_list_snippet.html")
    with open(snippet_path, "w", encoding="utf-8") as f:
        f.write(snippet)

    # 3. 注入到人群页
    inject_into_audience_pages(snippet)

    print(f"\nDONE: {len(articles)} article pages generated")


if __name__ == "__main__":
    main()
