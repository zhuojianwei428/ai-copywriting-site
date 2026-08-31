#!/usr/bin/env python3
# 全站去除 em dash "—" 符号（AI 味重，taste-skill 硬性禁止）。
# 仅做字符串替换，不改动 HTML 结构。扫 .html 输出文件（源码 .py 由生成脚本负责）。
# 路径基于本脚本所在目录，避免硬编码旧路径。
import os, glob, re

BASE = os.path.dirname(os.path.abspath(__file__))
FILES = glob.glob(os.path.join(BASE, "**", "*.html"), recursive=True)
# 排除构建中间产物（下划线开头的片段不参与部署）
FILES = [f for f in FILES if not os.path.basename(f).startswith("_")]
# 排除脚本自身
FILES = [f for f in FILES if "_strip_emdash.py" not in f]

def fix(text):
    # 1) 空格包夹的 em dash -> 逗号+空格
    text = text.replace(" — ", ", ")
    # 2) 行尾/句尾 em dash（前面空格，后面紧跟换行或句号或引号后句号）-> 句号
    text = re.sub(r" —(\s)", r".\1", text)
    # 3) 残留孤立 em dash（无空格）删掉
    text = text.replace("—", "")
    return text

for f in FILES:
    with open(f, encoding="utf-8") as fh:
        before = fh.read()
    after = fix(before)
    if before != after:
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(after)
        print("FIXED", os.path.relpath(f, BASE))
    else:
        print("clean ", os.path.relpath(f, BASE))
print("DONE")
