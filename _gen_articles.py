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
<script type="application/ld+json">__ARTICLE_JSONLD__</script>
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
<a href="{prefix}blog/how-we-avoid-ai-hallucinations.html">Blog</a>
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
<a href="{prefix}blog/how-we-avoid-ai-hallucinations.html">Blog</a>
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
    )
    # JSON-LD 用 replace 注入，避免 .format 花括号冲突
    jsonld = json.dumps({
        "@context": "https://schema.org",
        "@type": "Article",
        "headline": title,
        "url": url,
        "datePublished": date,
        "publisher": {"@type": "Organization", "name": SITE_NAME},
    }, ensure_ascii=False)
    html = html.replace("__ARTICLE_JSONLD__", jsonld)

    out_dir = ARTICLE_DIR
    os.makedirs(out_dir, exist_ok=True)
    out_path = os.path.join(out_dir, f"{slug}.html")
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(html)
    print(f"wrote {rel}")


def generate_list_snippet(articles, rel_prefix=""):
    """生成文章列表 HTML 片段（用于注入到人群页 / Blog页等）
    rel_prefix: 当前页面相对站点根的前缀，用于修正文章链接。
               根目录页用 ""，blog/ 下页用 "../"
    无论文章自带什么标签，这里都显示全部文章（聚合页逻辑）。
    """
    if not articles:
        return (
            '<!--ARTICLES:START-->\n'
            '<section class="section"><div class="wrap">\n'
            '<div class="article-list">\n'
            '<p style="color:var(--text-faint);padding:20px;text-align:center">No articles yet. Check back soon!</p>\n'
            '</div>\n'
            '</div></section>\n'
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
            f'<a class="article-row" href="{rel_prefix}blog/articles/{slug}.html">\n'
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
        '<section class="section"><div class="wrap">\n'
        '<div class="article-list">\n'
        + "\n".join(items) + "\n"
        '</div>\n'
        '</div></section>\n'
        '<!--ARTICLES:END-->'
    )


def inject_into_pages():
    """将文章列表注入到人群页 + Blog页（无论标签，全部显示）"""
    import re
    articles = load_articles()
    target_pages = [
        ("for-office-workers.html", ""),
        ("for-content-creators.html", ""),
        ("blog/how-we-avoid-ai-hallucinations.html", "../"),
    ]
    for page, rel_prefix in target_pages:
        snippet = generate_list_snippet(articles, rel_prefix)
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
        chunk = "\n" + snippet + "\n"
        # 博客聚合页：文章紧跟正文下方（prose section 之后）
        if "how-we-avoid-ai-hallucinations" in page:
            html = re.sub(
                r'(</div>\s*</div>\s*</section>)',
                r'\1' + chunk,
                html, count=1,
            )
        else:
            # 人群页：footer 前插入
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

    # 2. 生成根目录版列表片段（调试用）
    snippet = generate_list_snippet(articles)
    snippet_path = os.path.join(BASE, "_article_list_snippet.html")
    with open(snippet_path, "w", encoding="utf-8") as f:
        f.write(snippet)

    # 3. 注入到人群页 + Blog页（按页面深度修正链接）
    inject_into_pages()

    print(f"\nDONE: {len(articles)} article pages generated")


if __name__ == "__main__":
    main()
