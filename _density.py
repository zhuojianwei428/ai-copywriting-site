#!/usr/bin/env python3
# 关键词密度分析。用法： python _density.py [文件名，默认 index.html]
import re, sys, glob

KW = "ai copywriting tools"
KW_WORDS = len(KW.split())

files = sys.argv[1:] or ["index.html"]


def visible_text(path):
    s = open(path, encoding="utf-8").read()
    s = re.sub(r"<script.*?</script>|<style.*?</style>|<!--.*?-->", " ", s, flags=re.S)
    # 只留 body
    m = re.search(r"<body[^>]*>(.*)</body>", s, re.S)
    if m:
        s = m.group(1)
    # 去掉页脚导航等全站重复区块，只看页面自有内容
    s = re.sub(r'<footer class="footer">.*?</footer>', " ", s, flags=re.S)
    s = re.sub(r"<header class=\"nav\">.*?</header>", " ", s, flags=re.S)
    s = re.sub(r"<[^>]+>", " ", s)
    s = re.sub(r"&nbsp;|&amp;|&rarr;|&copy;", " ", s)
    return re.sub(r"\s+", " ", s).strip()


def words(t):
    return [w for w in re.findall(r"[A-Za-z0-9']+", t.lower())]


for f in files:
    t = visible_text(f)
    w = words(t)
    total = len(w)
    occ = len(re.findall(re.escape(KW), t.lower()))
    # 三种口径
    d_phrase = occ * KW_WORDS / total * 100 if total else 0   # 按词组占词数
    d_occ = occ / total * 100 if total else 0                 # 按出现次数
    print("=" * 62)
    print(f)
    print("  正文总词数        : %d" % total)
    print("  精确匹配次数      : %d" % occ)
    print("  密度(词组/总词)   : %.2f%%   <-- 通常说的\"关键词密度\"" % d_phrase)
    print("  密度(次数/总词)   : %.2f%%" % d_occ)
    print("  --- 拆开看单词 ---")
    for wd in KW.split():
        n = w.count(wd)
        print("    %-12s %3d 次  %.2f%%" % (wd, n, n / total * 100 if total else 0))
    print("  --- 近义变体 ---")
    for v in ["ai writing tools", "ai writing assistants", "ai copywriting",
              "ai copywriting software", "ai tool", "ai tools"]:
        n = len(re.findall(re.escape(v), t.lower()))
        if n:
            print("    %-26s %d 次" % (v, n))
    # 首100词
    first = " ".join(w[:100])
    print("  首100词内是否命中 : %s" % ("是" if KW in first else "否"))
