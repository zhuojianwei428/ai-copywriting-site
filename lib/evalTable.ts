/**
 * A4 单页绩效评估表 —— 数据正典（single source of truth）。
 *
 * 这个模块是整张表的唯一权威定义：评分标尺、各评估类型的固定维度、每种类型该用
 * 什么视角说话、流式标记、解析与序列化。服务端拼 prompt 和前端渲染表格都从这里取，
 * **两边各写一份字面量必然静默漂移**（改了维度名、进度条不会报错，只会退化成估算）。
 *
 * 为什么表格由「结构化数据 + 确定性渲染」产生，而不是让模型直接吐文本表格：
 * 「严格 1 页 A4」「三列固定」「每行必须有数字分值」这三条本质是**排版约束**，
 * 模型无法保证 —— 它多写一句就溢页。把排版交给渲染层，模型只负责「打分 + 写评语」。
 */

/** 5 分制标尺。需求锁定：1=不合格 … 5=优秀，且每行必须是明确数字。 */
export const RATING_SCALE = [
  { score: 1, label: "Unsatisfactory" },
  { score: 2, label: "Needs Improvement" },
  { score: 3, label: "Meets Expectations" },
  { score: 4, label: "Good" },
  { score: 5, label: "Excellent" },
] as const;

/** 表头下方那一行评分说明 */
export const SCALE_LINE = RATING_SCALE.map(
  (r) => `${r.score} = ${r.label}`
).join("  ·  ");

/** 三列固定列名（需求锁定，不得增删列） */
export const COLUMNS = ["Evaluation Area", "Score", "Comments"] as const;

export type ReviewTypeKey = "self" | "manager" | "peer" | "360";

export const TYPE_LABEL: Record<ReviewTypeKey, string> = {
  self: "Self Review",
  manager: "Manager Review",
  peer: "Peer Review",
  "360": "360° Feedback",
};

export function isReviewType(v: string): v is ReviewTypeKey {
  return v === "self" || v === "manager" || v === "peer" || v === "360";
}

/**
 * 各评估类型的核心考核维度（需求逐个锁定）。
 * **顺序即表格行序，也就是进度条的分段依据** —— 模型每写完一行 = 一个真实阶段完成。
 */
export const EVAL_AREAS: Record<ReviewTypeKey, string[]> = {
  self: [
    "Goal Achievement",
    "Core Professional Skills",
    "Work Attitude & Accountability",
    "Teamwork & Communication",
    "Learning & Development",
    "Innovation & Initiative",
  ],
  manager: [
    "Goal Completion",
    "Work Quality & Efficiency",
    "Depth of Professional Expertise",
    "Collaboration & Contribution",
    "Role Accountability",
    "Growth Potential",
  ],
  peer: [
    "Collaboration & Cooperativeness",
    "Communication Effectiveness",
    "Quality of Deliverables",
    "Responsiveness & Timeliness",
    "Cross-team Contribution",
  ],
  "360": [
    "Performance Results",
    "Professional Capability",
    "Management Capability",
    "Teamwork",
    "Customer Orientation",
    "Learning & Development",
  ],
};

export function areasFor(reviewType: string): string[] {
  return isReviewType(reviewType) ? EVAL_AREAS[reviewType] : EVAL_AREAS.manager;
}

/**
 * 每种评估类型「评语该由谁的口吻写」（需求指定的视角）。
 * 这一段直接进 user prompt —— 同一份维度清单，四种视角，评语完全不同。
 */
export const REVIEW_VOICE: Record<ReviewTypeKey, string> = {
  self:
    `You are the employee completing your own self-assessment. Write every comment in the FIRST PERSON ("I", "my") — ` +
    `this is a self-review, so never describe the person in the third person. Be honest about shortfalls rather than purely promotional.`,
  manager:
    `You are the employee's direct manager. Write every comment from an objective, fair managerial standpoint: ` +
    `state genuine strengths plainly, and name specific, actionable improvements rather than vague encouragement.`,
  peer:
    `You are a peer colleague working at the same level. Write every comment strictly from the peer's standpoint, ` +
    `focused on collaboration-related behaviour (how this person works with others), and keep it specific and factual.`,
  "360":
    `You synthesise feedback from the employee's manager, peers and direct reports into one balanced multi-perspective view. ` +
    `Write every comment as a synthesis: give more weight to patterns that several perspectives agree on, and stay even-handed — ` +
    `neither glowing nor harsh.`,
};

