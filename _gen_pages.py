#!/usr/bin/env python3
# 生成站1兄弟词内页（承接主词 ai copywriting tools）
# 每个页面对应一个"人群x场景"目录，符合用户要求：按人群分、清晰、痛点钩子
import os

BASE = os.path.dirname(os.path.abspath(__file__))

PAGES = {
    "for-content-creators.html": {
        "tag": "For Content Creators",
        "title": "Best AI Copywriting Tools for Content Creators | CopyTools",
        "desc": "Best AI copywriting tools for content creators, tested on real publishing work: blog intros, newsletters, scripts. Graded on: does it still sound like you?",
        "h1": "Best AI Copywriting Tools for Content Creators (Tested on Real Publishing Work)",
        "sub": "Bloggers, newsletter writers, and YouTube scriptwriters, you publish constantly and your voice is the product. These are the tools we actually used to scale output without sounding like a template.",
        "intro": "As a content creator, your problem isn't 'no draft'. It's 'a draft that sounds like everyone else'. We ran 6 tools through a real publishing week: a blog intro, a newsletter lead, a YouTube script outline, and a rewrite-to-human pass. Here's what held up.",
        "tools": [
            ("Claude", "score-a", "Best for long-form voice", "Kept the nuance in a 1,500-word post better than any dedicated tool. You edit, it doesn't flatten you.", ["long-form", "voice", "nuance"]),
            ("Lex.page", "score-b", "Best doc-first workflow", "AI lives in the document, no ChatGPT→Docs copy-paste tax. Serial publishers feel this immediately.", ["docs", "no-paste-loop"]),
            ("Sudowrite", "score-a", "Best for narrative", "When the piece is a story, not a list, it's unmatched. Skip for newsletters.", ["fiction", "story"]),
            ("Writesonic", "score-b", "Best SEO drafts", "Fast SEO articles; fact-check every stat before publish.", ["SEO", "volume"]),
            ("Copy.ai", "score-b", "Best hook variants", "Great first line for a newsletter; shallow on body.", ["hooks", "captions"]),
            ("Hemingway Editor", "score-b", "Best de-fluffer", "Run any AI draft through it. Kills the 'AI smell' instantly.", ["edit", "$10/mo"]),
        ],
        "verdict": "If you publish daily: Claude (write) + Hemingway (clean) + Lex (stay in docs). That trio beats any single 'all-in-one'.",
    },
    "for-self-media.html": {
        "tag": "For Self-Media Operators",
        "title": "Best AI Copywriting Tools for Self-Media | CopyTools",
        "desc": "Best AI copywriting tools for self-media, tested on Xiaohongshu notes, Douyin scripts, and TikTok captions. One test: would a real person stop scrolling?",
        "h1": "Best AI Copywriting Tools for Self-Media (Xiaohongshu, Douyin, TikTok, WeChat)",
        "sub": "Hooks, captions, and scripts that don't read like an ad bot. We tested tools on the exact formats self-media operators post every day.",
        "intro": "Self-media lives and dies on the first 2 seconds. A hook that sounds generated gets scrolled past. We gave each tool a Xiaohongshu note, a Douyin script, and a TikTok caption, then judged: would a real user stop scrolling?",
        "tools": [
            ("Copy.ai", "score-a", "Best hook batch", "10 hook variants in one shot. Pick, tweak, post. Built for this.", ["hooks", "captions"]),
            ("Claude", "score-b", "Best script structure", "Longer video scripts with actual pacing. Needs your voice added.", ["scripts", "structure"]),
            ("Jasper", "score-b", "Best brand voice", "Keep one tone across platforms. Pricey for solo operators.", ["brand", "teams"]),
            ("Rytr", "score-b", "Best budget", "$9/mo short captions. Fine to start.", ["$9/mo", "beginner"]),
            ("Writesonic", "score-b", "Fast variations", "A/B variants fast; quality uneven.", ["A/B", "volume"]),
            ("ChatGPT", "score-b", "Flexible fallback", "With a good prompt, does most things. Sounds like ChatGPT without one.", ["prompt-dependent"]),
        ],
        "verdict": "Start with Copy.ai for hooks + Claude for scripts. Never post raw output, add one real sentence of your own.",
    },
    "for-office-workers.html": {
        "tag": "For Office Workers",
        "title": "Best AI Copywriting Tools for Office Workers | CopyTools",
        "desc": "Best AI copywriting tools for office workers, tested on weekly reports, emails, and slides. Graded on clear output that never invents accomplishments.",
        "h1": "AI copywriting tools we picked for office workers (weekly reports, emails, slides)",
        "sub": "Your AI-written weekly report got rejected by your boss, or the slides just look off? Don't worry — I'll test every AI tool for you, and show each one's real use cases, exactly how to download and use it, what it costs, how it compares with other tools, which tools it pairs with, and who it's best for. We lay it all out so you never have to download and try every tool yourself.",
        "intro": "The Friday report. The follow-up email. The slide bullets. You're not a 'writer', you just need the real work to land. The danger: tools that polish your facts into fluff or fabricate wins. We tested for factual, clear output.",
        "tools": [
            ("Claude", "score-a", "Best report draft", "Give it your bullet notes, get a clean report that keeps your facts. Best 'human pass' too.", ["reports", "factual"]),
            ("Notion AI", "score-b", "Best in-doc", "Write the report in Notion, AI cleans as you go. No app-switch.", ["docs", "workflow"]),
            ("GrammarlyGO", "score-b", "Best email replies", "One-click tone fixes in your inbox. Stays grounded.", ["email", "tone"]),
            ("Microsoft Copilot", "score-b", "Best in Office", "If your company is on 365, it's already there.", ["365", "slides"]),
            ("Hemingway Editor", "score-b", "Best de-fluffer", "Strip the corporate bloat from any draft.", ["clarity", "$10/mo"]),
            ("ChatGPT", "score-b", "Flexible", "Great with a fact-list prompt. Verify it didn't add wins you didn't do.", ["prompt-dependent"]),
        ],
        "verdict": "Claude for the draft + Hemingway for the clean. Never let it invent metrics, paste your real numbers in.",
    },
    "for-beginners.html": {
        "tag": "For Beginners",
        "title": "Best AI Copywriting Tools for Beginners | CopyTools",
        "desc": "Best AI copywriting tools for beginners, tested by onboarding a first-timer. Ranked by learning curve and price, no jargon, usable output in five minutes.",
        "h1": "Best AI Copywriting Tools for Beginners (Start Without the Overwhelm)",
        "sub": "Never used an AI writer? These are the easiest, cheapest, least-intimidating tools to learn the craft, tested by actually onboarding a first-timer.",
        "intro": "Most 'best AI writer' lists assume you already know the jargon. You don't. We picked tools a total beginner can open and get something usable from in 5 minutes, then ranked by learning curve and price.",
        "tools": [
            ("ChatGPT", "score-a", "Best to learn on", "Free tier, plain-English prompts, infinite tries. The training wheels everyone starts on.", ["free-tier", "flexible"]),
            ("Rytr", "score-b", "Best cheap start", "$9/mo, simple templates, no config. Good first 'real' tool.", ["$9/mo", "templates"]),
            ("Hemingway Editor", "score-b", "Best teacher", "Shows why your writing is muddy. You get better, not just the text.", ["edit", "learn"]),
            ("GrammarlyGO", "score-b", "Least scary", "Lives where you already write. One click, no new app.", ["email", "familiar"]),
            ("Copy.ai", "score-b", "Best guided", "Walkthrough templates for common jobs.", ["guided", "captions"]),
            ("Notion AI", "score-b", "Best if note-taking", "You already take notes; AI just helps.", ["notes", "workflow"]),
        ],
        "verdict": "Open ChatGPT (free), paste a real task, read the output, then run it through Hemingway. That's the whole craft in an afternoon.",
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
<nav class="nav-links"><a href="tools.html">Tested tools</a><a href="for-office-workers.html">Office workers</a><a href="index.html#method">How we test</a></nav>
<a class="nav-cta" href="tools.html">See the picks →</a>
</div></header>

<section class="page-head"><div class="wrap">
<div class="breadcrumb"><a href="index.html">Home</a> / {TAG}</div>
<span class="tag">{TAG}</span>
<h1>{H1}</h1>
<p>{SUB}</p>
</div></section>

<section class="section"><div class="wrap">
<div class="prose" style="max-width:1080px">
<p>{INTRO}</p>
</div>
<div class="tools" style="margin-top:28px">
{TOOLCARDS}
</div>
<div class="method" style="margin-top:34px">
<h2>Our verdict</h2>
<p style="color:var(--text-dim)">{VERDICT}</p>
</div>
<p style="color:var(--text-faint);font-size:14px;margin-top:26px">Back to <a href="index.html" style="color:var(--accent)">all tested tools →</a></p>
</div></section>

<footer class="footer"><div class="wrap">
<div>© 2026 CopyTools, Real-tested AI copywriting reviews.</div>
<div><a href="index.html">Home</a> · <a href="tools.html">AI copywriting tools</a> · <a href="index.html#method">Method</a></div>
</div></footer>
</body>
</html>
"""

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
    html = TPL.format(TITLE=title, DESC=desc, TAG=d["tag"], H1=d["h1"], SUB=d["sub"],
                      INTRO=d["intro"], TOOLCARDS=cards, VERDICT=d["verdict"])
    with open(os.path.join(BASE, fname), "w", encoding="utf-8") as f:
        f.write(html)
    print("wrote", fname)
print("DONE")
