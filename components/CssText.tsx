"use client";

import React from "react";

/**
 * 硬性 SEO 要求：高频功能词不进入正文关键词密度。
 * 文字通过 CSS 变量 --ct 传给 ::after { content: var(--ct) } 渲染，
 * aria-label 保留无障碍可读性（不影响可见正文关键词）。
 */
export function CssText({
  text,
  as = "span",
  className = "ct",
  ariaHidden = false,
}: {
  text: string;
  as?: keyof JSX.IntrinsicElements;
  className?: string;
  ariaHidden?: boolean;
}) {
  const Tag = as as React.ElementType;
  return (
    <Tag
      className={className}
      style={{ ["--ct" as string]: `'${text}'` } as React.CSSProperties}
      aria-label={ariaHidden ? undefined : text}
    />
  );
}
