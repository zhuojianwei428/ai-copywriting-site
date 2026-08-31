#!/usr/bin/env python3
# 一键构建：按固定顺序跑完所有脚本
#   python _build.py
#
# 顺序不能乱：
#   1. _gen_pages.py      生成 4 个人群落地页
#   2. _gen_tools.py      生成 11 个工具详情页（自带 tags 形式内链）
#   3. _gen_legal.py      生成 privacy / terms / contact 三页
#   4. _gen_articles.py   生成文章详情页 + 博客聚合页的文章列表
#   5. _og_image.py       生成 og.png
#   6. _seo.py            注入 canonical / OG / JSON-LD + 统一导航页脚 + sitemap
#   7. _internal_links.py 补齐内链（工具页已自带，自动跳过）
#
# 顺序要点：_gen_articles.py 必须在 _seo.py / _internal_links.py 之前跑，
# 否则文章详情页会带着自己的旧版页脚覆盖掉统一注入，且拿不到内链块。
#
# 上线前要改的两处：
#   域名  → _seo.py 顶部的 SITE_URL
#   邮箱  → _config.py 顶部的 CONTACT_EMAIL
import os
import sys
import subprocess

BASE = os.path.dirname(os.path.abspath(__file__))
STEPS = ["_gen_pages.py", "_gen_tools.py", "_gen_legal.py", "_gen_articles.py", "_og_image.py", "_seo.py", "_internal_links.py", "_strip_emdash.py"]

for s in STEPS:
    print("=== " + s)
    r = subprocess.run([sys.executable, os.path.join(BASE, s)], cwd=BASE)
    if r.returncode != 0:
        print("FAILED: " + s)
        sys.exit(1)

print("\nBUILD OK")
print("上线前：把 _seo.py 顶部的 SITE_URL 换成真实域名，再跑一次本脚本。")
