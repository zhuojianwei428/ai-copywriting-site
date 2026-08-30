#!/usr/bin/env python3
# 生成 11 个工具独立内页 tools/xxx.html（数据驱动版）
# 数据源：tools-data.json
# 栏目：use_case / download / how_to_use / price / comparison / combinations / who_for
import os, json, datetime

BASE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(BASE, "tools")
DATA_PATH = os.path.join(BASE, "tools-data.json")
os.makedirs(OUT, exist_ok=True)


def esc(s):
    """HTML escape for safe insertion"""
    if not s:
        return ""
    return (s.replace("&", "&amp;").replace('"', "&quot;")
            .replace("<", "&lt;").replace(">", "&gt;"))


def render_section(title, content, section_id="", css_class=""):
    """渲染一个内容板块。content 为空时显示占位提示"""
    if not content or not content.strip():
        placeholder = (
            '<p class="empty-hint">'
            f'[Content pending: {esc(title)}] '
            'Edit in admin panel or tools-data.json to add content here.'
            '</p>'
        )
    else:
        # 支持简单 HTML（<p>、<ul><li>、<strong>、<em>、<a>、<br>）
        placeholder = f'<div class="prose">{content}</div>'

    extra = f' id="{section_id}"' if section_id else ""
    extra_css = f' {css_class}' if css_class else ""
    return f'''<div class="tool-section"{extra}{extra_css}>
    <h2>{esc(title)}</h2>
    {placeholder}
</div>'''


# 内链矩阵：每个工具页指向对比工具
CMP = {
    "claude.html": ["chatgpt.html", "jasper.html", "lex.html", "sudowrite.html"],
    "sudowrite.html": ["claude.html", "jasper.html", "chatgpt.html", "copyai.html"],
    "hemingway.html": ["grammarlygo.html", "claude.html", "chatgpt.html", "lex.html"],
    "lex.html": ["notion-ai.html", "claude.html", "chatgpt.html", "hemingway.html"],
    "copyai.html": ["writesonic.html", "jasper.html", "rytr.html", "chatgpt.html"],
    "jasper.html": ["copyai.html", "writesonic.html", "rytr.html", "claude.html"],
    "rytr.html": ["copyai.html", "writesonic.html", "chatgpt.html", "jasper.html"],
    "writesonic.html": ["jasper.html", "copyai.html", "rytr.html", "chatgpt.html"],
    "chatgpt.html": ["claude.html", "notion-ai.html", "grammarlygo.html", "copyai.html"],
    "notion-ai.html": ["lex.html", "grammarlygo.html", "chatgpt.html", "claude.html"],
    "grammarlygo.html": ["hemingway.html", "notion-ai.html", "chatgpt.html", "claude.html"],
}

# 工具名映射（slug → name），用于生成对比链接
SLUG_TO_NAME = {}
for slug_file in CMP.keys():
    pass  # will be populated from JSON data

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{NAME} Review: Tested AI Copywriting Tools | CopyTools</title>
<!--SEO:START-->
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400..900&display=swap" />
<link rel="icon" type="image/svg+xml" href="../favicon.svg" />
<link rel="canonical" href="{SITE_URL}/tools/{SLUG}" />
<meta name="robots" content="index,follow" />
<meta property="og:type" content="article" />
<meta property="og:site_name" content="CopyTools" />
<meta property="og:title" content="{NAME} Review: Tested AI Copywriting Tools | CopyTools" />
<meta property="og:description" content="{DESC}" />
<meta property="og:url" content="{SITE_URL}/tools/{SLUG}" />
<meta property="og:image" content="{SITE_URL}/ai-copywriting-tools-og.png" />
<meta property="og:image:width" content="1200" />
<meta property="og:image:height" content="630" />
<meta name="twitter:image" content="{SITE_URL}/ai-copywriting-tools-og.png" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="{NAME} Review: Tested AI Copywriting Tools | CopyTools" />
<meta name="twitter:description" content="{DESC}" />
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"SoftwareApplication","name":"{NAME}","applicationCategory":"BusinessApplication","operatingSystem":"Web","url":"{SITE_URL}/tools/{SLUG}"}}</script>
<script type="application/ld+json">{{"@type":"BreadcrumbList","itemListElement":[{{"@type":"ListItem","position":1,"name":"Home","item":"{SITE_URL}/"}},{{"@type":"ListItem","position":2,"name":"Tested tools","item":"{SITE_URL}/tools.html"}},{{"@type":"ListItem","position":3,"name":"{NAME}","item":"{SITE_URL}/tools/{SLUG}"}}],"@context":"https://schema.org"}}</script>
<!--SEO:END-->
<meta name="description" content="{DESC}" />
<link rel="stylesheet" href="../style.css" />
</head>
<body>
<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="../index.html"><span class="dot"></span>CopyTools<small>&nbsp;Real-Tested AI Writing</small></a>
<nav class="nav-links">
<a href="../index.html">Home</a>
<a href="../tools.html" class="active">AI copywriting tools</a>
<a href="../for-office-workers.html">Office workers</a>
<a href="../for-content-creators.html">Content creators</a>
<a href="../blog/how-we-avoid-ai-hallucinations.html">Blog</a>
</nav>
<a class="nav-cta" href="../tools.html">See the picks &rarr;</a>
</div></header>

