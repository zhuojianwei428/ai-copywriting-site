"use client";

/**
 * A4 单页绩效评估表 —— 确定性渲染层（the only renderer）。
 *
 * 这个组件把 lib/evalTable.ts 的数据正典渲染成一张可直接打印的 A4 三列表格。
 * 排版约束全部在这里保证：
 *   - 三列固定列名：Evaluation Area / Score / Comments（COLUMNS）
 *   - 表头：标题、姓名、岗位、考核周期、评估类型
 *   - 评分说明一行（5 分制标尺）
 *   - 核心评估表（每行 = 一个维度，分值与评语严格对应）
 *   - 底部总结区：总体评分 / 核心优势 / 待改进 / 下一步
 *
 * 为什么"模型只吐数据、这里渲染"：模型多写一句就会溢页，只有渲染层能把内容
 * 严格压在 1 页 A4 内。所有列名、维度名、标尺都来自 evalTable.ts，不在这里写第二份。
 */

import {
  COLUMNS,
  SCALE_LINE,
  TYPE_LABEL,
  overallScoreOf,
  ratingLabel,
  type EvalTable,
} from "../lib/evalTable";
import { escapeHtml } from "../lib/reportHtml";
import Editable from "./Editable";

export interface EditableCallbacks {
  /** 评分单元格回调 key；返回注册函数，供 Editable 的 onInput 用 */
  onCell?: (key: string) => (el: HTMLElement) => void;
}

interface A4EvaluationTableProps {
  table: EvalTable;
  /** 标题（可编辑页标题 / 生成器里自动生成） */
  title: string;
  /** 可编辑回调；缺省时单元格只读 */
  onEdit?: EditableCallbacks["onCell"];
}

/**
 * 单个单元格的值要能双向编辑：分值是数字，评语是文本。
 * 但为了「结构不漂移」，分值始终以数字渲染 + 校验。
 */

function CellText({
  value,
  placeholder,
  onInput,
  muted = false,
}: {
  value: string;
  placeholder?: string;
  onInput?: (el: HTMLElement) => void;
  muted?: boolean;
}) {
  return (
    <Editable
      initialHtml={escapeHtml(value)}
      onInput={onInput}
      className={muted ? "rv-cell font-body-sm text-body-sm text-text-muted" : "rv-cell font-body-sm text-body-sm text-text-primary"}
      ariaLabel={placeholder || "Cell"}
      placeholder={placeholder}
    />
  );
}

