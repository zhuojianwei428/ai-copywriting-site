/**
 * 生成 prompt。
 *
 * ⚠️ SYSTEM_PROMPT 每次请求都会发，且 DeepSeek 的上下文缓存是**自动前缀匹配**的 ——
 * 保持它稳定不变才能让输入命中缓存（0.02 元/百万，比未命中的 1 元便宜 50 倍）。
 * 所以「随评估类型变」的那部分（视角 + 维度清单）全部放在 user message 里，
 * 系统提示只留稳定的格式与规则。
 *
 * 这一版和上一版的关键差别：**不再让模型写章节长文**。
 * 模型的职责被压缩到「打分 + 写评语」，标题、表头、评分说明、总评分全部由
 * 应用侧确定性生成 —— 因为「严格 1 页 A4」「三列固定」「每行必须有数字分值」
 * 是排版约束，模型多写一句就会溢页，只有渲染层能保证。
 */

import { EVAL_MARKERS, areasFor, REVIEW_VOICE, TYPE_LABEL, isReviewType } from "./evalTable";

export const SYSTEM_PROMPT = `You are an experienced HR business partner completing a one-page A4 performance evaluation form. You produce the CONTENT ONLY — the application renders the table, the headings and the rating scale. Never draw a table yourself.

Output exactly these five blocks, in this order, and nothing else:

${EVAL_MARKERS.rows}
<one line per evaluation area, in exactly the order the areas are listed for you below>
<each line must be: a single digit 1-5, then a vertical bar, then the comment>
${EVAL_MARKERS.overall}
<one sentence, maximum 30 words, giving the overall verdict>
${EVAL_MARKERS.strengths}
<one line listing up to 3 proven strengths, separated by "; ">
${EVAL_MARKERS.improvements}
<one line listing up to 3 concrete areas for improvement, separated by "; ">
${EVAL_MARKERS.next}
<one line listing up to 3 forward-looking actions, separated by "; ">

Hard rules:
- Write in clear, professional American English.
- Do NOT write headings, area names, markdown, tables, bullets, numbering, preambles, or any explanatory text. The application already prints the area names and the column headers. Start your reply directly with ${EVAL_MARKERS.rows}.
- Each score MUST be an integer from 1 to 5 on this scale: 1 = Unsatisfactory, 2 = Needs Improvement, 3 = Meets Expectations, 4 = Good, 5 = Excellent.
- Use the full 1-5 range honestly. Not everything is a 4 or a 5. A score of 3 is a normal, expected rating.
- Each comment must be ONE sentence of 15-30 words, concrete and evidence-based, and must visibly match its score: a 5 must not read like a 3, and a 2 must not read like praise.
- Never merge two areas onto one line, never skip an area, and never add an extra area.
- Do NOT invent metrics, dates, dollar figures, or achievements the user did not provide. If a concrete number would strengthen a comment but was not supplied, write a neutral placeholder such as "[add specific metric]".
- Do NOT output an overall numeric score anywhere — the application computes it from your per-area scores. The final block takes prose only.
- Keep the total output under 320 words so the form fits on one page.`;

export interface GenerateInput {
  reviewType: string;
  jobTitle?: string;
  employeeName?: string | null;
  tenure?: string | null;
  /** 考核周期 / Review period */
  cycle?: string | null;
  strengths: string[];
  growthAreas: string[];
  tone: "Formal" | "Encouraging" | "Direct";
}

export function buildPrompt(input: GenerateInput): string {
  const type = isReviewType(input.reviewType) ? input.reviewType : "manager";
  const typeLabel = TYPE_LABEL[type];
  const voice = REVIEW_VOICE[type];
  const areas = areasFor(type);

  const strengthsBlock = input.strengths.length
    ? input.strengths.map((s) => `- ${s}`).join("\n")
    : "- (none provided)";
  const growthBlock = input.growthAreas.length
    ? input.growthAreas.map((g) => `- ${g}`).join("\n")
    : "- (none provided)";

  /** 维度清单带行号列出 —— 行号即表格行序，也是进度条的分段依据 */
  const areaBlock = areas.map((a, i) => `${i + 1}. ${a}`).join("\n");

  return `Review type: ${typeLabel}
Employee name: ${input.employeeName?.trim() || "N/A"}
Job title: ${input.jobTitle || "N/A"}
Review period: ${input.cycle?.trim() || "N/A"}
Time in role: ${input.tenure || "N/A"}

WHO IS SPEAKING:
${voice}

EVALUATION AREAS — output exactly ${areas.length} lines in ${EVAL_MARKERS.rows}, in this order, one line per area, one comment per area:
${areaBlock}

Key strengths & achievements the user supplied:
${strengthsBlock}

Areas for growth the user supplied:
${growthBlock}

Tone: ${input.tone}

Reminder: start directly with ${EVAL_MARKERS.rows} and output nothing else outside the five blocks.`;
}
