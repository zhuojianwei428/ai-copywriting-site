"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Copy, RefreshCw } from "lucide-react";
import {
  downloadPDF,
  downloadWordFromHtml,
  WATERMARK_LINE,
  DISCLAIMER_LINE,
} from "../lib/export";
import { evalTableToHtml } from "../lib/reportHtml";
import { saveHistory } from "../lib/history";
import { defaultDocTitle, putReviewDoc } from "../lib/reviewDoc";
import {
  computeProgress,
  progressSections,
  type ProgressState,
} from "../lib/reportProgress";
import {
  parseEvalStream,
  evalTableToText,
  type EvalTable,
} from "../lib/evalTable";
import FishboneSteps from "./FishboneSteps";
import GenerationProgress from "./GenerationProgress";
import A4EvaluationTable from "./A4EvaluationTable";
import { useAuth } from "./auth/AuthContext";

type ReviewType = "self" | "manager" | "peer" | "360";
type Tone = "Formal" | "Encouraging" | "Direct";

/** 导出文件名用（与 ReviewEditor 的 slug 保持一致） */
function slug(s: string): string {
  const base = (s || "performance-review")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
  return base || "performance-review";
}

/** 向导的 4 步，鱼骨步骤标签直接用它 */
const WIZARD_STEPS = ["Format", "Role & Level", "Inputs", "Draft"];

/** 生成中面板的初始值 */
function initialProgress(reviewType: string): ProgressState {
  const total = progressSections(reviewType).length;
  return {
    completed: 0,
    total,
    activeIndex: 0,
    label: progressSections(reviewType)[0],
    percent: 0,
    degraded: false,
    chars: 0,
  };
}

/**
 * 判断流式结果是否完整（A4 表格版）。
 *
 * 上游偶发把正文截断在句子中间（推理 token 挤占 max_tokens 预算），此时缺维度行
 * 或缺总结块。命中任一特征就自动重跑一次。
 */
function isIncompleteTable(t: EvalTable): boolean {
  if (t.rowsSeen < t.rows.length) return true;
  return !(t.overall && t.strengths && t.improvements && t.nextSteps);
}

const REVIEW_TYPES = [
  { id: "self", title: "Self Review", desc: "Reviewing my own performance" },
  { id: "manager", title: "Manager Review", desc: "Reviewing a direct report" },
  { id: "peer", title: "Peer Review", desc: "Reviewing a colleague" },
  { id: "360", title: "360° Feedback", desc: "Collecting input from multiple people" },
] as const;

const TENURES = ["Less than 6 months", "6–12 months", "1–2 years", "2+ years"];
const STRENGTHS = [
  "Exceeded targets", "Strong collaboration", "Took initiative", "Improved a process",
  "Mentored others", "Delivered on time", "Solved a hard problem", "Clear communication",
  "Adaptable to change", "Reliable ownership",
];
const GROWTH = [
  "Meeting deadlines", "Delegation", "Technical depth", "Written communication",
  "Cross-team visibility", "Prioritization", "Receiving feedback", "Consistency",
];
const TONES = [
  { id: "Formal", desc: "Neutral and professional" },
  { id: "Encouraging", desc: "Warm and supportive" },
  { id: "Direct", desc: "Blunt and to the point" },
] as const;

const JOB_TITLE_PRESETS = [
  "Software Engineer",
  "Senior Software Engineer",
  "Staff Engineer",
  "Engineering Manager",
  "Product Manager",
  "Senior Product Manager",
  "Product Designer",
  "Senior Product Designer",
  "UX Designer",
  "UI Designer",
  "Design Lead",
  "Data Analyst",
  "Data Scientist",
  "Data Engineer",
  "Marketing Manager",
  "Content Marketer",
  "Growth Marketer",
  "SEO Specialist",
  "Sales Manager",
  "Account Executive",
  "Customer Success Manager",
  "Operations Manager",
  "Project Manager",
  "Program Manager",
  "HR Manager",
  "Recruiter",
  "Finance Analyst",
  "Accountant",
  "Customer Support Specialist",
  "QA Engineer",
  "DevOps Engineer",
  "Security Engineer",
  "Solutions Architect",
  "Technical Writer",
  "Researcher",
  "Other (type your own)",
];

