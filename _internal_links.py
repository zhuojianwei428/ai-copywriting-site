#!/usr/bin/env python3
# 全站内链网络注入（幂等，可重复运行）
# 用法：python _internal_links.py
#
# 只做一件事：把 18 个页面互相串起来，让权重能在站内流动。
#   - 工具详情页 → 对比工具 + 适合的人群页 + 汇总页
#   - 人群落地页 → 其他人群页 + 单工具深挖
#   - tools.html → 人群页入口
#   - 博客页   → 汇总页 + 人群页
#
# 不碰导航 / 页脚 / SEO 标签（那部分归 _seo.py 管）。
# 重跑 _gen_pages.py / _gen_tools.py 之后，本脚本要再跑一次。

import os
import re
import glob
from _config import HIDE_TOOLS, prefix

BASE = os.path.dirname(os.path.abspath(__file__))
MARK_START = "<!--RELATED:START-->"
MARK_END = "<!--RELATED:END-->"

TOOL_LABEL = {
    "claude": "Claude", "chatgpt": "ChatGPT", "jasper": "Jasper", "copyai": "Copy.ai",
    "writesonic": "Writesonic", "rytr": "Rytr", "sudowrite": "Sudowrite",
    "lex": "Lex.page", "notion-ai": "Notion AI", "grammarlygo": "GrammarlyGO",
    "hemingway": "Hemingway Editor",
}

TOOL_BLURB = {
    "claude": "Most human long-form and rewrite passes in the whole test.",
    "chatgpt": "The flexible baseline every other tool gets compared against.",
    "jasper": "Templates and brand voice, built for content teams.",
    "copyai": "Fast hook and ad variants, shallow once you go long-form.",
    "writesonic": "Speedy SEO drafts. Verify every stat before you publish.",
    "rytr": "$9/mo budget pick, fine for short copy only.",
    "sudowrite": "Trained on fiction. Unmatched for story, wrong for reports.",
    "lex": "AI lives in the document, so there's nothing to copy and paste.",
    "notion-ai": "Write in Notion and it cleans up as you go.",
    "grammarlygo": "One-click tone fixes wherever you already write.",
    "hemingway": "Strips the robot voice out of any draft, instantly.",
}

# 每个工具详情页推荐哪几个同类工具
TOOL_PEERS = {
    "claude": ["chatgpt", "lex", "jasper"],
    "chatgpt": ["claude", "rytr", "copyai"],
    "jasper": ["copyai", "writesonic", "claude"],
    "copyai": ["jasper", "rytr", "writesonic"],
    "writesonic": ["jasper", "copyai", "rytr"],
    "rytr": ["copyai", "chatgpt", "grammarlygo"],
    "sudowrite": ["claude", "lex", "jasper"],
    "lex": ["claude", "notion-ai", "sudowrite"],
    "notion-ai": ["lex", "grammarlygo", "chatgpt"],
    "grammarlygo": ["notion-ai", "hemingway", "rytr"],
    "hemingway": ["grammarlygo", "claude", "chatgpt"],
}

# 每个工具详情页推荐哪几个人群页
TOOL_AUDIENCES = {
    "claude": ["for-office-workers", "for-content-creators"],
    "chatgpt": ["for-office-workers", "for-content-creators"],
    "jasper": ["for-content-creators", "for-office-workers"],
    "copyai": ["for-content-creators", "for-office-workers"],
    "writesonic": ["for-content-creators", "for-office-workers"],
    "rytr": ["for-office-workers", "for-content-creators"],
    "sudowrite": ["for-content-creators"],
    "lex": ["for-content-creators", "for-office-workers"],
    "notion-ai": ["for-office-workers", "for-content-creators"],
    "grammarlygo": ["for-office-workers", "for-content-creators"],
    "hemingway": ["for-office-workers", "for-content-creators"],
}

AUDIENCE = {
    "for-office-workers": ("Office workers", "Weekly reports, emails, and slides — without making things up."),
    "for-content-creators": ("Content creators", "Blog posts and newsletters that still sound like you."),
}

METHOD_PAGE = "blog/how-we-avoid-ai-hallucinations.html"


def block(title, cards, h, cta=None):
    html = (
        '\n<section class="section alt"><div class="wrap">\n'
        '<span class="tag">Keep reading</span>\n'
        '<h2 class="sec-title">{t}</h2>\n'
        '<div class="tools" style="margin-top:24px">\n{c}</div>\n'
    ).format(t=title, c=cards)
    if cta:
        html += '<div class="hero-actions" style="margin-top:26px">{c}</div>\n'.format(c=cta)
    html += "</div></section>\n"
    return html


