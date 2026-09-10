/**
 * 生成过程的**分段进度**解析（A4 评估表，流式）。
 *
 * 这版和旧版「长报告」的关键差别：进度信号从「章节标题」变成了「维度行」。
 * 模型按 lib/evalTable.ts 的固定维度清单逐行输出「分值|评语」，于是
 * 「解析出第 N 行维度」⟺ 「第 N 个维度已经写完」—— 这仍是从内容本身读出的真信号。
 *
 * 每个维度占一段，加一段「写总结」，共 N+1 段（self/manager/360 是 6+1，peer 是 5+1）。
 * 段数随评估类型自适应，避免「永远点不亮的最后一段」反模式。
 *
 * ⚠️ 检测必须作用在**累积文本**上（每次拿完整的 acc 重新解析），
 * 而不是只检查新到的 chunk —— 行会被 TCP/解码切碎。累积解析天然免疫切割、单调不倒退。
 */

import {
  areasFor,
  isReviewType,
  parseEvalStream,
  EVAL_MARKERS,
} from "./evalTable";

export interface ProgressState {
  /** 已完成的段数（0..total） */
  completed: number;
  total: number;
  /** 当前进行中的段索引 */
  activeIndex: number;
  /** 面板顶部显示的过程文案 */
  label: string;
  /** 0-99；流结束时由调用方置 100 */
  percent: number;
  /** true = 没读到任何维度行，已回退到按字符估算 */
  degraded: boolean;
  /** 已收到的正文字符数 */
  chars: number;
}

/** 每个维度的过程文案前缀 */
function areaLabel(area: string): string {
  return `Writing "${area}"`;
}

/** 段内平滑：正在写的一行写满约 90 字即算一段结束的 92% */
const ROW_CHARS = 90;

/** 降级阈值：收到这么多字符还没解析出任何维度行，判定为降级 */
const DEGRADE_MIN_CHARS = 240;

/**
 * 从累积的流式文本推算分段进度。
 *
 * @param text 到目前为止收到的**完整**正文（不是增量）
 * @param reviewType 评估类型，决定维度数量与文案
 */
export function computeProgress(text: string, reviewType: string): ProgressState {
  const chars = text.length;
  const type = isReviewType(reviewType) ? reviewType : "manager";
  const areas = areasFor(type);

  // 用解析器读出行数 + 正在写的那一行的字符数（半行平滑的真实依据）
  const parsed = parseEvalStream(text, type);
  const completed = parsed.rowsSeen;
  const total = areas.length + 1; // 维度段 + 总结段

  const degraded = completed === 0 && chars >= DEGRADE_MIN_CHARS;
  if (degraded) {
    const percent = Math.min(99, Math.round((chars / 1600) * 100));
    return {
      completed: 0,
      total,
      activeIndex: 0,
      label: "Writing your evaluation",
      percent,
      degraded: true,
      chars,
    };
  }

  // 正在写的一行进度：该行已写字符 / 单行预期
  const partial = parsed.partialChars;
  const within = Math.min(0.92, Math.max(0, partial / ROW_CHARS));

  // 总结段：总结块（overall/strengths/improvements/next）已出现即视为进入总结
  const summaryStarted =
    text.indexOf(EVAL_MARKERS.overall) >= 0 ||
    text.indexOf(EVAL_MARKERS.strengths) >= 0;

  let segment: number;
  let label: string;
  if (summaryStarted) {
    // 总结段内部：按总结块出现数量平滑
    const summaryDone = [
      EVAL_MARKERS.overall,
      EVAL_MARKERS.strengths,
      EVAL_MARKERS.improvements,
      EVAL_MARKERS.next,
    ].filter((m) => text.indexOf(m) >= 0).length;
    segment = completed + Math.min(0.95, summaryDone / 4);
    label = "Writing your summary";
  } else if (completed < areas.length) {
    segment = completed + within;
    label = areaLabel(areas[completed]);
  } else {
    segment = completed;
    label = "Writing your summary";
  }

  const raw = (segment / total) * 100;

  return {
    completed: Math.min(completed, total),
    total,
    activeIndex: Math.min(completed, total - 1),
    label,
    percent: Math.min(99, Math.max(3, Math.round(raw))),
    degraded: false,
    chars,
  };
}

/** 分段文案（供 GenerationProgress 的分段列表渲染） */
export function progressSections(reviewType: string): string[] {
  const areas = areasFor(reviewType);
  return [...areas.map((a) => areaLabel(a)), "Writing your summary"];
}
