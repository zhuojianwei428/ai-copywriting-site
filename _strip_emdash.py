#!/usr/bin/env python3
# 全站去除 em dash "—" 符号（AI 味重）。仅做字符串替换，不改动 HTML 结构。
import os, glob

FILES = glob.glob("D:/ai-copywriting-site/**/*.html", recursive=True) + \
        glob.glob("D:/ai-copywriting-site/**/*.py", recursive=True)
# 排除脚本自身
FILES = [f for f in FILES if "_strip_emdash.py" not in f]

def fix(text):
    # 1) 空格包夹的 em dash -> 逗号+空格
    text = text.replace(" — ", ", ")
    # 2) 行尾/句尾 em dash（前面空格，后面紧跟换行或句号或引号后句号）-> 句号
    #    处理 "real-tested." 这类版权行: "Reviews — Real-tested." -> "Reviews. Real-tested."
    import re
    text = re.sub(r" —(\s)", r".\1", text)
    # 3) 残留孤立 em dash（无空格，如 "Real-Tested" 是 hyphen 不动；但 "—" 单独）删掉
    text = text.replace("—", "")
    return text

for f in FILES:
    with open(f, encoding="utf-8") as fh:
        before = fh.read()
    after = fix(before)
    if before != after:
        with open(f, "w", encoding="utf-8") as fh:
            fh.write(after)
        print("FIXED", f)
    else:
        print("clean ", f)
print("DONE")
