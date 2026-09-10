/**
 * 生成过程的**分段进度**解析（narrative 模式，流式）。
 *
 * 为什么这是"真进度"而不是估算：服务端 `transform()` 会把模型输出的块标记
 * （`[[OVERVIEW]]` / `[[FRAMEWORK]]` / …）替换成带编号的章节标题再流下来。
 * 于是"某个章节标题出现了"⟺ 模型已经写完上一章 —— 这是从内容本身读出来的信号。
 * 之前那版进度是按累计字符数除以 ESTIMATED_CHARS 推的假进度，快慢全靠猜。
 *
 * ⚠️ 检测必须作用在**累积文本**上（每次拿完整的 acc 重新 includes），
 * 而不是只检查新到的那个 chunk：标题会被 TCP/解码切成两半
 * （"1. Basic Ov" + "erview"）。累积检测天然免疫切割，而且单调 —— 已出现的不会消失。
 */

import { SECTION_TITLE } from "./reportSections";

export interface ProgressSection {
  /** 面板上显示的过程文案 —— 描述"正在做什么"，不是章节名 */
  label: string;
  /** 这一段**结束**的标志：这个章节标题在流里出现 */
  endsAt: string;
}

/**
 * 分段定义。顺序 = 报告真实的写作顺序。
 *
 * 第 2 章（How This Evaluation Was Conducted）是服务端模板，纯套话、瞬间产出，
 * 没有独立的等待时间，所以不单列一段，并进第 2 段。
 */
export const PROGRESS_SECTIONS: ProgressSection[] = [
  { label: "Reviewing your inputs", endsAt: SECTION_TITLE.overview },
  { label: "Drafting the opening overview", endsAt: SECTION_TITLE.framework },
  { label: "Building the evaluation framework", endsAt: SECTION_TITLE.goals },
  { label: "Reviewing progress against goals", endsAt: SECTION_TITLE.challenges },
  { label: "Analysing challenges and causes", endsAt: SECTION_TITLE.conclusion },
  { label: "Writing the conclusion", endsAt: SECTION_TITLE.notes },
];

export const PROGRESS_TOTAL = PROGRESS_SECTIONS.length;

/** 报告总长的粗略预期（字符），只在降级路径里用 */
export const ESTIMATED_CHARS = 3600;

/** 单段平均字符数 —— 用来在段内把进度条平滑推进，纯观感，不影响分段判定 */
const SECTION_CHARS = 520;

/**
 * 降级阈值：模型完全没用块标记时（prompt 被改动、上游换了模型），
 * 正文里不会有任何章节标题。收到这么多字符还没见到第一章，就判定为降级。
 */
const DEGRADE_MIN_CHARS = 240;

export interface ProgressState {
  /** 已完成的段数（0..total） */
  completed: number;
  total: number;
  /** 当前进行中的段索引；全部完成时等于 total */
  activeIndex: number;
  /** 面板顶部显示的过程文案 */
  label: string;
  /** 0-99；流结束时由调用方置 100 */
  percent: number;
  /** true = 没读到章节标题，已回退到按字符估算（分段列表退化为"只显示当前段"） */
  degraded: boolean;
  /** 已收到的正文字符数（给"已生成 N 字"这类细节用） */
  chars: number;
}

/**
 * 从累积的流式文本推算分段进度。
 *
 * @param text 到目前为止收到的**完整**正文（不是增量）
 */
export function computeProgress(text: string): ProgressState {
  const chars = text.length;

  let completed = 0;
  let lastMatchEnd = 0;
  for (const s of PROGRESS_SECTIONS) {
    const i = text.indexOf(s.endsAt);
    if (i < 0) break;
    completed += 1;
    lastMatchEnd = i + s.endsAt.length;
  }

  const degraded = completed === 0 && chars >= DEGRADE_MIN_CHARS;

  if (degraded) {
    const percent = Math.min(99, Math.round((chars / ESTIMATED_CHARS) * 100));
    return {
      completed: 0,
      total: PROGRESS_TOTAL,
      activeIndex: 0,
      label: "Writing your review",
      percent,
      degraded: true,
      chars,
    };
  }

  const activeIndex = Math.min(completed, PROGRESS_TOTAL - 1);
  const label =
    completed >= PROGRESS_TOTAL
      ? "Finalising your report"
      : PROGRESS_SECTIONS[completed].label;

  // 段内平滑：最后匹配到的标题之后又写了多少字符 / 单段预期
  const within = Math.min(0.92, Math.max(0, chars - lastMatchEnd) / SECTION_CHARS);
  const raw = ((completed + within) / PROGRESS_TOTAL) * 100;

  return {
    completed,
    total: PROGRESS_TOTAL,
    activeIndex,
    label,
    percent: Math.min(99, Math.max(3, Math.round(raw))),
    degraded: false,
    chars,
  };
}