const STEPS = ["Format", "Role & Level", "Inputs", "Draft"];

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function GeneratorModal({
  open,
  defaultFormat,
  onClose,
}: {
  open: boolean;
  defaultFormat: ReviewType;
  onClose: () => void;
}) {
  const [step, setStep] = useState<number>(1);
  const [reviewType, setReviewType] = useState<ReviewType | null>(defaultFormat);
  const [employeeName, setEmployeeName] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomJobTitle, setIsCustomJobTitle] = useState(false);
  const [tenure, setTenure] = useState<string | null>(null);
  const [cycle, setCycle] = useState("");
  const [strengths, setStrengths] = useState<string[]>([]);
  const [freeNote, setFreeNote] = useState("");
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);
  const [growthNote, setGrowthNote] = useState("");
  const [showGrowthNote, setShowGrowthNote] = useState(false);
  const [tone, setTone] = useState<Tone | null>(null);

  const [loading, setLoading] = useState(false);
  /** 生成中的分段进度 —— 由流里已解析出的维度行驱动，见 lib/reportProgress.ts */
  const [prog, setProg] = useState<ProgressState>(() => initialProgress(defaultFormat));
  /** 生成结果的纯文本（用于复制 / 历史 / 降级 Word）；结构化表格见 table */
  const [result, setResult] = useState("");
  /** 生成结果的结构化 A4 表格（渲染 + 编辑 + 导出） */
  const [table, setTable] = useState<EvalTable | null>(null);
  const [error, setError] = useState("");

  const [copied, setCopied] = useState(false);
  /** 本轮的自动重试次数（最多 1 次，防止失败时无限重跑烧额度） */
  const retriedRef = useRef(0);

  // 游客点 Generate 被拦时，把向导进度暂存到这里。
  // Google 登录是整页跳转，回来后组件重新挂载，靠这份数据把 4 步填的内容恢复出来。
  const RESUME_KEY = "air:wizardResume";

  const { user, gate, setAuthOpen } = useAuth();
  const router = useRouter();

  // Open with default reset; 但若存在"被登录拦下前的向导快照"（Google 回跳场景），优先恢复快照
  useEffect(() => {
    if (!open) return;
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (raw) {
        sessionStorage.removeItem(RESUME_KEY);
        const w = JSON.parse(raw) as Record<string, unknown> | null;
        if (w && typeof w.step === "number" && w.step >= 1 && w.step <= 4) {
          setStep(w.step);
          setReviewType((w.reviewType as ReviewType) ?? defaultFormat);
          setEmployeeName((w.employeeName as string) ?? "");
          setJobTitle((w.jobTitle as string) ?? "");
          setIsCustomJobTitle(Boolean(w.isCustomJobTitle));
          setTenure((w.tenure as string | null) ?? null);
          setCycle((w.cycle as string) ?? "");
          setStrengths(Array.isArray(w.strengths) ? (w.strengths as string[]) : []);
          setFreeNote((w.freeNote as string) ?? "");
          setGrowthAreas(Array.isArray(w.growthAreas) ? (w.growthAreas as string[]) : []);
          setGrowthNote((w.growthNote as string) ?? "");
          setShowGrowthNote(Boolean(w.showGrowthNote));
          setTone((w.tone as Tone) ?? null);
          setResult("");
          setTable(null);
          setError("");
          setLoading(false);
          setProg(initialProgress((w.reviewType as ReviewType) ?? defaultFormat));
          return;
        }
      }
    } catch {
      // 快照损坏 → 走默认重置
    }
    setStep(1);
    setReviewType(defaultFormat);
    setResult("");
    setTable(null);
    setError("");
    setLoading(false);
    setIsCustomJobTitle(false);
    setJobTitle("");
    setEmployeeName("");
    setCycle("");
    setGrowthNote("");
    setShowGrowthNote(false);
    setProg(initialProgress(defaultFormat));
  }, [open, defaultFormat]);

  // Lock body scroll + close on Escape
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  /**
   * 把当前向导进度存进 sessionStorage。
   * 只在"马上要弹登录框"时调用 —— Google 登录是整页跳转，
   * 回来后组件重新挂载，靠这份快照把 4 步填的内容恢复出来。
   */
  function saveSnapshot() {
    try {
      sessionStorage.setItem(
        RESUME_KEY,
        JSON.stringify({
          step,
          reviewType,
          employeeName,
          jobTitle,
          isCustomJobTitle,
          tenure,
          cycle,
          strengths,
          freeNote,
          growthAreas,
          growthNote,
          showGrowthNote,
          tone,
        })
      );
    } catch {
      // sessionStorage 不可用（无痕等）→ 跳页回来只能重新填
    }
  }

  async function handleGenerate() {
    if (!reviewType || !tone) {
      setError("Please choose a review type and a tone before generating.");
      return;
    }
    // 生成对游客开放：直接发请求。只有服务端判定额度用尽 / 会话失效时，
    // 才在 runGenerate 里拦下来引导登录。
    retriedRef.current = 0; // 用户主动发起 → 重置重试额度
    void runGenerate();
  }

  async function runGenerate() {
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      // ignore
    }
    if (!reviewType || !tone) return;
    setLoading(true);
    setError("");
    setResult("");
    setTable(null);
    setProg(initialProgress(reviewType));
    setStep(5); // 进结果视图：显示分段进度 + 边生成边显示表格
    const finalStrengths = freeNote.trim()
      ? [...strengths, freeNote.trim()]
      : strengths;
    const finalGrowth = growthNote.trim()
      ? [...growthAreas, growthNote.trim()]
      : growthAreas;

    // 首个 chunk 到来前（排队 + 模型推理，这段可能占掉大半等待时间）让进度条缓慢爬动，
    // 否则用户面对的是一条完全静止的 0%。上限压在 4%，远低于第一段真实结束的位置（≈17%），
    // 不用假进度去抢真实信号的活。
    let fakeTimer: ReturnType<typeof setInterval> | null = null;
    let firstChunkSeen = false;
    fakeTimer = setInterval(() => {
      if (firstChunkSeen) return;
      setProg((p) => (p.percent >= 4 ? p : { ...p, percent: Math.min(4, p.percent + 0.6) }));
    }, 400);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType,
          employeeName: employeeName.trim() || undefined,
          jobTitle,
          tenure,
          cycle: cycle.trim() || undefined,
          strengths: finalStrengths,
          growthAreas: finalGrowth,
          tone,
        }),
      });
      if (!res.ok || !res.body) {
        let payload: any = null;
        try {
          payload = await res.json();
        } catch {}
        const msg0 =
          payload?.error || "Something went wrong. Please try again.";

        // 游客免费额度用尽 / 会话失效 → 弹登录框，登录成功后自动重试本次生成
        const needsSignIn =
          res.status === 401 ||
          (res.status === 429 && payload?.code === "quota_exceeded");
        if (needsSignIn && !user) {
          saveSnapshot();
          setLoading(false);
          setError("");
          if (fakeTimer) clearInterval(fakeTimer);
          gate(
            () => {
              void runGenerate();
            },
            `generator:${reviewType}`
          );
          return;
        }

        setError(
          res.status === 401
            ? "Please sign in to generate your review."
            : msg0
        );
        if (res.status === 401) setAuthOpen(true);
        setLoading(false);
        if (fakeTimer) clearInterval(fakeTimer);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        firstChunkSeen = true;
        if (fakeTimer) {
          clearInterval(fakeTimer);
          fakeTimer = null;
        }
        setResult(acc);
        // 真进度：从流里已解析出的维度行推算走到第几段（不再按字符数估算）
        setProg(computeProgress(acc, reviewType));
        // 边生成边渲染表格（半截流安全：未闭合的最后一行会被解析器丢弃）
        setTable(
          parseEvalStream(acc, reviewType, {
            employeeName,
            jobTitle,
            cycle: cycle.trim() || undefined,
          })
        );
      }
      setProg((p) => ({
        ...p,
        completed: progressSections(reviewType).length,
        percent: 100,
        label: "Finishing up",
      }));
      if (fakeTimer) clearInterval(fakeTimer);
      setLoading(false);

      // 完整性校验：缺维度行或缺总结块 → 静默重跑一次（只重试 1 次，避免烧额度）
      const finalTable = parseEvalStream(acc, reviewType, {
        employeeName,
        jobTitle,
        cycle: cycle.trim() || undefined,
      });
      if (isIncompleteTable(finalTable) && retriedRef.current < 1) {
        retriedRef.current += 1;
        setResult("");
        setTable(null);
        await runGenerate();
        return;
      }
      retriedRef.current = 0;

      // 生成完成 → 存一份历史，然后把内容交接给结果编辑页
      // （用户在编辑页里改完再导出 PDF / Word，见 app/review/page.tsx）
      const scope = user?.id || "guest";
      const docTitle = defaultDocTitle({ reviewType, jobTitle, employeeName, cycle });
      // 纯文本序列化带免责声明，作为历史正文 / 复制 / 降级 Word 的底本；
      // 结构化表格单独存进 table，供编辑页渲染与 Word 导出。
      const docText = `${evalTableToText(finalTable)}\n\n${DISCLAIMER_LINE}`;
      const item = saveHistory(scope, {
        kind: "narrative",
        title: docTitle,
        content: docText,
        data: finalTable,
      });
      putReviewDoc({
        kind: "narrative",
        title: docTitle,
        text: docText,
        table: finalTable,
        createdAt: Date.now(),
        historyId: item.id,
        scope,
      });
      onClose();
      router.push("/review");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      if (fakeTimer) clearInterval(fakeTimer);
    }
  }

  async function handleCopy() {
    try {
      // 剪贴板加不了视觉水印，但追加署名与免责声明：
      // 复制出去的内容同样会被当成正式评估用，声明不能留在页面上。
      const body = table ? evalTableToText(table) : result;
      await navigator.clipboard.writeText(
        `${body}\n\n${DISCLAIMER_LINE}\n\n— ${WATERMARK_LINE}`
      );
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start sm:items-center justify-center p-4 overflow-y-auto"
      style={{ background: "rgba(11,14,40,0.4)" }}
      onClick={onClose}
    >
      <div
        className="bg-surface-card border border-border-subtle rounded-xl shadow-modal w-full max-w-3xl my-8 max-h-[92vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="sticky top-0 z-10 bg-surface-card border-b border-border-subtle px-lg py-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
              AI Performance Review Generator
            </span>
            <span className="font-title-md text-title-md text-text-primary">
              {step < 5 ? `Step ${step} of 4 · ${STEPS[step - 1]}` : "Your review"}
            </span>
          </div>
            <button
            onClick={onClose}
            className="w-9 h-9 rounded-lg border border-border-subtle flex items-center justify-center text-text-muted hover:bg-surface-canvas transition-colors"
            aria-label="Close"
            type="button"
          >
            <span className="material-symbols-outlined text-[18px]">close</span>
          </button>
        </div>

        <div className="p-lg lg:p-xl">
          {/* 鱼骨式步骤标签 */}
          {step < 5 && (
            <FishboneSteps
              steps={WIZARD_STEPS}
              current={step - 1}
              onJump={(i) => setStep(i + 1)}
              className="mb-md"
            />
          )}

          {/* ===================== STEP 1: FORMAT ===================== */}
          {step === 1 && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-md" style={{ marginTop: 0 }}>
                What type of review are you writing?
              </h2>
              <div className="grid sm:grid-cols-2 gap-md">
                {REVIEW_TYPES.map((t) => {
                  const active = reviewType === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setReviewType(t.id as ReviewType)}
                      className={`text-left p-lg rounded-lg flex flex-col justify-between h-full transition-all ${
                        active
                          ? "border-2 border-text-primary bg-surface-canvas"
                          : "border border-border-subtle bg-surface-card hover:border-border-strong"
                      }`}
                      type="button"
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-title-md text-title-md text-text-primary">
                          {t.title}
                        </span>
                        <span
                          className={`w-4 h-4 rounded-full flex items-center justify-center ${
                            active
                              ? "border-2 border-primary-container"
                              : "border border-border-strong"
                          }`}
                        >
                          <span
                            className={`w-2 h-2 rounded-full ${
                              active ? "bg-primary-container" : "bg-transparent"
                            }`}
                          />
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-muted leading-relaxed mt-xs">
                        {t.desc}
                      </p>
                    </button>
                  );
                })}
              </div>
              <div className="mt-lg">
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2 w-full sm:w-auto disabled:opacity-50"
                  disabled={!reviewType}
                  onClick={() => setStep(2)}
                  type="button"
                >
                  <span>Continue to Step 2: Role &amp; Level</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 2: ROLE & LEVEL ===================== */}
          {step === 2 && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-md" style={{ marginTop: 0 }}>
                Tell us about the role
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-md" style={{ marginTop: "-4px" }}>
                Optional, but it makes the review far more specific.
              </p>
              <label className="block font-title-md text-title-md text-text-primary mb-xs">
                {reviewType === "self"
                  ? "Your name (optional)"
                  : "Employee name (optional)"}
              </label>
              <input
                type="text"
                value={employeeName}
                onChange={(e) => setEmployeeName(e.target.value)}
                placeholder={
                  reviewType === "self"
                    ? "e.g. Alex Chen"
                    : "e.g. Jordan Rivera"
                }
                className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container mb-lg"
                style={{ fontSize: 14 }}
              />
              <label className="block font-title-md text-title-md text-text-primary mb-xs">
                Job title
              </label>
              {!isCustomJobTitle ? (
                <select
                  value={jobTitle}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === "__custom__") {
                      setIsCustomJobTitle(true);
                      setJobTitle("");
                    } else {
                      setJobTitle(v);
                    }
                  }}
                  className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container mb-lg"
                  style={{ fontSize: 14 }}
                >
                  <option value="">Select a job title…</option>
                  {JOB_TITLE_PRESETS.map((t) => (
                    <option key={t} value={t === "Other (type your own)" ? "__custom__" : t}>
                      {t}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="mb-lg">
                  <input
                    type="text"
                    value={jobTitle}
                    onChange={(e) => setJobTitle(e.target.value)}
                    placeholder="e.g. Senior Marketing Manager"
                    className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container"
                    style={{ fontSize: 14 }}
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomJobTitle(false);
                      setJobTitle("");
                    }}
                    className="mt-xs font-label-sm text-label-sm text-text-muted hover:text-text-primary"
                  >
                    ← Back to preset list
                  </button>
                </div>
              )}
              <label className="block font-title-md text-title-md text-text-primary mb-sm">
                Time in this role
              </label>
              <div className="flex flex-wrap gap-sm mb-lg">
                {TENURES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setTenure(t)}
                    className={`px-4 py-2 rounded border text-body-md ${
                      tenure === t
                        ? "border-primary-container bg-surface-canvas text-text-primary"
                        : "border-border-subtle bg-surface-card text-text-primary hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    {t}
                  </button>
                ))}
              </div>
              <label className="block font-title-md text-title-md text-text-primary mb-xs">
                Review period (optional)
              </label>
              <input
                type="text"
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                placeholder="e.g. 2026 Q3 Review"
                className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container mb-lg"
                style={{ fontSize: 14 }}
              />
              <div className="flex flex-col sm:flex-row gap-sm">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => setStep(1)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back</span>
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1"
                  onClick={() => setStep(3)}
                  type="button"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
                <button
                  className="inline-flex items-center justify-center px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => setStep(3)}
                  type="button"
                >
                  Skip this step
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 3: INPUTS ===================== */}
          {step === 3 && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-md" style={{ marginTop: 0 }}>
                What went well?
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-md" style={{ marginTop: "-4px" }}>
                Select everything that applies. The more you pick, the better
                the output.
              </p>
              <div className="flex flex-wrap gap-sm mb-lg">
                {STRENGTHS.map((s) => (
                  <button
                    key={s}
                    onClick={() => setStrengths((p) => toggle(p, s))}
                    className={`px-4 py-2 rounded border text-body-md ${
                      strengths.includes(s)
                        ? "border-primary-container bg-surface-canvas text-text-primary"
                        : "border-border-subtle bg-surface-card text-text-primary hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    {s}
                  </button>
                ))}
              </div>
              <label className="block font-title-md text-title-md text-text-primary mb-xs">
                Anything else? Add specific numbers or projects.
              </label>
              <textarea
                value={freeNote}
                onChange={(e) => setFreeNote(e.target.value)}
                placeholder="e.g. Led the Q2 checkout rebuild, cut cart abandonment by 18%"
                className="w-full min-h-[90px] px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-y"
                style={{ fontSize: 14 }}
              />
              <div className="flex gap-sm mt-lg">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => setStep(2)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back</span>
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1"
                  onClick={() => setStep(4)}
                  type="button"
                >
                  <span>Continue</span>
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== STEP 4: TONE ===================== */}
          {step === 4 && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-md" style={{ marginTop: 0 }}>
                Any areas for growth?
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-md" style={{ marginTop: "-4px" }}>
                Choose a tone — this is the last step.
              </p>
              <div className="flex flex-wrap gap-sm mb-lg">
                {GROWTH.map((g) => (
                  <button
                    key={g}
                    onClick={() => setGrowthAreas((p) => toggle(p, g))}
                    className={`px-4 py-2 rounded border text-body-md ${
                      growthAreas.includes(g)
                        ? "border-primary-container bg-surface-canvas text-text-primary"
                        : "border-border-subtle bg-surface-card text-text-primary hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    {g}
                  </button>
                ))}
                <button
                  onClick={() => setShowGrowthNote((v) => !v)}
                  className={`px-4 py-2 rounded border text-body-md ${
                    showGrowthNote
                      ? "border-primary-container bg-surface-canvas text-text-primary"
                      : "border-border-subtle bg-surface-card text-text-primary hover:border-border-strong"
                  }`}
                  type="button"
                >
                  Other
                </button>
              </div>
              {showGrowthNote && (
                <label className="block mb-lg">
                  <span className="font-title-md text-title-md text-text-primary mb-xs block">
                    Anything else?
                  </span>
                  <textarea
                    value={growthNote}
                    onChange={(e) => setGrowthNote(e.target.value)}
                    placeholder="e.g. Needs to improve public speaking and data storytelling"
                    className="w-full min-h-[70px] px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-y"
                    style={{ fontSize: 14 }}
                  />
                </label>
              )}
              <label className="block font-title-md text-title-md text-text-primary mb-sm">
                Tone
              </label>
              <div className="grid gap-md">
                {TONES.map((t) => {
                  const active = tone === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setTone(t.id as Tone)}
                      className={`text-left p-lg rounded-lg flex items-start gap-sm transition-all ${
                        active
                          ? "border-2 border-text-primary bg-surface-canvas"
                          : "border border-border-subtle bg-surface-card hover:border-border-strong"
                      }`}
                      type="button"
                    >
                      <span
                        className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${
                          active
                            ? "border-2 border-primary-container"
                            : "border border-border-strong"
                        }`}
                      >
                        <span
                          className={`w-2 h-2 rounded-full ${
                            active ? "bg-primary-container" : "bg-transparent"
                          }`}
                        />
                      </span>
                      <span>
                        <span className="block font-title-md text-title-md text-text-primary">
                          {t.id}
                        </span>
                        <span className="block font-body-sm text-body-sm text-text-muted">
                          {t.desc}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="flex gap-sm mt-lg">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => setStep(3)}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  <span>Back</span>
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1 disabled:opacity-50"
                  disabled={!tone || loading}
                  onClick={handleGenerate}
                  type="button"
                >
                  <span>Generate My Review</span>
                  <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
                </button>
              </div>
            </div>
          )}

          {/* ===================== RESULT (step 5) ===================== */}
          {step === 5 && (
            <div id="print-area">
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-md" style={{ marginTop: 0 }}>
                Your performance review
              </h2>
              {loading ? (
                <div>
                  <GenerationProgress
                    sections={progressSections(reviewType || "manager")}
                    completed={prog.completed}
                    label={prog.label}
                    percent={prog.percent}
                    degraded={prog.degraded}
                    notice={
                      retriedRef.current > 0
                        ? "The first draft came back incomplete, so we're regenerating the full table. This restarts the progress above."
                        : undefined
                    }
                    hint="Streaming your evaluation table — we'll open it in the editor when it's done."
                  />
                  {/* 表格边生成边显示；首个字符到来前先用骨架屏占位 */}
                  <div className="mt-lg">
                    {table ? (
                      <A4EvaluationTable
                        table={table}
                        title={defaultDocTitle({ reviewType: reviewType || "manager", jobTitle, employeeName, cycle })}
                      />
                    ) : (
                      <>
                        <div className="skeleton lg" />
                        <div className="skeleton" />
                        <div className="skeleton" />
                        <div className="skeleton lg" />
                        <div className="skeleton" />
                      </>
                    )}
                  </div>
                </div>
              ) : (
                table && (
                  <A4EvaluationTable
                    table={table}
                    title={defaultDocTitle({ reviewType: reviewType || "manager", jobTitle, employeeName, cycle })}
                  />
                )
              )}

              {error && (
                <div
                  className="mt-md p-md rounded border bg-surface-canvas"
                  style={{ borderColor: "var(--border-subtle)" }}
                >
                  <span className="font-body-md text-body-md text-text-primary">{error}</span>
                  <div className="mt-sm">
                    <button
                      className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                      onClick={handleGenerate}
                      type="button"
                    >
                      <RefreshCw size={16} /> <span>Retry</span>
                    </button>
                  </div>
                </div>
              )}

              {!loading && !error && table && (
                <div
                  className="mt-lg p-md rounded border border-dashed"
                  style={{
                    borderColor: "var(--border-strong)",
                    background: "var(--surface-canvas)",
                  }}
                >
                  <span
                    className="font-body-sm text-body-sm text-text-muted leading-relaxed"
                    style={{ color: "var(--text-muted)" }}
                  >
                    AI-generated draft. Review and edit before use. Not a
                    substitute for HR, legal, or employment advice.
                  </span>
                </div>
              )}

              {!loading && !error && table && (
                <div className="flex flex-wrap gap-sm mt-lg">
                  <button
                    className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                    onClick={handleCopy}
                    type="button"
                  >
                    <Copy size={16} /> <span>{copied ? "Copied" : "Copy"}</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                    onClick={handleGenerate}
                    type="button"
                  >
                    <RefreshCw size={16} /> <span>Regenerate</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                    onClick={() => downloadPDF()}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Export PDF</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                    onClick={() =>
                      downloadWordFromHtml(
                        evalTableToHtml(table),
                        slug(defaultDocTitle({ reviewType: reviewType || "manager", jobTitle, employeeName, cycle }))
                      )
                    }
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">description</span>
                    <span>Export Word</span>
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
