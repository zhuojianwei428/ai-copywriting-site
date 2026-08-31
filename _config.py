#!/usr/bin/env python3
# 全站可变量集中在这里。改完跑一次 python _build.py 即可全站生效。
#
# 例外：域名仍然在 _seo.py 顶部的 SITE_URL 改（那行管 canonical / sitemap / robots）。
#
# ★ 联系邮箱：目前是暂定邮箱，换正式邮箱时只改这一行 ★
CONTACT_EMAIL = "contact@aiwritereview.com"

# 站点名，页脚 / 法务页 / 结构化数据共用
SITE_NAME = "CopyTools"

# 法务页面的"最后更新"日期。改了隐私政策 / 服务条款的内容后，
# 把日期往前推到修改当天，再跑 _build.py。
LEGAL_UPDATED = "August 30, 2026"

# 法务页里写死的年份，版权用
LEGAL_YEAR = "2026"

# ★★★ 临时隐藏 "AI copywriting tools" 目录（tools.html + tools/ 11 个工具页） ★★★
#   True  = 从导航/页脚/首页/博客移除所有 tools 入口，robots.txt 屏蔽，sitemap 排除，
#           工具页加 noindex，首页 JSON-LD 不再列出工具。文件不删，URL 仍可访问。
#   False = 全部恢复公开。
#   放开时：把这里改成 False，然后跑一次 python _build.py 即可全站恢复。
#   注意：index.html 的 hero 按钮、blog/how-we-avoid 页的工具网格是两处手写改动，
#         放开时还需手动还原这两处（见项目 memory 记录）。
HIDE_TOOLS = True