def tool_card(h, slug):
    return (
        '<a class="tool" href="{h}tools/{s}.html"><div class="tool-top">'
        '<span class="tool-name">{n}</span></div><p>{b}</p></a>\n'
    ).format(h=h, s=slug, n=TOOL_LABEL[slug], b=TOOL_BLURB[slug])


def audience_card(h, slug):
    name, blurb = AUDIENCE[slug]
    return (
        '<a class="tool" href="{h}{s}.html"><div class="tool-top">'
        '<span class="tool-name">{n}</span></div><p>{b}</p></a>\n'
    ).format(h=h, s=slug, n=name, b=blurb)


def build(rel):
    h = prefix(rel)
    norm = rel.replace("\\", "/")
    parts = []

    if norm.startswith("tools/") and norm.endswith(".html"):
        slug = os.path.splitext(os.path.basename(norm))[0]
        if slug not in TOOL_PEERS:
            return ""
        # HIDE_TOOLS: 工具页之间的互链 + 回 tools.html 的入口一并隐藏
        if not HIDE_TOOLS:
            peers = "".join(tool_card(h, s) for s in TOOL_PEERS[slug])
            parts.append(block("Compare with these tools", peers, h))
            cta = (
                '<a class="btn-primary" href="{h}tools.html">All 11 tested tools &rarr;</a>'
            ).format(h=h)
            parts.append(block("Still deciding?", "", h, cta=cta).replace(
                '<div class="tools" style="margin-top:24px">\n</div>\n', ""))
        auds = "".join(audience_card(h, s) for s in TOOL_AUDIENCES[slug])
        parts.append(block("Who it's best for", auds, h))

    elif norm.startswith("for-") and norm.endswith(".html"):
        slug = os.path.splitext(os.path.basename(norm))[0]
        others = "".join(
            audience_card(h, s) for s in AUDIENCE if s != slug
        )
        parts.append(block("Other audiences", others, h))
        # HIDE_TOOLS: 不引导到工具详情页
        if not HIDE_TOOLS:
            picks = "".join(tool_card(h, s) for s in ["claude", "chatgpt", "copyai", "hemingway"])
            parts.append(block("Dive into a single tool", picks, h))

    elif norm == "tools.html":
        auds = "".join(audience_card(h, s) for s in AUDIENCE)
        parts.append(block("Not sure where to start? Pick AI copywriting tools that fit how you work", auds, h))

    elif norm.startswith("blog/"):
        # HIDE_TOOLS: 博客页不再展示指向 tools/ 的工具网格
        if not HIDE_TOOLS:
            picks = "".join(tool_card(h, s) for s in ["claude", "chatgpt", "hemingway", "copyai"])
            parts.append(block("The tools we tested", picks, h))
        auds = "".join(audience_card(h, s) for s in AUDIENCE)
        parts.append(block("Pick by audience", auds, h))

    return "".join(parts)


def process(rel):
    path = os.path.join(BASE, rel)
    html = open(path, encoding="utf-8").read()

    # 生成脚本自带内链的页面（tools/*.html 里有 "Compare it with"），不重复注入
    if "Compare it with" in html:
        return False

    # 幂等：先剔除旧的内链块
    html = re.sub(
        r"\n?" + re.escape(MARK_START) + r".*?" + re.escape(MARK_END) + r"\n?",
        "\n", html, flags=re.S,
    )
    body = build(rel)
    if not body:
        return False

    chunk = "\n" + MARK_START + body + MARK_END + "\n"
    if "<footer" in html:
        html = html.replace("<footer", chunk + "\n<footer", 1)
    else:
        html = html.replace("</body>", chunk + "\n</body>", 1)

    open(path, "w", encoding="utf-8").write(html)
    return True


def main():
    pages = sorted(
        os.path.relpath(p, BASE).replace("\\", "/")
        for p in glob.glob(os.path.join(BASE, "**", "*.html"), recursive=True)
    )
    n = 0
    for rel in pages:
        if process(rel):
            n += 1
            print("linked", rel)
    print("\nDONE: {} / {} pages got internal links".format(n, len(pages)))


if __name__ == "__main__":
    main()