export default function A4EvaluationTable({
  table,
  title,
  onEdit,
}: A4EvaluationTableProps) {
  const total = overallScoreOf(table.rows);
  const scoredRows = table.rows.filter((r) => r.score >= 1 && r.score <= 5);

  return (
    <div className="rv-doc" style={{ fontSize: 13 }}>
      {/* ===== 表头 ===== */}
      <div
        style={{
          borderBottom: "2px solid var(--border-strong, #d1d5db)",
          paddingBottom: 10,
          marginBottom: 12,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
            flexWrap: "wrap",
            gap: 6,
          }}
        >
          <h1
            style={{
              fontSize: 18,
              fontWeight: 700,
              margin: 0,
              lineHeight: 1.3,
            }}
          >
            {title || "Performance Evaluation"}
          </h1>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: "var(--text-muted, #6b7280)",
            }}
          >
            {TYPE_LABEL[table.reviewType]}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: "4px 16px",
            marginTop: 8,
            fontSize: 12.5,
            color: "var(--text-primary, #111827)",
          }}
        >
          {[
            ["Employee", table.employeeName],
            ["Job title", table.jobTitle],
            ["Review period", table.cycle],
          ]
            .filter(([, v]) => v)
            .map(([k, v]) => (
              <div key={k as string} style={{ display: "flex", gap: 6 }}>
                <span style={{ color: "var(--text-muted, #6b7280)", fontWeight: 600, minWidth: 88 }}>
                  {k as string}:
                </span>
                <span style={{ fontWeight: 500 }}>{v as string}</span>
              </div>
            ))}
        </div>
      </div>

      {/* ===== 评分说明（一行 5 分制标尺）===== */}
      <div
        style={{
          fontSize: 11.5,
          color: "var(--text-muted, #6b7280)",
          padding: "6px 8px",
          background: "var(--surface-canvas, #f7f8fa)",
          borderRadius: 6,
          marginBottom: 10,
        }}
      >
        Rating scale: {SCALE_LINE}
      </div>

      {/* ===== 核心评估表（三列）===== */}
      <table
        style={{
          width: "100%",
          borderCollapse: "collapse",
          fontSize: 12.5,
          tableLayout: "fixed",
        }}
      >
        <colgroup>
          <col style={{ width: "26%" }} />
          <col style={{ width: "8%" }} />
          <col style={{ width: "66%" }} />
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((c) => (
              <th
                key={c}
                style={{
                  textAlign: "center",
                  fontWeight: 700,
                  fontSize: 12,
                  padding: "6px 8px",
                  borderBottom: "1.5px solid var(--border-strong, #d1d5db)",
                  background: "var(--surface-canvas, #f7f8fa)",
                  color: "var(--text-primary, #111827)",
                }}
              >
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {table.rows.map((r, i) => {
            const hasScore = r.score >= 1 && r.score <= 5;
            return (
              <tr key={i} style={{ verticalAlign: "top" }}>
                <td
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid var(--border-subtle, #e5e7eb)",
                    fontWeight: 600,
                    color: "var(--text-primary, #111827)",
                    textAlign: "center",
                  }}
                >
                  {r.area}
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid var(--border-subtle, #e5e7eb)",
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      minWidth: 22,
                      height: 22,
                      lineHeight: "22px",
                      borderRadius: 4,
                      fontWeight: 700,
                      textAlign: "center",
                      color: "#fff",
                      background: hasScore
                        ? scoreColor(r.score)
                        : "var(--border-strong, #d1d5db)",
                    }}
                  >
                    {hasScore ? r.score : "—"}
                  </span>
                </td>
                <td
                  style={{
                    padding: "6px 8px",
                    borderBottom: "1px solid var(--border-subtle, #e5e7eb)",
                    textAlign: "center",
                  }}
                >
                  <CellText
                    value={r.comment}
                    placeholder={`Comment for ${r.area}`}
                    onInput={onEdit?.(`comment-${i}`)}
                  />
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* ===== 底部总结区 ===== */}
      <div style={{ marginTop: 12 }}>
        {/* 总体评分 */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            borderRadius: 6,
            background: "var(--surface-canvas, #f7f8fa)",
            border: "1px solid var(--border-subtle, #e5e7eb)",
            marginBottom: 8,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 12.5 }}>
            Overall rating
          </span>
          <span
            style={{
              fontWeight: 800,
              fontSize: 15,
              color: total !== null ? scoreColor(total) : "var(--text-muted, #6b7280)",
            }}
          >
            {total !== null ? `${total.toFixed(1)} / 5` : "—"}
          </span>
          {total !== null && (
            <span style={{ fontSize: 12, color: "var(--text-muted, #6b7280)" }}>
              {ratingLabel(total)}
            </span>
          )}
          <span style={{ fontSize: 11.5, color: "var(--text-muted, #6b7280)", marginLeft: "auto" }}>
            {scoredRows.length} of {table.rows.length} areas rated
          </span>
        </div>

        {/* 总结四项：紧凑两列网格 */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
            gap: 8,
          }}
        >
          {(
            [
              ["Key strengths", table.strengths, `strengths`],
              ["Areas for improvement", table.improvements, `improvements`],
              ["Next steps", table.nextSteps, `nextSteps`],
              ["Overall summary", table.overall, `overall`],
            ] as const
          ).map(([label, body, key]) => (
            <div
              key={key}
              style={{
                padding: "8px 10px",
                borderRadius: 6,
                border: "1px solid var(--border-subtle, #e5e7eb)",
                minHeight: 44,
              }}
            >
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.02em",
                  color: "var(--text-muted, #6b7280)",
                  marginBottom: 3,
                }}
              >
                {label}
              </div>
              <CellText
                value={body}
                placeholder={label}
                onInput={onEdit?.(key)}
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

/** 分值 → 颜色（1 红 → 5 绿，中文语境之外这里用国际化通用色阶） */
function scoreColor(score: number): string {
  if (score >= 4.5) return "#059669"; // emerald-600
  if (score >= 3.5) return "#2563eb"; // blue-600
  if (score >= 2.5) return "#d97706"; // amber-600
  return "#dc2626"; // red-600
}
