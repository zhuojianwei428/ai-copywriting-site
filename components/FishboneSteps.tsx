"use client";

import { Check } from "lucide-react";

/**
 * 鱼骨式步骤标签（fishbone / Ishikawa 形态）。
 *
 * 视觉结构：一条水平"脊柱"贯穿 4 个节点，每个节点伸出一条短"骨刺"，
 * 骨刺末端挂该步骤的标签，标签**上下交替** —— 这是鱼骨图的辨识特征，
 * 也让 4 个标签不必挤在同一行、每个都能拿到完整列宽。
 *
 * 兼顾可点击回退（只能回到已完成的步骤）与无障碍（aria-current）。
 */

const ACTIVE = "var(--primary-container, #6366f1)";
const SPINE = "var(--border-subtle, #e5e7eb)";
const BONE = "var(--border-strong, #d1d5db)";

interface FishboneStepsProps {
  steps: string[];
  /** 0-based，当前所在步骤 */
  current: number;
  /** 传入则允许点已完成步骤回退 */
  onJump?: (index: number) => void;
  className?: string;
}

export default function FishboneSteps({
  steps,
  current,
  onJump,
  className = "",
}: FishboneStepsProps) {
  const n = steps.length;
  /** 脊柱两端各缩进半列宽 —— 正好从第一个节点中心画到最后一个节点中心 */
  const inset = 50 / n;

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ paddingTop: 28, paddingBottom: 28 }}
      role="list"
      aria-label="Progress"
    >
      {/* 脊柱 */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          top: "50%",
          left: `${inset}%`,
          right: `${inset}%`,
          height: 1,
          background: SPINE,
        }}
      />

      <div className="flex">
        {steps.map((label, i) => {
          const done = i < current;
          const active = i === current;
          const above = i % 2 === 0;
          const clickable = Boolean(onJump) && i < current;

          return (
            <div
              key={label}
              role="listitem"
              className="relative flex flex-1 items-center justify-center"
              style={{ height: 24 }}
            >
              {/* 骨刺 */}
              <span
                aria-hidden="true"
                className="absolute"
                style={{
                  left: "50%",
                  top: "50%",
                  width: 19,
                  height: 1.5,
                  background: done || active ? ACTIVE : BONE,
                  opacity: done || active ? 0.75 : 1,
                  transformOrigin: "left center",
                  transform: `rotate(${above ? -68 : 68}deg)`,
                }}
              />

              {/* 节点 */}
              <button
                type="button"
                disabled={!clickable}
                onClick={clickable ? () => onJump?.(i) : undefined}
                aria-current={active ? "step" : undefined}
                aria-label={`Step ${i + 1}: ${label}${done ? " (completed)" : ""}`}
                className={`relative flex items-center justify-center rounded-full transition-transform ${
                  clickable ? "cursor-pointer hover:scale-110" : "cursor-default"
                }`}
                style={{
                  width: 22,
                  height: 22,
                  background: done || active ? ACTIVE : "var(--surface-card, #fff)",
                  border: `1.5px solid ${done || active ? ACTIVE : BONE}`,
                  // 当前步加一圈柔光，让"我在哪"一眼可见
                  boxShadow: active ? "0 0 0 3px rgba(99,102,241,0.16)" : "none",
                }}
              >
                {done ? (
                  <Check size={12} strokeWidth={3} color="#fff" />
                ) : (
                  <span
                    style={{
                      fontSize: 10.5,
                      fontWeight: 700,
                      lineHeight: 1,
                      color: active ? "#fff" : "var(--text-muted, #6b7280)",
                    }}
                  >
                    {i + 1}
                  </span>
                )}
              </button>

              {/* 标签：上下交替 */}
              <span
                className="absolute whitespace-nowrap"
                style={{
                  left: "50%",
                  transform: "translateX(-50%)",
                  ...(above
                    ? { bottom: "100%", marginBottom: 10 }
                    : { top: "100%", marginTop: 10 }),
                  fontSize: 11,
                  fontWeight: done || active ? 600 : 500,
                  letterSpacing: "0.01em",
                  color:
                    done || active
                      ? "var(--text-primary, #111827)"
                      : "var(--text-muted, #6b7280)",
                }}
              >
                {label}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
