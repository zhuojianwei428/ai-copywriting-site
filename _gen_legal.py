#!/usr/bin/env python3
# 生成法律 / 联系三页：privacy.html  terms.html  contact.html
# 幂等：可反复运行，会整页覆盖重写。
#
# ★★★ 换邮箱只改下面这一行，然后跑 python _build.py ★★★
CONTACT_EMAIL = "zhuojianwei428@gmail.com"
# ★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★★

# 邮箱在页面源码里是否做字符实体混淆。
#   True  = 源码里是 &#122;&#104;... 这种数字实体，肉眼看不出邮箱，但浏览器和邮件客户端照常识别成正常地址。
#           目的是防爬虫抓走公开邮箱后发垃圾邮件。
#   False = 源码里直接是明文邮箱（排查问题时更直观）。
OBFUSCATE_EMAIL = True

LAST_UPDATED = "August 30, 2026"
SITE_NAME = "CopyTools"

import os

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)


def mail_addr():
    """写进 HTML 正文/链接的邮箱字符串（受 OBFUSCATE_EMAIL 控制）。"""
    if not OBFUSCATE_EMAIL:
        return CONTACT_EMAIL
    return "".join("&#%d;" % ord(c) for c in CONTACT_EMAIL)


MAIL = mail_addr()

NAV = """<header class="nav"><div class="wrap nav-inner">
<a class="logo" href="index.html"><span class="dot"></span>CopyTools<small>&nbsp;Real-Tested AI Writing</small></a>
<nav class="nav-links">
<a href="tools.html">Tested tools</a>
<a href="for-office-workers.html">Office workers</a>
<a href="blog/how-we-avoid-ai-hallucinations.html">Method</a>
</nav>
<a class="nav-cta" href="tools.html">See the picks &rarr;</a>
</div></header>"""

FOOTER = """<footer class="footer"><div class="wrap">
<div>&copy; 2026 %s, Real-tested AI copywriting reviews.</div>
</div></footer>""" % SITE_NAME


def page(title, desc, tag, h1, lead, body):
    """统一页面骨架。meta description 放在 SEO 块之后，_seo.py 读的就是这一行。"""
    return """<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>{title}</title>
  <meta name="description" content="{desc}" />
  <link rel="stylesheet" href="style.css" />
</head>
<body>

{nav}

<section class="page-head"><div class="wrap">
<div class="breadcrumb"><a href="index.html">Home</a> / {crumb}</div>
<span class="tag">{tag}</span>
<h1>{h1}</h1>
<p>{lead}</p>
</div></section>

<section class="section"><div class="wrap">
<div class="prose">
{body}
</div></div></section>

{footer}

</body>
</html>
""".format(title=title, desc=desc, tag=tag, h1=h1, lead=lead, body=body,
           crumb=tag.title(), nav=NAV, footer=FOOTER)


# ---------------------------------------------------------------- Privacy
PRIVACY_BODY = """
<p>CopyTools is a review site for AI copywriting tools. We wrote this page in plain English because a privacy policy nobody can read protects nobody. It explains what happens to your information when you visit this site.</p>

<h2>The short version</h2>
<p>We do not ask you to sign up. We do not ask for your name, your email, or your credit card. There is no account system here, so there is no pile of personal data sitting in a database waiting to leak. The only information we touch is the kind your browser sends automatically, plus the advertising cookies described below.</p>

<h2>Information we collect</h2>
<h3>Information your browser sends automatically</h3>
<p>Like almost every site on the internet, our host records standard server logs. That means an IP address, the page you asked for, the time of the request, your browser and operating system, and the page that referred you. This is routine server operation, not a tracking scheme. We use it to see which pages load properly and to spot broken links.</p>

<h3>Information you send us on purpose</h3>
<p>If you email us at {mail}, we keep that message so we can reply and so we remember what we already told you. That is the only time we hold something you deliberately handed over. We do not add you to a mailing list — there isn't one.</p>

<h3>We do not collect</h3>
<ul>
<li>Names, addresses, or phone numbers</li>
<li>Payment details of any kind</li>
<li>Anything you type into the AI tools we review (that happens on their site, under their policy, not ours)</li>
</ul>

<h2>Cookies and advertising</h2>
<p>This site shows advertising to cover the cost of testing the tools. Our advertising partners, which include Google, use cookies to serve ads.</p>
<p>Google's use of advertising cookies lets it and its partners show you ads based on your visits to this and other sites. The DoubleClick cookie is the one most often involved. You can opt out of personalised advertising at any time from Google's <a href="https://www.google.com/settings/ads" rel="nofollow noopener" target="_blank">Ads Settings</a> page, and you can opt out of third-party advertising cookies across the web at <a href="https://www.aboutads.info/choices/" rel="nofollow noopener" target="_blank">aboutads.info</a>.</p>
<p>If we ever add an analytics tool, this page will be updated to name it before it goes live.</p>

<h2>Affiliate links</h2>
<p>Right now, the outbound links to the tools we review are plain links — we are not paid per click and we do not earn commission if you sign up. If that ever changes, this page will say so first, and the affected links will be labelled on the page itself.</p>

<h2>Why our reviews are not for sale</h2>
<p>Advertising pays for the hosting. It does not pay for the verdict. A tool's position in our test results has never been influenced by an advertiser, a referral payment, or a press release, and we keep the two things separate on purpose — the moment a review can be bought, it stops being worth reading.</p>

<h2>Your rights</h2>
<p>Depending on where you live, you may have the right to ask what data is held about you, to have it corrected or deleted, and to object to certain processing. Because we hold almost nothing, these requests are quick. Email {mail} and tell us what you need.</p>
<p>You can also block cookies outright in your browser settings. The site will still work; the ads will just be less relevant.</p>

<h2>Children</h2>
<p>This site is written for working adults and is not directed at children under 13. We do not knowingly collect information from children. If you believe a child has contacted us, email {mail} and we will delete it.</p>

<h2>Data retention</h2>
<p>Server logs are kept only as long as our host keeps them as part of normal operation. Emails are kept as long as they remain useful for the conversation, and you can ask us to delete them at any time.</p>

<h2>Changes to this policy</h2>
<p>If this policy changes in a way that matters, we will update the date at the top and, where the change is significant, note it on the homepage. Small wording fixes will not be announced.</p>

<h2>Contact us</h2>
<p>Questions about any of the above: <a href="mailto:{mail}">{mail}</a>.</p>

<p style="color:var(--text-faint);font-size:14px;margin-top:36px">Last updated: {updated}</p>
""".format(mail=MAIL, updated=LAST_UPDATED)


