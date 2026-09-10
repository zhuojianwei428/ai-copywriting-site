"use client";

/**
 * 纯前端导出，无需后端。
 * - PDF: 用 html2canvas 把 #print-area 截成图片，再用 jsPDF 装进 A4 页直接下载
 *   （不再弹浏览器打印对话框 —— 用户点一下就直接拿到 .pdf 文件）。
 * - 字体/免责声明照旧，只是下载方式从「打印对话框」变成「直接落盘」。
 */

import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";
import { DISCLAIMER_LINE } from "./constants";

// 转发常量，保持既有 `import { DISCLAIMER_LINE } from "../lib/export"` 这类引用不破
export { DISCLAIMER_LINE };

// ===================== A4 尺寸常量（jsPDF 用 mm；html2canvas 用 px @96dpi） =====================
const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
// 与 globals.css 的 @page margin 一致：上下 12mm、左右 14mm
const MARGIN_TOP_MM = 12;
const MARGIN_BOTTOM_MM = 12;
const MARGIN_SIDE_MM = 14;
const CONTENT_WIDTH_MM = A4_WIDTH_MM - MARGIN_SIDE_MM * 2; // 182mm
// 96dpi 下 1mm ≈ 3.7795px；内容区宽度 px（html2canvas 截图宽度）
const CONTENT_WIDTH_PX = Math.round((CONTENT_WIDTH_MM / 25.4) * 96);

/**
 * 把 #print-area 渲染成 PDF 并直接下载。
 *
 * 为什么用 html2canvas 而不是 window.print()：
 *   window.print() 弹的是浏览器打印对话框，用户还得自己选「另存为 PDF」再点保存；
 *   需求是「点击 PDF 按钮就直接拿到 .pdf 文件」—— 所以要离屏截图 + jsPDF 落盘。
 *
 * 关键：屏幕上 #print-area 的排版是为 @media print 调的（.print-only 是 display:none、
 *   .rv-doc 带 min-height:55vh）。html2canvas 在 screen 媒体下截图，会拿到错的样式。
 *   所以这里克隆一份到离屏容器，在克隆体上补 print 专属样式，再截图 —— 不动屏幕上的
 *   原始 DOM，不碰全局 @media print 逻辑。
 */
export async function downloadPDF(
  filename = "performance-review"
): Promise<void> {
  const source = document.getElementById("print-area");
  if (!source) return;

  // 1) 克隆到离屏容器（离屏 = 不进入视口、不触发重排、不污染屏幕）
  const clone = source.cloneNode(true) as HTMLElement;
  const holder = document.createElement("div");
  holder.style.position = "fixed";
  holder.style.left = "-10000px";
  holder.style.top = "0";
  holder.style.width = `${CONTENT_WIDTH_PX}px`;
  holder.style.background = "#ffffff";
  holder.style.zIndex = "-1";
  holder.appendChild(clone);
  document.body.appendChild(holder);

  try {
    await applyPrintStyles(clone);

    // 2) 截图（背景透明确保白底；scale 提升清晰度）
    const canvas = await html2canvas(clone, {
      scale: 2,
      backgroundColor: "#ffffff",
      useCORS: true,
      logging: false,
      width: CONTENT_WIDTH_PX,
      // 不写 height：让它按内容自然撑高，避免截断
    });

    // 3) 装进 A4 页（内容超一页就切页；当前单页评估表理论上正好一页）
    // 用 JPEG（quality 0.92）而非 PNG：A4 评估表是白底文字+色块，JPEG 有损
    // 压缩对打印质量几乎无损，却能把文件从 ~7MB 压到 ~500KB。
    const imgData = canvas.toDataURL("image/jpeg", 0.92);
    const pdf = new jsPDF({
      orientation: "portrait",
      unit: "mm",
      format: "a4",
    });

    const pageContentHeightMM = A4_HEIGHT_MM - MARGIN_TOP_MM - MARGIN_BOTTOM_MM; // 273mm
    // 这张图完整放进内容区时的尺寸
    const fitHeightMM = (CONTENT_WIDTH_MM * canvas.height) / canvas.width;
    const contentWidthMmPerPx = CONTENT_WIDTH_MM / canvas.width;

    if (fitHeightMM <= pageContentHeightMM) {
      // 单页：居中放
      const x = MARGIN_SIDE_MM;
      const y = MARGIN_TOP_MM;
      pdf.addImage(imgData, "JPEG", x, y, CONTENT_WIDTH_MM, fitHeightMM);
    } else {
      // 多页：按内容区高度切片，逐页贴
      const pagePxHeight = pageContentHeightMM / contentWidthMmPerPx;
      let renderedPx = 0;
      let first = true;
      while (renderedPx < canvas.height) {
        const slicePx = Math.min(pagePxHeight, canvas.height - renderedPx);
        const sliceCanvas = document.createElement("canvas");
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = Math.round(slicePx);
        const ctx = sliceCanvas.getContext("2d")!;
        ctx.drawImage(
          canvas,
          0,
          renderedPx,
          canvas.width,
          slicePx,
          0,
          0,
          canvas.width,
          slicePx
        );
        const sliceData = sliceCanvas.toDataURL("image/jpeg", 0.92);
        if (!first) pdf.addPage();
        pdf.addImage(
          sliceData,
          "JPEG",
          MARGIN_SIDE_MM,
          MARGIN_TOP_MM,
          CONTENT_WIDTH_MM,
          (slicePx / canvas.width) * CONTENT_WIDTH_MM
        );
        renderedPx += slicePx;
        first = false;
      }
    }

    pdf.save(`${filename}.pdf`);
  } finally {
    // 无论成败都清掉离屏容器
    holder.remove();
  }
}

/**
 * 在离屏克隆体上补 print 专属样式。
 * 这些规则本来只活在 @media print 里，html2canvas 看不到，得手动搬到克隆体：
 *   - .print-only 元素（编辑页标题 h1、scored 的免责声明）从 display:none 恢复
 *   - .rv-doc 的 min-height:55vh 清零（否则截图撑半页高）
 */
async function applyPrintStyles(clone: HTMLElement): Promise<void> {
  // .print-only → 恢复显示
  clone.querySelectorAll(".print-only").forEach((el) => {
    (el as HTMLElement).style.display = "block";
  });

  // .rv-doc 清掉屏幕上的 min-height，按内容自然高度截
  clone.querySelectorAll(".rv-doc").forEach((el) => {
    (el as HTMLElement).style.minHeight = "0";
  });

  // 确保克隆体用白色背景、正常字号（脱离原容器的 inherited 样式后仍一致）
  clone.style.background = "#ffffff";
  clone.style.color = "#111827";
}

