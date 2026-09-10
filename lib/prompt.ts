/**
 * ⚠️ 这段 prompt 每次请求都会发，且 DeepSeek 的上下文缓存是**自动前缀匹配**的 —
 * 保持它稳定不变才能让输入命中缓存（0.02 元/百万，比未命中的 1 元便宜 50 倍）。
 * 改一次 = 缓存失效一批，非必要别动措辞。
 *
 * 只让模型写真正需要语言生成的 5 块内容；
 * 「2. How This Evaluation Was Conducted」「7. Other Notes」以及第 1 部分的
 * 姓名/职位/任期骨架由服务端用模板拼（见 CONDUCTED_TEXT / overviewMetaLine），
 * 这部分占原输出的 12–18%，而且是每份报告都一样的套话。
 */
export const SYSTEM_PROMPT = `You are an experienced HR business partner who writes complete, formal performance evaluation reports for managers.
Rules:
- Write in clear, professional American English.
- Output exactly 5 blocks, in this order. Start each block with its marker on its own line:
[[OVERVIEW]] one short opening paragraph framing the person's role and the review period. The application already prints the employee name, role and time in role, so do NOT repeat them as a list or heading.
[[FRAMEWORK]] 3-5 core dimensions (e.g. Goal Achievement, Work Quality, Collaboration, Professional Growth), each with a 1-5 star rating and a one-line justification, followed by one neutral sentence on the evaluation method.
[[GOALS]] how far the stated objectives were met; be specific with whatever the user provided.
[[CHALLENGES]] any shortfalls and their likely causes; constructive and forward-looking, never punitive.
[[CONCLUSION]] overall verdict plus 2-4 actionable next steps.
- The application renders the numbered headings, the "How This Evaluation Was Conducted" section and the "Other Notes" section from templates. So do NOT write part numbers, headings, a "how this was conducted" section, or an "other notes" section.
- Do NOT use markdown tables or bullet-heavy lists; keep it readable prose with minimal bullets.
- Be specific, not generic. Use the details the user provided.
- Do NOT invent specific metrics, dates, dollar figures, or achievements the user did not provide. If a number or a missing detail is needed, write it as a neutral fillable placeholder like "[add specific metric]". You may rate dimensions on the 1-5 star scale as a reasoned judgment, but do not fabricate numeric proof.
- Total length: 520-780 words.
- Do not add a greeting or salutation. Start directly with [[OVERVIEW]].`;

/** AI 输出用的块标记，服务端据此拼装成完整报告。 */
export const BLOCK_MARKERS = [
  "[[OVERVIEW]]",
  "[[FRAMEWORK]]",
  "[[GOALS]]",
  "[[CHALLENGES]]",
  "[[CONCLUSION]]",
] as const;

/**
 * 第 2 部分「How This Evaluation Was Conducted」—— 纯流程套话，每份报告结构一致，
 * 只有"依据什么输入"随评估类型变，所以做成模板而不是让模型生成。
 */
export function conductedText(reviewType: ReviewType): string {
  const tail =
    "This evaluation was prepared as part of the organisation's standard review cycle, using the same criteria applied to comparable roles.";
  switch (reviewType) {
    case "self":
      return `It draws on the employee's own self-assessment, the documented goals for the period, and observable work outcomes. ${tail}`;
    case "manager":
      return `It draws on the manager's direct observations, the documented goals for the period, and recorded delivery outcomes. ${tail}`;
    case "peer":
      return `It draws on structured peer feedback, the documented goals for the period, and observed collaboration outcomes. ${tail}`;
    case "360":
      return `It draws on feedback from multiple reviewers across the reporting line and peer group, together with the documented goals for the period. ${tail}`;
    default:
      return `It draws on the documented goals for the period and the work outcomes provided for this review. ${tail}`;
  }
}

/** 第 1 部分的字段骨架（姓名 / 职位 / 任期）—— 用户已经填过，不需要模型复述。 */
export function overviewMetaLine(input: GenerateInput): string {
  const parts: string[] = [];
  if (input.employeeName?.trim())
    parts.push(`Employee: ${input.employeeName.trim()}`);
  if (input.jobTitle) parts.push(`Role: ${input.jobTitle}`);
  if (input.tenure) parts.push(`Time in role: ${input.tenure}`);
  return parts.join(" · ");
}

type ReviewType = "self" | "manager" | "peer" | "360";

const TYPE_LABEL: Record<ReviewType, string> = {
  self: "Self Review",
  manager: "Manager Review",
  peer: "Peer Review",
  "360": "360 Feedback",
};

export interface GenerateInput {
  reviewType: ReviewType;
  jobTitle?: string;
  employeeName?: string | null;
  tenure?: string | null;
  strengths: string[];
  growthAreas: string[];
  tone: "Formal" | "Encouraging" | "Direct";
}

export function buildPrompt(input: GenerateInput): string {
  const typeLabel = TYPE_LABEL[input.reviewType] ?? input.reviewType;
  const strengthsBlock = input.strengths.length
    ? input.strengths.map((s) => `- ${s}`).join("\n")
    : "- (none provided)";
  const growthBlock = input.growthAreas.length
    ? input.growthAreas.map((g) => `- ${g}`).join("\n")
    : "- (none provided)";

  return `Review type: ${typeLabel}
Employee name: ${input.employeeName?.trim() || "N/A"}
Job title: ${input.jobTitle || "N/A"}
Time in role: ${input.tenure || "N/A"}

Key strengths & achievements:
${strengthsBlock}

Areas for growth:
${growthBlock}

Tone: ${input.tone}`;
}
