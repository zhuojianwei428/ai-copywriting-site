/**
 * 报告纯文本 ⇄ HTML 的互转。
 *
 * 生成器把流式纯文本交给编辑页，编辑页要把它渲染成"可编辑的富文本"；
 * 导出 Word 时又要反过来把编辑后的 HTML 直接交给导出器。
 * 样式一律内联 —— 这样浏览器预览和 Word 打开的样子一致，不依赖外部 CSS。
 */

import {
  COLUMNS,
  TYPE_LABEL,
  SCALE_LINE,
  overallScoreOf,
  ratingLabel,
  type EvalTable,
} from "./evalTable";

export function escapeHtml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** 小标题（"1. Basic Overview" 这类行） */
const H3_STYLE =
  "font-size:15px;font-weight:700;line-height:1.4;margin:18px 0 6px;";
/** 正文段落 */
const P_STYLE = "font-size:14px;line-height:1.7;margin:0 0 10px;";
/** 空行占位 */
const SP_STYLE = "height:10px;font-size:0;line-height:0;";

/** 一段纯文本 → 若干 <p>（段内换行转 <br/>） */
export function textToBlocks(text: string): string {
  return (text || "")
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map(
      (p) =>
        `<p style="${P_STYLE}">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`
    )
    .join("");
}

/**
 * A4 评估表 → 内联样式 HTML（Word 导出用）。
 *
 * 与 components/A4EvaluationTable.tsx 的屏幕渲染**结构一致**：三列固定列名、
 * 表头、评分说明、核心评估表、底部总结区。Word 不识别 React，所以这里产出
 * 纯内联样式的静态 HTML，交给 downloadWordFromHtml() 包壳。
 * 列名 / 维度名 / 标尺都来自 evalTable.ts 正典，不写第二份字面量。
 */
export function evalTableToHtml(t: EvalTable): string {
  const total = overallScoreOf(t.rows);
  const head = [
    t.employeeName && `Employee: ${t.employeeName}`,
    t.jobTitle && `Job title: ${t.jobTitle}`,
    t.cycle && `Review period: ${t.cycle}`,
  ]
    .filter(Boolean)
    .join("&nbsp;&nbsp;|&nbsp;&nbsp;");

  const th = `style="border:1px solid #d1d5db;background:#f7f8fa;font-weight:700;padding:6px 8px;text-align:left;font-size:12px;color:#111827;font-family:Calibri,Arial,sans-serif;"`;
  const td = `style="border:1px solid #e5e7eb;padding:6px 8px;font-size:12.5px;vertical-align:top;color:#111827;font-family:Calibri,Arial,sans-serif;"`;

  const rowsHtml = t.rows
    .map((r) => {
      const hasScore = r.score >= 1 && r.score <= 5;
      const color = hasScore ? scoreColor(r.score) : "#d1d5db";
      return `<tr>
<td ${td}><strong>${escapeHtml(r.area)}</strong></td>
<td ${td.replace("text-align:left", "text-align:center")}><span style="display:inline-block;min-width:22px;height:22px;line-height:22px;border-radius:4px;font-weight:700;text-align:center;color:#fff;background:${color};">${hasScore ? r.score : "—"}</span></td>
<td ${td}>${escapeHtml(r.comment)}</td>
</tr>`;
    })
    .join("");

  const summaryItems = [
    ["Key strengths", t.strengths],
    ["Areas for improvement", t.improvements],
    ["Next steps", t.nextSteps],
    ["Overall summary", t.overall],
  ]
    .map(
      ([label, body]) =>
        `<div style="border:1px solid #e5e7eb;border-radius:6px;padding:8px 10px;margin-bottom:8px;"><div style="font-size:11px;font-weight:700;text-transform:uppercase;color:#6b7280;margin-bottom:3px;">${label}</div><div style="font-size:12.5px;color:#111827;">${escapeHtml(body)}</div></div>`
    )
    .join("");

  return `<div style="font-family:Calibri,Arial,sans-serif;font-size:13px;color:#111827;">
<div style="border-bottom:2px solid #d1d5db;padding-bottom:10px;margin-bottom:12px;">
<div style="font-size:18px;font-weight:700;">${escapeHtml("Performance Evaluation")}</div>
<div style="font-size:12px;color:#6b7280;margin-top:6px;">${head}</div>
<div style="font-size:12px;font-weight:600;color:#6b7280;margin-top:2px;">${TYPE_LABEL[t.reviewType]}</div>
</div>
<div style="font-size:11.5px;color:#6b7280;padding:6px 8px;background:#f7f8fa;border-radius:6px;margin-bottom:10px;">Rating scale: ${SCALE_LINE}</div>
<table style="width:100%;border-collapse:collapse;font-size:12.5px;">
<colgroup><col style="width:26%"/><col style="width:8%"/><col style="width:66%"/></colgroup>
<thead><tr><th ${th}>${COLUMNS[0]}</th><th ${th.replace("text-align:left", "text-align:center")}>${COLUMNS[1]}</th><th ${th}>${COLUMNS[2]}</th></tr></thead>
<tbody>${rowsHtml}</tbody>
</table>
<div style="margin-top:12px;">
<div style="padding:8px 10px;border-radius:6px;background:#f7f8fa;border:1px solid #e5e7eb;margin-bottom:8px;">
<span style="font-weight:700;font-size:12.5px;">Overall rating</span>
<span style="font-weight:800;font-size:15px;color:${total !== null ? scoreColor(total) : "#6b7280"};margin-left:8px;">${total !== null ? `${total.toFixed(1)} / 5` : "—"}</span>
${total !== null ? `<span style="font-size:12px;color:#6b7280;margin-left:8px;">${ratingLabel(total)}</span>` : ""}
</div>
${summaryItems}
</div>
</div>`;
}

/** 分值 → 颜色 */
function scoreColor(score: number): string {
  if (score >= 4.5) return "#059669";
  if (score >= 3.5) return "#2563eb";
  if (score >= 2.5) return "#d97706";
  return "#dc2626";
}

/**
 * 整篇报告纯文本 → HTML。
 * `1. Basic Overview` 这种编号行渲染成小标题，其余按段落处理。
 */
export function reportToHtml(text: string): string {
  if (!text) return "";
  let html = "";
  for (const line of text.split("\n")) {
    const t = line.trim();
    if (t === "") {
      html += `<div style="${SP_STYLE}"></div>`;
      continue;
    }
    const m = t.match(/^(\d)\.\s+(.+)/);
    if (m && t.length < 80) {
      html += `<h3 style="${H3_STYLE}">${escapeHtml(t)}</h3>`;
    } else {
      html += `<p style="${P_STYLE}">${escapeHtml(line)}</p>`;
    }
  }
  return html;
}
