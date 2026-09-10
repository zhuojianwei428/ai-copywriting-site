"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check, Copy, Download, Save } from "lucide-react";
import Editable from "./Editable";
import { useAuth } from "./auth/AuthContext";
import { DISCLAIMER_LINE, downloadPDF, WATERMARK_LINE } from "../lib/export";
import { escapeHtml, reportToHtml, textToBlocks } from "../lib/reportHtml";
import { saveHistory, updateHistory } from "../lib/history";
import {
  patchReviewDoc,
  scoreDocToText,
  takeReviewDoc,
  type ReviewDoc,
  type ScoreDoc,
} from "../lib/reviewDoc";
import { evalTableToText, type EvalTable } from "../lib/evalTable";
import A4EvaluationTable from "./A4EvaluationTable";

/** 编辑后多久自动回写历史（毫秒） */
const AUTOSAVE_MS = 1200;

function slug(s: string): string {
  const base = (s || "performance-review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "performance-review";
}

function stars(score: number): string {
  const full = Math.min(5, Math.max(0, Math.round(score)));
  let s = "";
  for (let i = 0; i < 5; i++) s += i < full ? "★" : "☆";
  return s;
}

export default function ReviewEditor() {
  const router = useRouter();
  const { user } = useAuth();

  const [doc, setDoc] = useState<ReviewDoc | null>(null);
  const [ready, setReady] = useState(false);
  const [title, setTitle] = useState("");
  const [copied, setCopied] = useState(false);
  const [saved, setSaved] = useState(false);

  /** 编辑中的元素引用：narrative → "body"；scored → "basis-0" / "overall" … */
  const edited = useRef<Record<string, HTMLElement>>({});
  const docRef = useRef<ReviewDoc | null>(null);
  const titleRef = useRef("");
  const historyId = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 取出待编辑文档（生成器 / 历史弹窗交接下来的）
  useEffect(() => {
    const d = takeReviewDoc();
    docRef.current = d;
    setDoc(d);
    if (d) {
      setTitle(d.title);
      titleRef.current = d.title;
      historyId.current = d.historyId ?? null;
    }
    setReady(true);
  }, []);

  /** 把当前编辑结果组装成完整的 ScoreDoc（scored 模式回写/导出用） */
  const collectScore = useCallback((): ScoreDoc | null => {
    const s = docRef.current?.score;
    if (!s) return null;
    const read = (key: string, fallback: string) =>
      edited.current[key]?.innerText?.trim() || fallback;
    return {
      ...s,
      items: s.items.map((it, i) => ({
        ...it,
        basis: read(`basis-${i}`, it.basis || ""),
      })),
      overall: read("overall", s.overall),
      strengths: read("strengths", s.strengths),
      growth: read("growth", s.growth),
      nextSteps: read("nextSteps", s.nextSteps),
    };
  }, []);

  /** 把编辑中的单元格回写成 EvalTable（narrative/A4 模式回写/导出用） */
  const collectTable = useCallback((): EvalTable | null => {
    const t = docRef.current?.table;
    if (!t) return null;
    const read = (key: string, fallback: string) =>
      edited.current[key]?.innerText?.trim() || fallback;
    return {
      ...t,
      rows: t.rows.map((r, i) => ({
        ...r,
        comment: read(`comment-${i}`, r.comment),
      })),
      overall: read("overall", t.overall),
      strengths: read("strengths", t.strengths),
      improvements: read("improvements", t.improvements),
      nextSteps: read("nextSteps", t.nextSteps),
    };
  }, []);

  /** 当前文档的纯文本形态（存历史、复制用） */
  const currentText = useCallback((): string => {
    const d = docRef.current;
    if (!d) return "";
    if (d.kind === "scored") {
      const s = collectScore();
      return s ? scoreDocToText(s) : "";
    }
    // narrative / A4 表格：优先用结构化表格序列化，退化到旧文本
    const t = collectTable();
    if (t) return evalTableToText(t);
    return edited.current.body?.innerText?.trim() || d.text || "";
  }, [collectScore, collectTable]);

  /** 写回历史：原地更新那一条，不新开记录 */
  const persist = useCallback(
    (notify?: boolean) => {
      const d = docRef.current;
      if (!d) return;
      const scope = d.scope || "guest";
      const t = titleRef.current || d.title;
      const content = currentText();
      const data = d.kind === "scored" ? collectScore() : collectTable();
      if (historyId.current) {
        updateHistory(scope, historyId.current, { title: t, content, data });
      } else {
        const item = saveHistory(scope, { kind: d.kind, title: t, content, data });
        historyId.current = item.id;
        patchReviewDoc({ historyId: item.id });
      }
      if (notify) {
        setSaved(true);
        setTimeout(() => setSaved(false), 1500);
      }
    },
    [collectScore, collectTable, currentText]
  );

  // 编辑时防抖自动保存，离开页面前把挂起的写入落地
  const scheduleSave = useCallback(() => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => persist(), AUTOSAVE_MS);
  }, [persist]);

  useEffect(() => {
    return () => {
      if (timer.current) clearTimeout(timer.current);
      persist();
    };
  }, [persist]);

  const onEdit = useCallback(
    (key: string) => (el: HTMLElement) => {
      edited.current[key] = el;
      scheduleSave();
    },
    [scheduleSave]
  );

  function onTitle(next: string) {
    setTitle(next);
    titleRef.current = next;
    scheduleSave();
  }

  async function doExportPDF() {
    persist();
    await downloadPDF(slug(titleRef.current));
  }

  async function doCopy() {
    try {
      await navigator.clipboard.writeText(
        `${currentText()}\n\n— ${WATERMARK_LINE}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // 剪贴板不可用（非 https / 权限拒绝）→ 静默忽略
    }
  }

  function goHome() {
    persist();
    router.push("/");
  }

  const score = doc?.score;

  return (
    <main className="min-h-screen bg-surface-canvas">
      {/* ===================== 顶部操作条（打印时自动隐藏） ===================== */}
      <header className="sticky top-0 z-20 border-b border-border-subtle bg-surface-card">
        <div className="mx-auto flex w-full max-w-4xl flex-wrap items-center justify-between gap-sm px-lg py-md">
          <button
            onClick={goHome}
            className="inline-flex items-center gap-xs font-label-md text-label-md text-text-muted hover:text-text-primary"
            type="button"
          >
            <ArrowLeft size={16} />
            <span>Back</span>
          </button>

          <div className="flex flex-wrap items-center gap-sm">
            <button
              onClick={doCopy}
              className="inline-flex items-center justify-center gap-xs px-3.5 py-2 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors font-label-md text-label-md"
              type="button"
            >
              <Copy size={15} />
              <span>{copied ? "Copied" : "Copy"}</span>
            </button>
            <button
              onClick={() => persist(true)}
              className="inline-flex items-center justify-center gap-xs px-3.5 py-2 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors font-label-md text-label-md"
              type="button"
            >
              {saved ? <Check size={15} /> : <Save size={15} />}
              <span>{saved ? "Saved" : "Save"}</span>
            </button>
            <button
              onClick={doExportPDF}
              className="inline-flex items-center justify-center gap-xs px-4 py-2 bg-primary-container text-on-primary rounded-lg font-label-md text-label-md hover:bg-primary transition-colors"
              type="button"
            >
              <Download size={15} />
              <span>PDF</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-4xl px-lg py-xl">
        {ready && !doc && (
          <div className="rounded-xl border border-border-subtle bg-surface-card p-xl text-center">
            <h1 className="mb-sm font-headline-sm text-headline-sm text-text-primary">
              Nothing to edit yet
            </h1>
            <p className="mb-lg font-body-md text-body-md text-text-muted">
              Generate a review first — it will open here so you can polish it
              before exporting.
            </p>
            <button
              onClick={() => router.push("/")}
              className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
              type="button"
            >
              <span>Go to the generator</span>
            </button>
          </div>
        )}

        {doc && (
          <>
            {/* 文档标题（可改；打印时用 #print-area 内的 print-only 副本） */}
            <div className="mb-md">
              <label
                className="mb-xs block font-label-sm text-label-sm uppercase tracking-wider text-text-muted"
                htmlFor="rv-title"
              >
                Document title
              </label>
              <input
                id="rv-title"
                value={title}
                onChange={(e) => onTitle(e.target.value)}
                placeholder="Untitled review"
                className="w-full rounded border border-border-strong bg-surface-card px-3.5 py-2.5 font-title-md text-title-md text-text-primary focus:border-primary-container focus:outline-none focus:ring-1 focus:ring-primary-container"
              />
            </div>

            {/* ===================== 正文（可编辑 + 打印区） ===================== */}
            <div
              id="print-area"
              className="rounded-xl border border-border-subtle bg-surface-card p-xl"
            >
              {/* 打印标题副本：仅 scored 模式需要 —— narrative（A4 表格）模式的标题
                  已由 A4EvaluationTable 自己渲染（含标题 + 类型标签），这里再补一份会重复。
                  scored 模式正文是结构化表格、没有标题，所以打印/导出时补这一份。 */}
              {doc.kind === "scored" && (
                <h1
                  className="print-only"
                  style={{ fontSize: 20, fontWeight: 700, margin: "0 0 14px" }}
                >
                  {title}
                </h1>
              )}

              {doc.kind === "narrative" ? (
                doc.table ? (
                  <A4EvaluationTable
                    table={doc.table}
                    title={title}
                    onEdit={(key) => onEdit(key)}
                  />
                ) : (
                  <Editable
                    initialHtml={reportToHtml(doc.text || "")}
                    onInput={onEdit("body")}
                    className="rv-doc"
                    ariaLabel="Review body"
                    placeholder="Start writing…"
                  />
                )
              ) : (
                score && (
                  <div>
                    {/* 总分行 —— 星级与加权分是本地算出来的，锁定不可改 */}
                    <div className="mb-lg rounded-lg border border-border-subtle bg-surface-canvas p-md">
                      <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
                        Overall score
                      </span>
                      <div className="flex flex-wrap items-baseline gap-2">
                        <span className="font-display-md text-display-md text-text-primary">
                          {score.total.toFixed(2)}
                        </span>
                        <span className="font-body-md text-body-md text-text-muted">
                          / 5
                        </span>
                        <span
                          className={`ml-2 inline-block rounded-full px-3 py-1 font-label-md text-label-md text-on-primary ${
                            score.total >= 4.5
                              ? "bg-emerald-600"
                              : score.total >= 3.5
                                ? "bg-blue-600"
                                : score.total >= 2.5
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                          }`}
                        >
                          {score.grade} · {score.gradeLabel}
                        </span>
                      </div>
                      <div className="mt-1 font-body-sm text-body-sm text-text-muted">
                        {Math.round(score.percent)}% of max · Weight total:{" "}
                        {score.weightSum}%
                      </div>
                    </div>

                    <div className="mb-lg overflow-x-auto rounded-lg border border-border-subtle">
                      <table className="w-full text-left">
                        <thead>
                          <tr className="border-b border-border-subtle bg-surface-canvas">
                            <th className="px-4 py-2.5 font-label-md text-label-md uppercase tracking-wider text-text-muted">
                              KRA
                            </th>
                            <th className="px-4 py-2.5 text-center font-label-md text-label-md uppercase tracking-wider text-text-muted">
                              Weight
                            </th>
                            <th className="px-4 py-2.5 text-center font-label-md text-label-md uppercase tracking-wider text-text-muted">
                              Score
                            </th>
                            <th className="px-4 py-2.5 text-center font-label-md text-label-md uppercase tracking-wider text-text-muted">
                              Weighted
                            </th>
                            <th className="px-4 py-2.5 font-label-md text-label-md uppercase tracking-wider text-text-muted">
                              Basis
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {score.items.map((it, i) => (
                            <tr
                              key={i}
                              className="border-b border-border-subtle last:border-0"
                            >
                              <td className="px-4 py-3">
                                <div className="font-title-sm text-title-sm text-text-primary">
                                  {it.name}
                                </div>
                                {it.goalCompletion != null && (
                                  <div className="font-label-sm text-label-sm text-text-muted">
                                    Goal: {it.goalCompletion}%
                                  </div>
                                )}
                              </td>
                              <td className="px-4 py-3 text-center font-body-md text-body-md text-text-primary">
                                {it.weight}%
                              </td>
                              <td className="px-4 py-3 text-center">
                                <div className="text-[16px] tracking-tight text-primary">
                                  {stars(it.score)}
                                </div>
                                <div className="font-label-sm text-label-sm text-text-muted">
                                  {it.score.toFixed(1)} / 5
                                </div>
                              </td>
                              <td className="px-4 py-3 text-center font-title-md text-title-md text-text-primary">
                                {it.weighted.toFixed(2)}
                              </td>
                              <td className="px-4 py-3">
                                <Editable
                                  initialHtml={escapeHtml(it.basis || "")}
                                  onInput={onEdit(`basis-${i}`)}
                                  className="rv-cell font-body-sm text-body-sm text-text-muted"
                                  ariaLabel={`Basis for ${it.name}`}
                                  placeholder="Add a justification…"
                                />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="bg-surface-canvas">
                            <td
                              className="px-4 py-2.5 font-label-md text-label-md text-text-primary"
                              colSpan={3}
                            >
                              TOTAL
                            </td>
                            <td className="px-4 py-2.5 text-center font-title-md text-title-md text-text-primary">
                              {score.total.toFixed(2)}
                            </td>
                            <td className="px-4 py-2.5 font-body-sm text-body-sm text-text-muted">
                              Σ (score × weight) / 100
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>

                    {(
                      [
                        ["Overall Summary", "overall", score.overall],
                        ["Key Strengths", "strengths", score.strengths],
                        ["Areas for Growth", "growth", score.growth],
                        ["Next Steps", "nextSteps", score.nextSteps],
                      ] as const
                    ).map(([heading, key, body]) => (
                      <div key={key} className="mb-md">
                        <h3 className="mb-xs font-title-md text-title-md text-text-primary">
                          {heading}
                        </h3>
                        <Editable
                          initialHtml={textToBlocks(body)}
                          onInput={onEdit(key)}
                          className="rv-doc font-body-sm text-body-sm text-text-muted"
                          ariaLabel={heading}
                          placeholder="Write here…"
                        />
                      </div>
                    ))}

                    {/* 免责声明（仅供打印）：scored 模式的正文是结构化表格，声明只存在于
                        scoreDocToText() 的文本序列化里 —— Word / 复制 / 历史 都有，但 DOM 里
                        没有。而打印样式是 body * {visibility:hidden} + 仅 #print-area 放行，
                        所以 PDF 导出会把整段声明丢掉（narrative 因为正文里带着它，没这个问题）。
                        这里补一份 print-only 副本：屏幕上 display:none，不改变任何观感。
                        它不在可编辑单元格内，因此不会重复进入 Word 导出或历史。
                        措辞取自 lib/export.ts 的 DISCLAIMER_LINE，避免字面量漂移。 */}
                    <p className="print-only mt-lg font-label-sm text-label-sm text-text-muted">
                      {DISCLAIMER_LINE}
                    </p>
                  </div>
                )
              )}
            </div>

            <p className="mt-md font-body-sm text-body-sm text-text-muted">
              Click any text to edit it — your changes are saved automatically to
              your history, which is stored in this browser
              {user
                ? ""
                : ". Sign in to view your saved drafts and raise your daily allowance"}
              . The PDF export includes the {WATERMARK_LINE.replace("Generated by ", "")} watermark.
            </p>
          </>
        )}
      </div>
    </main>
  );
}