/**
 * 流式标记。模型按固定顺序输出这几段，前端据此解析。
 * 与旧版 reportSections.ts 的区别：这里不再注入「章节标题」，维度名由本模块的
 * EVAL_AREAS **按行序** 决定 —— 模型连维度名都不用写，少一份漂移源。
 */
export const EVAL_MARKERS = {
  rows: "[[ROWS]]",
  overall: "[[OVERALL]]",
  strengths: "[[STRENGTHS]]",
  improvements: "[[IMPROVEMENTS]]",
  next: "[[NEXT]]",
} as const;

/** 全部标记，按协议顺序 —— 服务端统计「模型有没有按协议输出」用 */
export const ALL_MARKERS: string[] = [
  EVAL_MARKERS.rows,
  EVAL_MARKERS.overall,
  EVAL_MARKERS.strengths,
  EVAL_MARKERS.improvements,
  EVAL_MARKERS.next,
];

/** 出现在 rows 之后的标记，用于判定 rows 块是否已闭合 */
const SUMMARY_MARKERS = [
  EVAL_MARKERS.overall,
  EVAL_MARKERS.strengths,
  EVAL_MARKERS.improvements,
  EVAL_MARKERS.next,
];

export interface EvalRow {
  /** 维度名，一律取自 EVAL_AREAS（不采信模型写的内容） */
  area: string;
  /** 1–5 整数 */
  score: number;
  comment: string;
}

export interface EvalTable {
  reviewType: ReviewTypeKey;
  employeeName: string;
  jobTitle: string;
  /** 考核周期 / Review period */
  cycle: string;
  /** 始终补齐到该类型的全部维度（未生成出来的行为空），渲染层不必处理长度不一致 */
  rows: EvalRow[];
  /** 真正解析出来的行数 —— 进度条用这个，不是 rows.length */
  rowsSeen: number;
  /** 正在写、尚未成行的那一行的字符数（进度条段内平滑的真实依据，闭合后为 0） */
  partialChars: number;
  overall: string;
  strengths: string;
  improvements: string;
  nextSteps: string;
  complete: boolean;
}

/** 夹紧到 1–5 的整数。需求锁定整数分值，模型给出 4.5 也归到最近的等级。 */
export function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 3;
  return Math.min(5, Math.max(1, Math.round(n)));
}

export function ratingLabel(score: number): string {
  return RATING_SCALE[clampScore(score) - 1].label;
}

/**
 * 总体评分 = 各行分值的算术平均（保留 1 位小数）。
 *
 * 刻意**不**让模型给总评分：它是各行分值的函数，让模型口头报一个数必然出现
 * 「6 个 4 分、总评 4.6」这类自相矛盾，而且用户改某一行分值时总评不会跟着动。
 * 本地算 = 永远自洽。
 */
export function overallScoreOf(rows: EvalRow[]): number | null {
  const scored = rows.filter((r) => r.score >= 1 && r.score <= 5);
  if (!scored.length) return null;
  const sum = scored.reduce((a, r) => a + r.score, 0);
  return Math.round((sum / scored.length) * 10) / 10;
}

/** 取 marker 之后、任一 stop 之前的片段；找不到 marker 返回 null。 */
function afterMarker(
  text: string,
  marker: string,
  stops: readonly string[]
): string | null {
  const i = text.indexOf(marker);
  if (i < 0) return null;
  const start = i + marker.length;
  let end = text.length;
  for (const s of stops) {
    const j = text.indexOf(s, start);
    if (j >= 0 && j < end) end = j;
  }
  return text.slice(start, end);
}

/**
 * 解析一行「分值|评语」。
 * 宽容处理常见的走样：行首项目符号、`4 |` / `4:` 混用、多余空格。
 */
function parseRowLine(line: string): { score: number; comment: string } | null {
  const t = line.replace(/^\s*[-*•]\s*/, "").trim();
  if (!t) return null;
  const m = t.match(/^([0-5](?:\.\d+)?)\s*[|:：]\s*(.+)$/);
  if (!m) return null;
  const score = clampScore(Number(m[1]));
  const comment = m[2].trim();
  if (!comment) return null;
  return { score, comment };
}