<section class="page-head"><div class="wrap">
<div class="breadcrumb"><a href="../index.html">Home</a> / <a href="../tools.html">Tested tools</a> / {NAME}</div>
<span class="tag">Real-test review</span>
<h1>{NAME} Review: One of the AI Copywriting Tools We Tested</h1>
<div style="margin-top:18px"><span class="tool-score {SCORE_CLASS}" style="font-size:14px">{SCORE}</span></div>
</div></section>

<section class="section"><div class="wrap">

{SECTION_USE_CASE}
{SECTION_DOWNLOAD}
{SECTION_HOW_TO_USE}
{SECTION_PRICE}
{SECTION_COMPARISON}
{SECTION_COMBINATIONS}
{SECTION_WHO_FOR}

<p style="color:var(--text-faint);font-size:14px;margin-top:32px">
Back to <a href="../tools.html" style="color:var(--accent)">all tested tools &rarr;</a>
<br><small style="margin-top:4px;display:inline-block">
Every review on this site follows
<a href="../blog/how-we-avoid-ai-hallucinations.html" style="color:var(--accent)">our fact-checking method</a>.
</small>
</p>
</div></section>

<footer class="footer"><div class="wrap">
<div>&copy; 2026 CopyTools, Real-tested AI copywriting reviews.</div>
<div class="footer-links">
<a href="../index.html">Home</a>
<a href="../tools.html">AI copywriting tools</a>
<a href="../for-office-workers.html">Office workers</a>
<a href="../for-content-creators.html">Content creators</a>
<a href="../blog/how-we-avoid-ai-hallucinations.html">Blog</a>
</div>
<div class="footer-legal">
<a href="../privacy.html">Privacy Policy</a>
<a href="../terms.html">Terms of Service</a>
<a href="../contact.html">Contact</a>
</div>
</div></footer>
</body>
</html>"""


def make_desc(name):
    """Meta description with keyword"""
    return (
        f"{name} is one of the AI copywriting tools we tested on real writing tasks. "
        f"See real use cases, pricing, how it compares, and who should use it."
    )


def main():
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)

    tools = data.get("tools", [])
    site_url = data.get("_meta", {}).get("site_url", "https://example.com")

    # Build slug → name mapping
    slug_map = {}
    for t in tools:
        slug_map[t["slug"]] = t["name"]

    count = 0
    for t in tools:
        name = t["name"]
        slug = t["slug"]
        score_class = t.get("score_class", "score-b")
        score = t.get("score", "")

        html = TPL.format(
            NAME=esc(name),
            SLUG=slug.replace(".html", ""),
            SITE_URL=site_url,
            DESC=make_desc(name),
            SCORE_CLASS=score_class,
            SCORE=esc(score),
            SECTION_USE_CASE=render_section(
                "Real use case", t.get("use_case", ""), "sec-use-case"
            ),
            SECTION_DOWNLOAD=render_section(
                "How to download & install", t.get("download", ""), "sec-download"
            ),
            SECTION_HOW_TO_USE=render_section(
                "How to use it", t.get("how_to_use", ""), "sec-how-to-use"
            ),
            SECTION_PRICE=render_section(
                "Pricing", t.get("price", ""), "sec-price"
            ),
            SECTION_COMPARISON=render_section(
                "How it compares with other tools", t.get("comparison", ""), "sec-comparison"
            ),
            SECTION_COMBINATIONS=render_section(
                "Tool combinations that work well together", t.get("combinations", ""), "sec-combinations"
            ),
            SECTION_WHO_FOR=render_section(
                "Who should use this tool", t.get("who_for", ""), "sec-who-for"
            ),
        )

        out_path = os.path.join(OUT, slug)
        with open(out_path, "w", encoding="utf-8") as f:
            f.write(html)
        print(f"wrote {slug}")
        count += 1

    # Update last_updated timestamp
    data["_meta"]["last_updated"] = datetime.datetime.now().isoformat()
    with open(DATA_PATH, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"DONE: {count} tool pages generated from tools-data.json")


if __name__ == "__main__":
    main()