# ------------------------------------------------------------------ Terms
TERMS_BODY = """
<p>These terms govern your use of CopyTools. By reading the site you accept them. If you do not accept them, the appropriate response is to close the tab.</p>

<h2>What this site is</h2>
<p>CopyTools is an independent review site for AI copywriting tools. We buy or subscribe to the tools we test, use them on real writing work, and write up what happened. We are not owned by, funded by, or formally affiliated with any of the tools we review. If a relationship ever exists that could affect a verdict, it will be stated at the top of that review.</p>

<h2>Our reviews are opinions, not specifications</h2>
<p>Every review reflects one thing: our experience with a tool at the time we tested it. Software changes weekly. A limitation we describe may already be fixed; a feature we praise may have been removed or moved to a different plan.</p>
<p>Before you pay for anything, check the vendor's own pricing and feature pages. Treat our write-ups as a strong second opinion, not as the final word.</p>

<h2>Accuracy without warranty</h2>
<p>We work hard not to publish anything false — our <a href="blog/how-we-avoid-ai-hallucinations.html">testing method</a> exists specifically to stop invented facts from reaching a page. Even so, the site is provided "as is". We do not warrant that every statement is error-free, that the site will always be available, or that it is free of anything harmful that slipped past us.</p>

<h2>No professional advice</h2>
<p>Nothing here is legal, financial, or medical advice. Choosing a writing tool is a business decision you make yourself.</p>

<h2>External links</h2>
<p>We link to the tools we review and to sources we cite. Once you leave this site, their terms and privacy policies apply, not ours. We are not responsible for what you find on the other side of a link, though if you find one that is dead or misleading, <a href="contact.html">tell us</a> and we will fix it.</p>

<h2>Advertising</h2>
<p>The site is supported by advertising. Seeing an ad on a page has no bearing on what that page says. See the <a href="privacy.html">Privacy Policy</a> for how advertising cookies work and how to opt out.</p>

<h2>What you may do with our content</h2>
<ul>
<li>Read it, link to it, quote a short passage with credit and a link back — go ahead, no permission needed.</li>
<li>Republishing a review in full, translating it wholesale, or feeding it into another product as your own is not allowed without written permission.</li>
<li>Our name and logo are not yours to use in a way that suggests we endorsed you.</li>
</ul>
<p>If you want to use something more than a short quote, email {mail} — we are usually happy to say yes.</p>

<h2>What you may not do</h2>
<ul>
<li>Scrape the site at a volume that degrades it for other readers</li>
<li>Present our reviews as your own testing</li>
<li>Use the site for anything unlawful, or to try to break into it</li>
</ul>

<h2>Limitation of liability</h2>
<p>To the extent the law allows, CopyTools is not liable for losses that come from using this site or from acting on something you read here — including money spent on a tool that turned out to be wrong for you. This does not limit any liability that cannot legally be limited.</p>

<h2>Changes and availability</h2>
<p>We may revise these terms or take the site down without notice. Continuing to use the site after a change means you accept the updated version.</p>

<h2>Contact</h2>
<p>Questions about these terms: <a href="mailto:{mail}">{mail}</a>, or use the <a href="contact.html">contact page</a>.</p>

<p style="color:var(--text-faint);font-size:14px;margin-top:36px">Last updated: {updated}</p>
""".format(mail=MAIL, updated=LAST_UPDATED)


