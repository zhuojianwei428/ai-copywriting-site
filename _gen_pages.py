#!/usr/bin/env python3
# 生成站1兄弟词内页（承接主词 ai copywriting tools）
# 每个页面对应一个"人群x场景"目录，符合用户要求：按人群分、清晰、痛点钩子
import os
from _config import HIDE_TOOLS

BASE = os.path.dirname(os.path.abspath(__file__))

PAGES = {
    "for-content-creators.html": {
        "tag": "For Content Creators",
        "title": "Best AI Copywriting Tools for Content Creators | CopyTools",
        "desc": "Best AI copywriting tools for content creators, tested on real publishing work: blog intros, newsletters, scripts. Graded on: does it still sound like you?",
        "h1": "AI copywriting tools for content creators — and the methods we actually found useful (from real-work testing)",
        "sub": "Bloggers, newsletter writers, and YouTube scriptwriters — you publish constantly, and your voice is the product. We test AI copywriting tools for content creators on real publishing work. Below are the tools and workflows we use to scale our own output, the ones that genuinely held up. Steal anything that helps.",
        "intro": "",
        "tools": [],
        "verdict": "",
    },
    "for-self-media.html": {
        "tag": "For Social Media Creators",
        "title": "Best AI Copywriting Tools for Social Media | CopyTools",
        "desc": "Best AI copywriting tools for social media creators, tested on Xiaohongshu notes, Douyin scripts, and TikTok captions. One test: would you stop scrolling?",
        "h1": "Best AI Copywriting Tools for Social Media Creators (Xiaohongshu, Douyin, TikTok, WeChat)",
        "sub": "Hooks, captions, and scripts that don't sound like a bot wrote them. We tested the tools on the exact formats social media creators post every day.",
        "intro": "Social media lives and dies on the first 2 seconds. A hook that sounds generated gets scrolled past. We gave each tool a Xiaohongshu note, a Douyin script, and a TikTok caption, then judged: would a real user stop scrolling?",
        "tools": [
            ("Copy.ai", "score-a", "Best hook batch", "10 hook variants in one shot. Pick, tweak, post. Built for this.", ["hooks", "captions"]),
            ("Claude", "score-b", "Best script structure", "Longer video scripts with real pacing. You'll need to add your own voice.", ["scripts", "structure"]),
            ("Jasper", "score-b", "Best brand voice", "Keep one tone across platforms. Pricey for solo operators.", ["brand", "teams"]),
            ("Rytr", "score-b", "Best budget", "Cheap short captions. A good place to start.", ["$9/mo", "beginner"]),
            ("Writesonic", "score-b", "Fast variations", "A/B variants fast; quality uneven.", ["A/B", "volume"]),
            ("ChatGPT", "score-b", "Flexible fallback", "With a good prompt, it does most things. Without one, it sounds like generic ChatGPT.", ["prompt-dependent"]),
        ],
        "verdict": "Start with Copy.ai for hooks + Claude for scripts. Never post raw output — add one real sentence of your own.",
    },
    "for-office-workers.html": {
        "tag": "For Office Workers",
        "title": "Best AI Copywriting Tools for Office Workers | CopyTools",
        "desc": "Best AI copywriting tools for office workers, tested on weekly reports, emails, and slides. Graded on clear output that never invents accomplishments.",
        "h1": "AI copywriting tools we picked for office workers (weekly reports, emails, slides)",
        "sub": "We test AI copywriting tools for office workers on the work you actually do — weekly reports, emails, and slides. If a report came back from your boss covered in red, or your slides just looked off, you're in the right place. We try every tool ourselves and show what each one is really like to use: how to get started, what it costs, how it compares with the others, what it pairs well with, and who it's best for. You pick one without signing up for all of them.",
        "intro": "",
        "tools": [],
        "verdict": "",
    },
    "for-beginners.html": {
        "tag": "For Beginners",
        "title": "Best AI Copywriting Tools for Beginners | CopyTools",
        "desc": "Best AI copywriting tools for beginners, tested by onboarding a first-timer. Ranked by learning curve and price, no jargon, usable output in five minutes.",
        "h1": "Best AI Copywriting Tools for Beginners (Start Without the Overwhelm)",
        "sub": "Never used an AI writer? These are the easiest, cheapest, least intimidating tools to start with. We ranked them after walking a first-timer through each one.",
        "intro": "Most 'best AI writer' lists assume you already know the jargon. You don't. We picked tools a total beginner can open and get something usable out of in five minutes, then ranked them by learning curve and price.",
        "tools": [
            ("ChatGPT", "score-a", "Best to learn on", "Free tier, plain-English prompts, infinite tries. The training wheels everyone starts on.", ["free-tier", "flexible"]),
            ("Rytr", "score-b", "Best cheap start", "$9/mo, simple templates, no config. Good first 'real' tool.", ["$9/mo", "templates"]),
            ("Hemingway Editor", "score-b", "Best teacher", "Shows you why your writing is muddy, so you improve as a writer — not just the text.", ["edit", "learn"]),
            ("GrammarlyGO", "score-b", "Least scary", "Lives where you already write. One click, no new app.", ["email", "familiar"]),
            ("Copy.ai", "score-b", "Best guided", "Walkthrough templates for common jobs.", ["guided", "captions"]),
            ("Notion AI", "score-b", "Best for note-takers", "You already take notes; AI just helps.", ["notes", "workflow"]),
        ],
        "verdict": "Open ChatGPT (free), paste a real task, read the output, then run it through Hemingway. That's the whole job, and you'll have it down in an afternoon.",
    },
}

