"use client";

import { useEffect, useRef } from "react";

/**
 * AdSense 广告位（预埋）。
 *
 * 未配置 NEXT_PUBLIC_ADSENSE_CLIENT 时：渲染一个等高占位块，页面布局不变、
 * 不报错、不发请求。拿到 publisher ID 后填 env 并重新构建即可真正展示广告。
 *
 * 注意 NEXT_PUBLIC_* 是**构建期内联**的，改完 env 必须重新构建（推一次提交）。
 */

const CLIENT = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || "";
const SLOT = process.env.NEXT_PUBLIC_ADSENSE_SLOT || "";

type Props = {
  /** 预留的高度（px），未启用广告时用来占位，避免布局跳动 */
  height?: number;
  className?: string;
  /** 语义化标签，方便以后按位置分别配 slot */
  label?: string;
};

export default function AdSlot({ height = 100, className = "", label = "ad" }: Props) {
  const pushed = useRef(false);

  useEffect(() => {
    if (!CLIENT || !SLOT || pushed.current) return;
    try {
      const w = window as unknown as { adsbygoogle?: unknown[] };
      w.adsbygoogle = w.adsbygoogle || [];
      w.adsbygoogle.push({});
      pushed.current = true;
    } catch {
      // 广告被拦截 / 脚本未加载 → 静默失败，不影响主流程
    }
  }, []);

  if (!CLIENT || !SLOT) {
    return (
      <div
        aria-hidden
        data-ad-placeholder={label}
        className={`hidden ${className}`}
        style={{ height }}
      />
    );
  }

  return (
    <div className={className} data-ad-slot-wrap={label}>
      <ins
        className="adsbygoogle"
        style={{ display: "block", minHeight: height }}
        data-ad-client={CLIENT}
        data-ad-slot={SLOT}
        data-ad-format="auto"
        data-full-width-responsive="true"
      />
    </div>
  );
}