/**
 * 从（可能只到一半的）累积流里解析出表格。
 *
 * 必须对「半截流」安全：生成中每收到一个 chunk 都会调用它驱动进度，
 * 此时最后一行往往被切在句子中间。判据是 rows 块**是否已被后续标记闭合** ——
 * 闭合了则所有行都可信，否则丢弃最后一行（它可能只写了 "4|Delivered the Q3 roa"）。
 *
 * 维度名一律**按行序**从 EVAL_AREAS 取，不采信模型写的名字 —— 这样即使模型
 * 把 "Cross-team Contribution" 写成 "Cross team contribution"，表格里也是正典拼写。
 *
 * 降级路径：模型完全没用标记时（协议失败），把整段文本当 rows 块处理 ——
 * 任何 "N|评语" 行都能捞回来，总比整张表空白强。
 */
export function parseEvalStream(
  text: string,
  reviewType: string,
  ctx: { employeeName?: string; jobTitle?: string; cycle?: string } = {}
): EvalTable {
  const type: ReviewTypeKey = isReviewType(reviewType) ? reviewType : "manager";
  const areas = EVAL_AREAS[type];

  const rowsIdx = text.indexOf(EVAL_MARKERS.rows);
  let rowsClosed = false;
  let block: string;
  if (rowsIdx >= 0) {
    const start = rowsIdx + EVAL_MARKERS.rows.length;
    let end = text.length;
    for (const m of SUMMARY_MARKERS) {
      const j = text.indexOf(m, start);
      if (j >= 0 && j < end) {
        end = j;
        rowsClosed = true;
      }
    }
    block = text.slice(start, end);
  } else {
    block = text;
  }

  const lines = block.split("\n");
  // 块未闭合 → 最后一行可能是被切断的半句，不可信
  const usable = rowsClosed ? lines : lines.slice(0, -1);
  const partialChars = rowsClosed
    ? 0
    : (lines[lines.length - 1] || "").trim().length;

  const rows: EvalRow[] = [];
  for (const line of usable) {
    if (rows.length >= areas.length) break;
    const p = parseRowLine(line);
    if (!p) continue;
    rows.push({ area: areas[rows.length], score: p.score, comment: p.comment });
  }
  const rowsSeen = rows.length;
  // 补齐到全部维度，渲染层永远拿到定长数组
  for (let i = rows.length; i < areas.length; i++) {
    rows.push({ area: areas[i], score: 0, comment: "" });
  }

  const overall = (afterMarker(text, EVAL_MARKERS.overall, SUMMARY_MARKERS.slice(1)) || "").trim();
  const strengths = (afterMarker(text, EVAL_MARKERS.strengths, SUMMARY_MARKERS.slice(2)) || "").trim();
  const improvements = (afterMarker(text, EVAL_MARKERS.improvements, [EVAL_MARKERS.next]) || "").trim();
  const nextSteps = (afterMarker(text, EVAL_MARKERS.next, []) || "").trim();

  return {
    reviewType: type,
    employeeName: ctx.employeeName || "",
    jobTitle: ctx.jobTitle || "",
    cycle: ctx.cycle || "",
    rows,
    rowsSeen,
    partialChars,
    overall,
    strengths,
    improvements,
    nextSteps,
    complete:
      rowsSeen >= areas.length &&
      Boolean(overall && strengths && improvements && nextSteps),
  };
}

/**
 * 纯文本序列化 —— 剪贴板、历史记录正文、「Word 导出」的降级路径都走这里。
 * 保持与表格同样的行序与字段，粘贴到邮件/文档里仍然读得懂。
 */
export function evalTableToText(t: EvalTable): string {
  const L: string[] = [];
  L.push(`PERFORMANCE EVALUATION — ${TYPE_LABEL[t.reviewType]}`);
  const head = [
    t.employeeName && `Employee: ${t.employeeName}`,
    t.jobTitle && `Role: ${t.jobTitle}`,
    t.cycle && `Review period: ${t.cycle}`,
    `Type: ${TYPE_LABEL[t.reviewType]}`,
  ].filter(Boolean);
  L.push(head.join("  |  "));
  L.push(`Rating scale: ${SCALE_LINE}`);
  L.push("");
  L.push(COLUMNS.join(" | "));
  for (const r of t.rows) {
    if (!r.score && !r.comment) continue;
    L.push(`${r.area} | ${r.score || "—"} | ${r.comment}`);
  }
  L.push("");
  const total = overallScoreOf(t.rows);
  L.push(
    `Overall rating: ${total === null ? "—" : `${total.toFixed(1)} / 5 (${ratingLabel(total)})`}`
  );
  L.push(`Key strengths: ${t.strengths}`);
  L.push(`Areas for improvement: ${t.improvements}`);
  L.push(`Next steps: ${t.nextSteps}`);
  return L.join("\n");
}
