"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Check, Copy, Pencil, RefreshCw } from "lucide-react";
import { downloadPDF, downloadWord, WATERMARK_LINE } from "../lib/export";
import { saveHistory } from "../lib/history";
import { useAuth } from "./auth/AuthContext";

type ReviewType = "self" | "manager" | "peer" | "360";
type Tone = "Formal" | "Encouraging" | "Direct";

/** Stages shown to the user while the AI is streaming a draft. */
const PROGRESS_PHASES: { at: number; label: string }[] = [
  { at: 0, label: "Reading your inputs…" },
  { at: 8, label: "Drafting the opening…" },
  { at: 30, label: "Expanding on strengths…" },
  { at: 55, label: "Adding growth areas…" },
  { at: 80, label: "Polishing the tone…" },
  { at: 95, label: "Almost done…" },
];
const ESTIMATED_CHARS = 3600;

function phaseFor(pct: number): string {
  let label = PROGRESS_PHASES[0].label;
  for (const p of PROGRESS_PHASES) {
    if (pct >= p.at) label = p.label;
  }
  return label;
}

/**
 * Renders the streamed report so that part headings (e.g. "1. Basic Overview")
 * become bold sub-headings instead of plain text lines.
 */
function renderReport(text: string): ReactNode {
  const lines = text.split("\n");
  return lines.map((line, i) => {
    const t = line.trim();
    const m = t.match(/^(\d)\.\s+(.+)/);
    if (m && t.length < 80) {
      return (
        <div key={i} style={{ marginTop: 16, marginBottom: 6 }}>
          <h3
            className="font-title-md text-title-md text-text-primary"
            style={{ fontWeight: 700, margin: 0 }}
          >
            {t}
          </h3>
        </div>
      );
    }
    if (t === "") return <div key={i} style={{ height: 8 }} />;
    return (
      <p
        key={i}
        className="font-body-md text-body-md text-text-primary"
        style={{ margin: 0, marginBottom: 8, lineHeight: 1.7 }}
      >
        {line}
      </p>
    );
  });
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
  const [strengths, setStrengths] = useState<string[]>([]);
  const [freeNote, setFreeNote] = useState("");
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);
  const [growthNote, setGrowthNote] = useState("");
  const [showGrowthNote, setShowGrowthNote] = useState(false);
  const [tone, setTone] = useState<Tone | null>(null);

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [phase, setPhase] = useState("");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  // 游客点 Generate 被拦时，把向导进度暂存到这里。
  // Google 登录是整页跳转，回来后组件重新挂载，靠这份数据把 4 步填的内容恢复出来。
  const RESUME_KEY = "air:wizardResume";

  const { user, gate, setAuthOpen } = useAuth();

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
          setStrengths(Array.isArray(w.strengths) ? (w.strengths as string[]) : []);
          setFreeNote((w.freeNote as string) ?? "");
          setGrowthAreas(Array.isArray(w.growthAreas) ? (w.growthAreas as string[]) : []);
          setGrowthNote((w.growthNote as string) ?? "");
          setShowGrowthNote(Boolean(w.showGrowthNote));
          setTone((w.tone as Tone) ?? null);
          setResult("");
          setError("");
          setEditing(false);
          setLoading(false);
          setProgress(0);
          setPhase("");
          return;
        }
      }
    } catch {
      // 快照损坏 → 走默认重置
    }
    setStep(1);
    setReviewType(defaultFormat);
    setResult("");
    setError("");
    setEditing(false);
    setLoading(false);
    setIsCustomJobTitle(false);
    setJobTitle("");
    setEmployeeName("");
    setGrowthNote("");
    setShowGrowthNote(false);
    setProgress(0);
    setPhase("");
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
    setProgress(0);
    setPhase(PROGRESS_PHASES[0].label);
    if (editing) setEditing(false);
    const finalStrengths = freeNote.trim()
      ? [...strengths, freeNote.trim()]
      : strengths;
    const finalGrowth = growthNote.trim()
      ? [...growthAreas, growthNote.trim()]
      : growthAreas;

    // Smooth fake-progress tick while we wait for the first stream chunk.
    // Keeps the bar moving at ~3.5%/s and stops the moment real characters arrive.
    let fakeTimer: ReturnType<typeof setInterval> | null = null;
    let firstChunkSeen = false;
    fakeTimer = setInterval(() => {
      if (firstChunkSeen) return;
      setProgress((p) => {
        if (p >= 12) return p;
        const next = Math.min(12, p + 1.5);
        setPhase(phaseFor(next));
        return next;
      });
    }, 350);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType,
          employeeName: employeeName.trim() || undefined,
          jobTitle,
          tenure,
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
        // Progress driven by chars streamed vs. soft estimate.
        const pct = Math.min(99, Math.round((acc.length / ESTIMATED_CHARS) * 100));
        setProgress(pct);
        setPhase(phaseFor(pct));
      }
      setProgress(100);
      setPhase("Done");
      if (fakeTimer) clearInterval(fakeTimer);
      setLoading(false);
      setStep(5);
      // 存进历史（游客写 guest 桶，登录后自动并到用户桶 —— 见 lib/history.ts）
      saveHistory(user?.id || "guest", {
        kind: "narrative",
        title: [jobTitle || reviewType, employeeName].filter(Boolean).join(" — "),
        content: acc,
      });
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
      if (fakeTimer) clearInterval(fakeTimer);
    }
  }

  async function handleCopy() {
    try {
      // 剪贴板加不了视觉水印，但追加一行署名：既是品牌痕迹，也方便溯源
      await navigator.clipboard.writeText(`${result}\n\n— ${WATERMARK_LINE}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {}
  }

  function startEdit() {
    setDraft(result);
    setEditing(true);
  }
  function saveEdit() {
    setResult(draft);
    setEditing(false);
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
          {/* Progress segments */}
          {step < 5 && (
            <div className="mb-lg">
              <div className="flex gap-2xs">
                {[1, 2, 3, 4].map((s) => (
                  <div
                    key={s}
                    className={`h-1 flex-1 rounded-full ${
                      step >= s ? "bg-primary-container" : "bg-border-subtle"
                    }`}
                    onClick={() => s < step && setStep(s)}
                    style={{ cursor: s < step ? "pointer" : "default" }}
                  />
                ))}
              </div>
            </div>
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
                  {/* Phase + percentage row */}
                  <div className="flex items-center justify-between mb-sm">
                    <div className="flex items-center gap-xs">
                      <RefreshCw size={14} className="animate-spin text-text-muted" />
                      <span className="font-label-md text-label-md text-text-primary">
                        {phase || PROGRESS_PHASES[0].label}
                      </span>
                    </div>
                    <span className="font-label-md text-label-md text-text-muted tabular-nums">
                      {Math.round(progress)}%
                    </span>
                  </div>
                  {/* Progress bar */}
                  <div
                    className="h-1.5 w-full rounded-full overflow-hidden mb-lg"
                    style={{ background: "var(--border-subtle, #e5e7eb)" }}
                    role="progressbar"
                    aria-valuenow={Math.round(progress)}
                    aria-valuemin={0}
                    aria-valuemax={100}
                  >
                    <div
                      className="h-full rounded-full transition-[width] duration-300 ease-out"
                      style={{
                        width: `${Math.max(2, Math.min(100, progress))}%`,
                        background: "var(--primary-container, #6366f1)",
                      }}
                    />
                  </div>
                  <div className="skeleton lg" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton lg" />
                  <div className="skeleton" />
                  <div className="font-body-sm text-body-sm text-text-muted mt-md">
                    Streaming your performance review… you can close this and come back; we'll keep going.
                  </div>
                </div>
              ) : editing ? (
                <div>
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    className="w-full min-h-[320px] px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-y"
                    style={{ fontSize: 15, lineHeight: 1.7 }}
                  />
                  <div className="mt-md">
                    <button
                      className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors"
                      onClick={saveEdit}
                      type="button"
                    >
                      <Check size={16} /> <span>Save</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  {renderReport(result)}
                </div>
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

              {!loading && !error && result && (
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

              {!loading && !error && (
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
                    onClick={startEdit}
                    type="button"
                  >
                    <Pencil size={16} /> <span>Edit</span>
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
                      downloadWord(result)
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
