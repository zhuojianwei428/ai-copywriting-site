"use client";

/**
 * 纯前端导出，无需后端。
 * - PDF: 用浏览器打印（配合 globals.css 的 @media print，只打印结果区）
 * - Word: 用 Blob 生成 .doc（HTML 包壳，零依赖）
 */

export function downloadPDF(): void {
  window.print();
}

export function downloadWord(plainText: string, filename = "performance-review"): void {
  // 把纯文本按空行分段，转成带格式的 HTML
  const paragraphs = plainText
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="margin:0 0 14px;line-height:1.7;font-size:14px;">${escapeHtml(p).replace(/\n/g, "<br/>")}</p>`)
    .join("");

  const html = `<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>${escapeHtml(filename)}</title></head><body style="font-family:Calibri,Arial,sans-serif;">${paragraphs}</body></html>`;

  const blob = new Blob([html], { type: "application/msword" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
