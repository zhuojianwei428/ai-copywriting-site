#!/usr/bin/env python3
# 孤儿页清理：删掉 articles.json 里已不存在的文章详情页 + 无人引用的图片
#
# 为什么需要：后台删文章只改 articles.json，Vercel 只会"重新生成"页面，
# 不会删掉已经生成过的旧 HTML。于是那些页面变成孤儿页——没人链过去，
# 但文件还在、还能直接访问、还会被 sitemap 收录。
#
# 本脚本在 _gen_articles.py 之后、_seo.py 之前跑（sitemap 是扫描目录生成的，
# 必须先清干净才不会把已删页面写进 sitemap）。
#
# 用法：
#   python3 _clean_orphans.py --dry-run   # 只看会删什么，不动文件
#   python3 _clean_orphans.py             # 实际删除
import os
import re
import sys
import glob
import json

BASE = os.path.dirname(os.path.abspath(__file__))
os.chdir(BASE)

# 保护名单：这些页面即使不在 articles.json 里也绝不删
# （手工写的页面、以后想恢复的草稿页，把文件名加进来即可）
PROTECTED_PAGES = {
    # "some-handmade-page.html",
}

# 图片同��受保护（例如 logo / og 图 / 站点通用配图）
PROTECTED_IMAGES = {
    "ai-copywriting-tools-og.png",
    "og.png",
    "logo.png",
    "favicon.png",
}

DRY_RUN = "--dry-run" in sys.argv


def load_live_slugs():
    """articles.json 里现存文章的 slug 集合"""
    slugs = set()
    p = os.path.join(BASE, "articles.json")
    if not os.path.exists(p):
        return slugs
    try:
        with open(p, encoding="utf-8") as f:
            data = json.load(f)
    except Exception as e:
        print("  !! articles.json 解析失败，跳过清理: %s" % e)
        return None
    for a in data.get("articles", []):
        s = (a.get("slug") or "").strip()
        if s:
            slugs.add(s)
    return slugs


def clean_orphan_pages(live_slugs):
    """删掉 blog/articles/ 下不属于任何现存文章的 HTML"""
    d = os.path.join(BASE, "blog", "articles")
    if not os.path.isdir(d):
        print("  (no blog/articles dir, skip)")
        return 0
    removed = 0
    for f in sorted(glob.glob(os.path.join(d, "*.html"))):
        name = os.path.basename(f)
        if name.startswith("_") or name in PROTECTED_PAGES:
            continue
        slug = name[:-5]  # strip .html
        if slug in live_slugs:
            continue
        print("  %s orphan page: blog/articles/%s" % ("[DRY] would remove" if DRY_RUN else "remove", name))
        if not DRY_RUN:
            try:
                os.remove(f)
            except OSError as e:
                print("    !! failed: %s" % e)
                continue
        removed += 1
    return removed


def collect_referenced_images():
    """扫全部 HTML + articles.json，收集被引用到的图片文件名"""
    refs = set()
    # 1) 所有 html 里的 src / href / url(...) / content=
    pat = re.compile(r'(?:src|href|content)\s*=\s*["\']([^"\']+)["\']|url\(([^)]+)\)')
    for f in glob.glob(os.path.join(BASE, "**", "*.html"), recursive=True):
        if os.sep + "admin" + os.sep in f:
            continue
        try:
            with open(f, encoding="utf-8", errors="ignore") as fh:
                txt = fh.read()
        except OSError:
            continue
        for m in pat.finditer(txt):
            u = m.group(1) or m.group(2) or ""
            name = os.path.basename(u.split("?")[0])
            if name:
                refs.add(name)
    # 2) articles.json 正文里也可能有还没渲染进页面的图
    p = os.path.join(BASE, "articles.json")
    if os.path.exists(p):
        try:
            with open(p, encoding="utf-8") as fh:
                txt = fh.read()
            for m in pat.finditer(txt):
                u = m.group(1) or m.group(2) or ""
                name = os.path.basename(u.split("?")[0])
                if name:
                    refs.add(name)
        except Exception:
            pass
    return refs


def clean_orphan_images(refs):
    """删掉 images/ 下无人引用的图片"""
    d = os.path.join(BASE, "images")
    if not os.path.isdir(d):
        print("  (no images dir, skip)")
        return 0
    removed = 0
    for f in sorted(glob.glob(os.path.join(d, "*"))):
        if not os.path.isfile(f):
            continue
        name = os.path.basename(f)
        if name in PROTECTED_IMAGES or name.startswith("_"):
            continue
        if name in refs:
            continue
        print("  %s orphan image: images/%s" % ("[DRY] would remove" if DRY_RUN else "remove", name))
        if not DRY_RUN:
            try:
                os.remove(f)
            except OSError as e:
                print("    !! failed: %s" % e)
                continue
        removed += 1
    return removed


def main():
    print("=== _clean_orphans.py%s" % (" (dry-run)" if DRY_RUN else ""))
    live = load_live_slugs()
    if live is None:
        print("  aborted: articles.json unreadable")
        return
    print("  live articles: %d" % len(live))
    n1 = clean_orphan_pages(live)
    refs = collect_referenced_images()
    print("  referenced images: %d" % len(refs))
    n2 = clean_orphan_images(refs)
    if n1 or n2:
        print("  -> %d orphan page(s), %d orphan image(s) %s" % (n1, n2, "would be removed" if DRY_RUN else "removed"))
    else:
        print("  -> nothing to clean")


if __name__ == "__main__":
    main()