TPL = """<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{TITLE}</title>
<meta name="description" content="{DESC}" />
<link rel="stylesheet" href="style.css" />
</head>
<body>
<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="index.html"><span class="dot"></span>CopyTools<small>&nbsp;Real-Tested AI Writing</small></a>
<nav class="nav-links"><a href="index.html">Home</a><a href="tools.html">AI copywriting tools</a><a href="for-office-workers.html"{NAV_OFFICE}>Office workers</a><a href="for-content-creators.html"{NAV_CONTENT}>Content creators</a><a href="blog/how-we-avoid-ai-hallucinations.html">Blog</a></nav>
<a class="nav-cta" href="blog/how-we-avoid-ai-hallucinations.html">View all blog posts →</a>
</div></header>

<section class="page-head"><div class="wrap">
<div class="breadcrumb"><a href="index.html">Home</a> / {TAG}</div>
<span class="tag">{TAG}</span>
<h1>{H1}</h1>
<p>{SUB}</p>
</div></section>

<section class="section"><div class="wrap">
{INTRO_BLOCK}
{TOOL_SECTION}
</div></section>

<footer class="footer"><div class="wrap">
<div>© 2026 CopyTools, Real-tested AI copywriting reviews.</div>
<div><a href="index.html">Home</a> · <a href="tools.html">AI copywriting tools</a> · <a href="index.html#method">Method</a></div>
</div></footer>
</body>
</html>
"""

if HIDE_TOOLS:
    TPL = TPL.replace('<a href="index.html">Home</a><a href="tools.html">AI copywriting tools</a>', '<a href="index.html">Home</a>')
    TPL = TPL.replace('<a href="index.html">Home</a> · <a href="tools.html">AI copywriting tools</a> · <a href="index.html#method">Method</a>', '<a href="index.html">Home</a> · <a href="index.html#method">Method</a>')

for fname, d in PAGES.items():
    cards = ""
    for name, sc, label, desc, tags in d["tools"]:
        tag_html = "".join(f'<span class="tagchip">{t}</span>' for t in tags)
        cards += f'''      <div class="tool">
        <div class="tool-top"><span class="tool-name">{name}</span><span class="tool-score {sc}">{label}</span></div>
        <p>{desc}</p>
        <div class="tags">{tag_html}</div>
      </div>
'''
    # title / desc: keyword-front and length-capped (title <= 60, desc <= 160),
    # h1 stays long-form for the page itself.
    title = d.get("title") or d["h1"]
    desc = d.get("desc") or d["sub"]
    # Build intro block only if intro exists
    intro_block = f'''<div class="prose" style="max-width:1080px">
<p>{d["intro"]}</p>
</div>''' if d.get("intro") else ""

    # Build tool section only if tools exist AND not hidden
    if d["tools"] and not HIDE_TOOLS:
        tool_section = f'''<div class="tools" style="margin-top:28px">
{cards}
</div>
<div class="method" style="margin-top:34px">
<h2>Our verdict on the best AI copywriting tools</h2>
<p style="color:var(--text-dim)">{d["verdict"]}</p>
</div>
<p style="color:var(--text-faint);font-size:14px;margin-top:26px">Back to <a href="index.html" style="color:var(--accent)">all tested tools &rarr;</a></p>'''
    else:
        tool_section = ''

    # Nav active state: highlight the current page link
    nav_office = ' class="active"' if fname == "for-office-workers.html" else ""
    nav_content = ' class="active"' if fname == "for-content-creators.html" else ""

    html = TPL.format(TITLE=title, DESC=desc, TAG=d["tag"], H1=d["h1"], SUB=d["sub"],
                      INTRO_BLOCK=intro_block, TOOL_SECTION=tool_section,
                      NAV_OFFICE=nav_office, NAV_CONTENT=nav_content)
    with open(os.path.join(BASE, fname), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", fname)
print("DONE")
