/**
 * 结果编辑页的数据模型与"生成 → 编辑页"的交接通道。
 *
 * 为什么不用 URL 参数传内容：报告动辄几千字，塞进 query string 又丑又容易超长。
 * 这里用两级：内存单例（客户端路由跳转时 JS 上下文不销毁，最可靠）+ sessionStorage
 * （刷新 / 新开标签页后仍能恢复）。
 */

import type { ScoredKra } from "./score";
import type { EvalTable } from "./evalTable";
import { DISCLAIMER_LINE } from "./constants";
export type ReviewDocKind = "narrative" | "scored";

/** 记分卡的结构化数据（= /api/score 的响应 + 生成时用的上下文） */
export interface ScoreDoc {
  items: ScoredKra[];
  total: number;
  percent: number;
  grade: string;
  gradeLabel: string;
  weightSum: number;
  overall: string;
  strengths: string;
  growth: string;
  nextSteps: string;
  /** 生成时的上下文，导出件里会带上 */
  reviewType?: string;
  jobTitle?: string;
  cycle?: string;
}

export interface ReviewDoc {
  kind: ReviewDocKind;
  title: string;
  createdAt: number;
  /** narrative 模式：A4 评估表的纯文本序列化（历史正文 / 复制 / 降级 Word） */
  text?: string;
  /** narrative 模式：结构化 A4 评估表（渲染 + Word 导出的正源） */
  table?: EvalTable;
  /** scored 模式：结构化记分卡 */
  score?: ScoreDoc;
  /** 对应的历史记录 id —— 编辑后原地更新，不新开一条 */
  historyId?: string;
  /** 历史桶（Clerk userId 或 "guest"），保证编辑页写回同一个桶 */
  scope?: string;
}

const KEY = "air:reviewDoc";

const TYPE_LABEL: Record<string, string> = {
  self: "Self Review",
  manager: "Manager Review",
  peer: "Peer Review",
  "360": "360° Feedback",
};

/**
 * 文档默认标题：有职位/姓名时用"谁 — 什么类型"，否则退回类型名。
 * 这个标题会显示在编辑页顶部，也决定导出文件名。
 */
export function defaultDocTitle(input: {
  reviewType?: string;
  jobTitle?: string;
  employeeName?: string;
  cycle?: string;
  scored?: boolean;
}): string {
  const label =
    TYPE_LABEL[input.reviewType || ""] ||
    (input.scored ? "Performance scorecard" : "Performance review");
  const who = [input.jobTitle, input.employeeName, input.cycle]
    .map((s) => (s || "").trim())
    .filter(Boolean)
    .join(" · ");
  return who ? `${who} — ${label}` : label;
}

let mem: ReviewDoc | null = null;

export function putReviewDoc(doc: ReviewDoc): void {
  mem = doc;
  try {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(KEY, JSON.stringify(doc));
    }
  } catch {
    // 无痕 / 配额满 → 退化为纯内存，同一次会话内的跳转仍然可用
  }
}

export function takeReviewDoc(): ReviewDoc | null {
  if (mem) return mem;
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as ReviewDoc;
    if (!parsed || typeof parsed !== "object") return null;
    mem = parsed;
    return parsed;
  } catch {
    return null;
  }
}

export function patchReviewDoc(patch: Partial<ReviewDoc>): void {
  const cur = takeReviewDoc();
  if (!cur) return;
  putReviewDoc({ ...cur, ...patch });
}

export function clearReviewDoc(): void {
  mem = null;
  try {
    if (typeof window !== "undefined") window.sessionStorage.removeItem(KEY);
  } catch {
    // ignore
  }
}

export function scoreDocToText(s: ScoreDoc): string {
  const lines: string[] = [];
  lines.push("PERFORMANCE SCORECARD");
  if (s.reviewType) lines.push(`Review type: ${s.reviewType}`);
  if (s.jobTitle) lines.push(`Job title: ${s.jobTitle}`);
  if (s.cycle) lines.push(`Appraisal cycle: ${s.cycle}`);
  lines.push(
    `Overall score: ${s.total.toFixed(2)} / 5  (${s.grade} — ${s.gradeLabel})`
  );
  lines.push("");
  lines.push("KRA ratings");
  s.items.forEach((it, i) => {
    lines.push(
      `${i + 1}. ${it.name}  [${it.score}/5, weight ${it.weight}% → ${it.weighted.toFixed(2)}]`
    );
    if (it.basis) lines.push(`   ${it.basis}`);
  });
  lines.push("");
  lines.push("Overall summary");
  lines.push(s.overall || "");
  lines.push("");
  lines.push("Key strengths");
  lines.push(s.strengths || "");
  lines.push("");
  lines.push("Areas for growth");
  lines.push(s.growth || "");
  lines.push("");
  lines.push("Next steps");
  lines.push(s.nextSteps || "");
  lines.push("");
  // 免责声明统一取自 lib/export.ts 的 DISCLAIMER_LINE（正典），不再本地写死字面量 ——
  // 这句话是全站最合规敏感的一句，曾同时存在于 3 处（常量 + 2 份硬编码），改一处会漂移。
  lines.push(DISCLAIMER_LINE);
  return lines.join("\n\n");
}