# ---------------------------------------------------------------- Contact
CONTACT_BODY = """<p>CopyTools is a small, independent review site for AI copywriting tools. There is no contact form and no ticket system — just a mailbox that a real person reads.</p>

<div class="contact-card">
<div class="contact-label">Email us directly</div>
<div class="contact-mail"><a class="mail-big" href="mailto:{mail}">{mail}</a></div>
<p class="contact-note">We reply to most messages within 3 business days. If you have not heard back after a week, send it again — things do get buried.</p>
</div>

<h2>What is worth emailing about</h2>

<h3>A fact we got wrong</h3>
<p>This is the one we care most about. If a price is stale, a feature has moved, or we described something that does not exist, tell us. We verify and correct it, and we will credit you in the correction if you want that.</p>

<h3>A tool you want tested</h3>
<p>We cannot test all of them, but we do read every request. Tell us which tool, what you use it for, and what you want to know that the marketing page will not tell you. That last part is what gets a tool onto the list.</p>

<h3>Corrections of judgement</h3>
<p>You disagree with a verdict — fine, that happens. Tell us which task you ran and what the output looked like. "It was great for me" moves nothing; "here is what it produced on a weekly report" might change our mind, and if it does we will say so on the page.</p>

<h3>Business and partnerships</h3>
<p>Sponsorship, guest contributions, and vendors who want their tool tested: use the address above and put the company name in the subject line. Being asked does not buy a verdict, and we will say no to anything that reads like paying for a score.</p>

<h3>Privacy requests</h3>
<p>Ask what we hold, ask us to delete it, ask us to stop. See the <a href="privacy.html">Privacy Policy</a> for what that involves — the honest answer is that we hold almost nothing, so these are quick.</p>

<h2>Shortcuts</h2>
<p>These open your mail client with the subject already filled in:</p>
<ul>
<li><a href="mailto:{mail}?subject=Fact%20check%3A%20">Report a factual error</a></li>
<li><a href="mailto:{mail}?subject=Please%20test%20this%20tool%3A%20">Suggest a tool to test</a></li>
<li><a href="mailto:{mail}?subject=Business%20enquiry">Business and partnerships</a></li>
<li><a href="mailto:{mail}?subject=Privacy%20request">Privacy or data request</a></li>
</ul>

<h2>What we cannot help with</h2>
<p>We cannot support the tools we review — billing problems, bugs, and account issues belong to the vendor's own support team, and they can actually fix them. We also cannot write your copy for you, though the reviews are a decent guide to which tool should.</p>

<p style="color:var(--text-faint);font-size:14px;margin-top:36px">Last updated: {updated}</p>
""".format(mail=MAIL, updated=LAST_UPDATED)


PAGES = [
    (
        "privacy.html",
        "Privacy Policy | CopyTools — Real-Tested AI Copywriting Tool Reviews",
        "CopyTools is a review site for AI copywriting tools. Here is exactly what we collect, how advertising cookies work, and how to opt out.",
        "Legal",
        "Privacy Policy",
        "What we collect, what we do not, and how the advertising that pays for this site works. No account, no signup, no tracking you did not agree to.",
        PRIVACY_BODY,
    ),
    (
        "terms.html",
        "Terms of Service | CopyTools — Real-Tested AI Copywriting Tool Reviews",
        "The terms for using CopyTools, an independent AI copywriting tool review site. What our reviews are, what they are not, and how our content may be used.",
        "Legal",
        "Terms of Service",
        "The rules of the road for using this site. Short version: our reviews are honest opinions from hands-on testing, not specifications and not advice.",
        TERMS_BODY,
    ),
    (
        "contact.html",
        "Contact Us | CopyTools — Real-Tested AI Copywriting Tool Reviews",
        "Contact CopyTools about a factual error, a tool you want tested, partnerships, or a privacy request. Email {mail} — a real person reads it.".format(mail=CONTACT_EMAIL),
        "Get in touch",
        "Contact",
        "Found something wrong, want a tool tested, or just want to argue with a verdict? That mailbox goes to a real person.",
        CONTACT_BODY,
    ),
]

for fn, title, desc, tag, h1, lead, body in PAGES:
    html = page(title, desc, tag, h1, lead, body)
    open(os.path.join(BASE, fn), "w", encoding="utf-8", newline="\n").write(html)
    print("wrote", fn)

print("\n联系邮箱（改 _gen_legal.py 顶部的 CONTACT_EMAIL 即可全站生效）:", CONTACT_EMAIL)
