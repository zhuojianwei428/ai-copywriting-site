/**
 * 报告纯文本 ⇄ HTML 的互转。
 *
 * 生成器把流式纯文本交给编辑页，编辑页要把它渲染成"可编辑的富文本"；
 * 导出 Word 时又要反过来把编辑后的 HTML 直接交给导出器。
 * 样式一律内联 —— 这样浏览器预览和 Word 打开的样子一致，不依赖外部 CSS。
 */

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
