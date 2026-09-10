"use client";

import { Check, RefreshCw } from "lucide-react";

/**
 * 生成过程的分段进度面板。
 *
 * 组成：顶部「当前阶段 + 百分比」→ 总进度条 → 分段列表（每段带状态）。
 * 分段列表是这个面板存在的理由：用户等待时最想知道的是"还剩几段、卡在哪一段"，
 * 一条只会往前爬的进度条回答不了这个。
 *
 * 驱动源与组件解耦 —— 传进来的 completed / activeIndex / percent 算好即可：
 *  · narrative 模式由 lib/reportProgress.ts 从**流里的真实章节标题**推算；
 *  · scored 模式没有流式信号，由耗时预估驱动（那时调用方不传 sections 的真实语义）。
 */

const ACTIVE = "var(--primary-container, #6366f1)";
const SPINE = "var(--border-subtle, #e5e7eb)";

interface GenerationProgressProps {
  /** 分段文案（按发生顺序） */
  sections: string[];
  /** 已完成的段数 */
  completed: number;
  /** 顶部当前阶段文案 */
  label: string;
  /** 0-99 */
  percent: number;
  /** 降级：拿不到真实分段信号时**不渲染假分段**，只留进度条 */
  degraded?: boolean;
  /** 面板底部的一行说明 */
  hint?: string;
}

export default function GenerationProgress({
  sections,
  completed,
  label,
  percent,
  degraded = false,
  hint,
}: GenerationProgressProps) {
  const pct = Math.max(2, Math.min(100, percent));

  return (
    <div>
      {/* 阶段 + 百分比 */}
      <div className="flex items-center justify-between mb-sm">
        <div className="flex items-center gap-xs">
          <RefreshCw size={14} className="animate-spin text-text-muted" />
          <span className="font-label-md text-label-md text-text-primary">
            {label}
          </span>
        </div>
        <span className="font-label-md text-label-md text-text-muted tabular-nums">
          {Math.round(percent)}%
        </span>
      </div>

      {/* 总进度条 */}
      <div
        className="h-1.5 w-full rounded-full overflow-hidden"
        style={{ background: SPINE }}
        role="progressbar"
        aria-valuenow={Math.round(percent)}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={label}
      >
        <div
          className="h-full rounded-full transition-[width] duration-300 ease-out"
          style={{ width: `${pct}%`, background: ACTIVE }}
        />
      </div>

      {/* 分段列表 */}
      {!degraded && sections.length > 0 && (
        <ol className="mt-lg mb-0 pl-0" style={{ listStyle: "none" }}>
          {sections.map((s, i) => {
            const done = i < completed;
            const running = i === completed;
            const last = i === sections.length - 1;
            return (
              <li key={s} className="relative flex items-start" style={{ gap: 10, padding: "5px 0" }}>
                {/* 连接下一段的竖线 */}
                {!last && (
                  <span
                    aria-hidden="true"
                    className="absolute"
                    style={{
                      left: 8,
                      top: 24,
                      bottom: -4,
                      width: 1,
                      background: done ? ACTIVE : SPINE,
                      opacity: done ? 0.5 : 1,
                    }}
                  />
                )}

                {/* 状态图标 */}
                <span
                  className="relative flex shrink-0 items-center justify-center rounded-full"
                  style={{
                    width: 17,
                    height: 17,
                    marginTop: 2,
                    background: done || running ? ACTIVE : "var(--surface-card, #fff)",
                    border: `1.5px solid ${done || running ? ACTIVE : SPINE}`,
                  }}
                >
                  {done ? (
                    <Check size={10} strokeWidth={3} color="#fff" />
                  ) : running ? (
                    <RefreshCw size={9} className="animate-spin" color="#fff" />
                  ) : null}
                </span>

                {/* 文案 */}
                <span
                  className="font-body-sm text-body-sm"
                  style={{
                    color:
                      done || running
                        ? "var(--text-primary, #111827)"
                        : "var(--text-muted, #6b7280)",
                    fontWeight: running ? 600 : 400,
                  }}
                >
                  {s}
                </span>
              </li>
            );
          })}
        </ol>
      )}

      {hint && (
        <div className="font-body-sm text-body-sm text-text-muted mt-md">{hint}</div>
      )}
    </div>
  );
}
