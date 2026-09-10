"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { downloadPDF, downloadWord, WATERMARK_LINE } from "../lib/export";
import { saveHistory } from "../lib/history";
import { putReviewDoc, scoreDocToText, type ScoreDoc } from "../lib/reviewDoc";
import { weightError, type KraInput, type ScoredKra } from "../lib/score";
import { useAuth } from "./auth/AuthContext";

type ReviewType = "self" | "manager" | "peer" | "360";
type Tone = "Formal" | "Encouraging" | "Direct";

const REVIEW_TYPES: { id: ReviewType; title: string; desc: string }[] = [
  { id: "self", title: "Self Review", desc: "Scoring my own KRAs" },
  { id: "manager", title: "Manager Review", desc: "Scoring a direct report" },
  { id: "peer", title: "Peer Review", desc: "Scoring a colleague" },
  { id: "360", title: "360° Feedback", desc: "Multi-source perspective" },
];
const TONES: { id: Tone; desc: string }[] = [
  { id: "Formal", desc: "Neutral and professional" },
  { id: "Encouraging", desc: "Warm and supportive" },
  { id: "Direct", desc: "Blunt and to the point" },
];

const KRA_PRESETS = [
  "Product Delivery",
  "Quality & Craft",
  "Team Collaboration",
  "Technical Growth",
  "Customer Impact",
  "Process Improvement",
];

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

type Step = "context" | "kra" | "notes" | "result";

const STEPS: { id: Step; label: string }[] = [
  { id: "context", label: "Context" },
  { id: "kra", label: "Key Results" },
  { id: "notes", label: "Notes" },
  { id: "result", label: "Scorecard" },
];

function emptyKra(): KraInput {
  return { name: "", weight: 25, goalCompletion: null, evidence: "" };
}

interface ScoreResponse {
  ok: boolean;
  items: ScoredKra[];
  total: number;
  percent: number;
  grade: string;
  gradeLabel: string;
  weightSum: number;
  overall: string;
  strengths: string;
  growth: string;
  nextSteps: string;
  error?: string;
}

export default function ScoreGeneratorModal({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const [step, setStep] = useState<Step>("context");

  const [reviewType, setReviewType] = useState<ReviewType>("manager");
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomJobTitle, setIsCustomJobTitle] = useState(false);
  const [cycle, setCycle] = useState("");
  const [tone, setTone] = useState<Tone>("Formal");

  const [kras, setKras] = useState<KraInput[]>([emptyKra()]);

  const [strengths, setStrengths] = useState("");
  const [growth, setGrowth] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resp, setResp] = useState<ScoreResponse | null>(null);

  // 游客点 Generate 被拦时暂存向导进度；Google 登录整页跳转回来后靠它恢复
  const RESUME_KEY = "air:scoreWizardResume";

  const { user, gate, setAuthOpen } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!open) return;
    // 存在"被登录拦下前的向导快照"（Google 回跳场景）→ 优先恢复
    try {
      const raw = sessionStorage.getItem(RESUME_KEY);
      if (raw) {
        sessionStorage.removeItem(RESUME_KEY);
        const w = JSON.parse(raw) as Record<string, unknown> | null;
        if (w && typeof w.step === "string" && w.step !== "result") {
          setStep(w.step as Step);
          setReviewType((w.reviewType as ReviewType) ?? "manager");
          setJobTitle((w.jobTitle as string) ?? "");
          setIsCustomJobTitle(Boolean(w.isCustomJobTitle));
          setCycle((w.cycle as string) ?? "");
          setTone((w.tone as Tone) ?? "Formal");
          setKras(Array.isArray(w.kras) && w.kras.length ? (w.kras as KraInput[]) : [emptyKra()]);
          setStrengths((w.strengths as string) ?? "");
          setGrowth((w.growth as string) ?? "");
          setError("");
          setLoading(false);
          setResp(null);
          return;
        }
      }
    } catch {
      // 快照损坏 → 走默认重置
    }
    setStep("context");
    setError("");
    setLoading(false);
    setResp(null);
    setKras([emptyKra()]);
    setIsCustomJobTitle(false);
    setJobTitle("");
    setCycle("");
  }, [open]);

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

  const weightSum = useMemo(
    () => kras.reduce((s, k) => s + (Number(k.weight) || 0), 0),
    [kras]
  );

  function updateKra(i: number, patch: Partial<KraInput>) {
    setKras((prev) => prev.map((k, idx) => (idx === i ? { ...k, ...patch } : k)));
  }

  function stepIndex(): number {
    return STEPS.findIndex((s) => s.id === step) + 1;
  }

  function canNextContext(): boolean {
    return Boolean(reviewType && tone);
  }
  function canNextKra(): boolean {
    const filled = kras.filter((k) => k.name.trim());
    if (filled.length === 0) return false;
    return weightError(filled) === null;
  }

  function validateKraBeforeNotes(): string | null {
    const filled = kras.filter((k) => k.name.trim());
    if (filled.length === 0) return "Add at least one KRA with a name.";
    return weightError(filled);
  }

  /**
   * 暂存当前向导进度，只在"马上要弹登录框"时调用 ——
   * Google 登录是整页跳转，回来后靠这份快照恢复已填内容。
   */
  function saveSnapshot() {
    try {
      sessionStorage.setItem(
        RESUME_KEY,
        JSON.stringify({
          step,
          reviewType,
          jobTitle,
          isCustomJobTitle,
          cycle,
          tone,
          kras,
          strengths,
          growth,
        })
      );
    } catch {
      // sessionStorage 不可用 → 跳页回来只能重新填
    }
  }

  async function handleGenerate() {
    const wErr = validateKraBeforeNotes();
    if (wErr) {
      setError(wErr);
      setStep("kra");
      return;
    }
    // 评分对游客开放：直接发请求。额度用尽由 runGenerate 拦下并引导登录。
    void runGenerate();
  }

  async function runGenerate() {
    try {
      sessionStorage.removeItem(RESUME_KEY);
    } catch {
      // ignore
    }
    setLoading(true);
    setError("");
    setResp(null);
    const body = {
      reviewType,
      jobTitle,
      cycle,
      tone,
      kra: kras
        .filter((k) => k.name.trim())
        .map((k) => ({
          name: k.name.trim(),
          weight: Number(k.weight) || 0,
          goalCompletion:
            k.goalCompletion == null || !Number.isFinite(k.goalCompletion)
              ? null
              : Number(k.goalCompletion),
          evidence: k.evidence?.trim() || undefined,
        })),
      strengths: strengths.trim() || undefined,
      growthAreas: growth.trim() || undefined,
    };
    try {
      const res = await fetch("/api/score", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = (await res.json()) as ScoreResponse;
      if (!res.ok || !data.ok) {
        // 游客免费额度用尽 / 会话失效 → 弹登录框，登录成功后自动重试
        const needsSignIn =
          res.status === 401 ||
          (res.status === 429 && (data as any)?.code === "quota_exceeded");
        if (needsSignIn && !user) {
          saveSnapshot();
          setLoading(false);
          setError("");
          gate(
            () => {
              void runGenerate();
            },
            "scored"
          );
          return;
        }
        if (res.status === 401) {
          setError("Please sign in to score your review.");
          setAuthOpen(true);
        } else {
          setError(data?.error || "Something went wrong. Please try again.");
        }
        setLoading(false);
        return;
      }
      setResp(data);
      setLoading(false);
      // 出分后直接交接给结果编辑页：justification 和四个总结段落都能改，
      // 星级 / 权重 / 加权分是本地算出来的，锁定不可改（见 components/ReviewEditor.tsx）
      const sdoc: ScoreDoc = {
        items: data.items,
        total: data.total,
        percent: data.percent,
        grade: data.grade,
        gradeLabel: data.gradeLabel,
        weightSum: data.weightSum,
        overall: data.overall,
        strengths: data.strengths,
        growth: data.growth,
        nextSteps: data.nextSteps,
        reviewType,
        jobTitle: jobTitle || undefined,
        cycle: cycle || undefined,
      };
      const scope = user?.id || "guest";
      const docTitle =
        [jobTitle || reviewType, cycle].filter(Boolean).join(" — ") ||
        "Performance scorecard";
      const item = saveHistory(scope, {
        kind: "scored",
        title: docTitle,
        content: scoreDocToText(sdoc),
        data: sdoc,
      });
      putReviewDoc({
        kind: "scored",
        title: docTitle,
        score: sdoc,
        createdAt: Date.now(),
        historyId: item.id,
        scope,
      });
      onClose();
      router.push("/review");
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  // 历史记录改在 runGenerate 出分那一刻直接写入（连同结构化数据一起），
  // 因为紧接着就会跳到 /review 编辑页，这个组件会被卸载、effect 不会再跑。

  function renderStars(score: number): string {
    // AI returns 1-5 (integer or half). Fill stars up to nearest integer.
    const full = Math.min(5, Math.max(0, Math.round(score)));
    let s = "";
    for (let i = 0; i < 5; i++) s += i < full ? "★" : "☆";
    return s;
  }

  function buildWordText(): string {
    if (!resp) return "";
    const lines: string[] = [];
    lines.push("PERFORMANCE SCORECARD");
    lines.push("");
    lines.push(`Review type: ${reviewType}`);
    lines.push(`Job title: ${jobTitle || "N/A"}`);
    if (cycle) lines.push(`Appraisal cycle: ${cycle}`);
    lines.push(`Overall score: ${resp.total.toFixed(2)} / 5  (${resp.grade} — ${resp.gradeLabel})`);
    lines.push("");
    lines.push("KRA ratings");
    resp.items.forEach((it, i) => {
      lines.push(
        `${i + 1}. ${it.name}  [${it.score}/5, weight ${it.weight}% → ${it.weighted.toFixed(2)}]`
      );
      if (it.basis) lines.push(`   ${it.basis}`);
    });
    lines.push("");
    lines.push("Overall summary");
    lines.push(resp.overall || "");
    lines.push("");
    lines.push("Key strengths");
    lines.push(resp.strengths || "");
    lines.push("");
    lines.push("Areas for growth");
    lines.push(resp.growth || "");
    lines.push("");
    lines.push("Next steps");
    lines.push(resp.nextSteps || "");
    lines.push("");
    lines.push("AI-generated draft. Review and edit before use. Not a substitute for HR, legal, or employment advice.");
    return lines.join("\n\n");
  }

  if (!open) return null;

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
        {/* Header */}
        <div className="sticky top-0 z-10 bg-surface-card border-b border-border-subtle px-lg py-md flex items-center justify-between">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
              AI Review Writer · Scored Review
            </span>
            <span className="font-title-md text-title-md text-text-primary">
              {step === "result"
                ? "Your scorecard"
                : `Step ${stepIndex()} of 4 · ${STEPS.find((s) => s.id === step)?.label}`}
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
          {/* Progress */}
          {step !== "result" && (
            <div className="mb-lg">
              <div className="flex gap-2xs">
                {STEPS.map((s) => {
                  const cur = STEPS.findIndex((x) => x.id === step);
                  const si = STEPS.findIndex((x) => x.id === s.id);
                  return (
                    <div
                      key={s.id}
                      className={`h-1 flex-1 rounded-full ${
                        si <= cur ? "bg-primary-container" : "bg-border-subtle"
                      }`}
                    />
                  );
                })}
              </div>
            </div>
          )}

          {/* ===== CONTEXT ===== */}
          {step === "context" && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-sm" style={{ marginTop: 0 }}>
                Who are you reviewing?
              </h2>
              <div className="grid sm:grid-cols-2 gap-md mb-lg">
                {REVIEW_TYPES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setReviewType(t.id)}
                    className={`text-left p-lg rounded-lg border transition-all ${
                      reviewType === t.id
                        ? "border-2 border-text-primary bg-surface-canvas"
                        : "border border-border-subtle bg-surface-card hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    <span className="font-title-md text-title-md text-text-primary">{t.title}</span>
                    <p className="font-body-sm text-body-sm text-text-muted mt-xs">{t.desc}</p>
                  </button>
                ))}
              </div>

              <label className="block font-title-md text-title-md text-text-primary mb-xs">Job title (optional)</label>
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
                    placeholder="e.g. Senior Product Designer"
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

              <label className="block font-title-md text-title-md text-text-primary mb-xs">Appraisal cycle (optional)</label>
              <input
                type="text"
                value={cycle}
                onChange={(e) => setCycle(e.target.value)}
                placeholder="e.g. 2026 Q3 Review"
                className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container mb-lg"
                style={{ fontSize: 14 }}
              />

              <label className="block font-title-md text-title-md text-text-primary mb-sm">Tone</label>
              <div className="flex flex-wrap gap-sm mb-lg">
                {TONES.map((t) => (
                  <button
                    key={t.id}
                    onClick={() => setTone(t.id)}
                    className={`px-4 py-2 rounded border text-body-md ${
                      tone === t.id
                        ? "border-primary-container bg-surface-canvas text-text-primary"
                        : "border-border-subtle bg-surface-card text-text-primary hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    {t.id}
                  </button>
                ))}
              </div>

              <div className="flex flex-col sm:flex-row gap-sm">
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1 disabled:opacity-50"
                  disabled={!canNextContext()}
                  onClick={() => setStep("kra")}
                  type="button"
                >
                  Continue to Key Results
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== KRA ===== */}
          {step === "kra" && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-xs" style={{ marginTop: 0 }}>
                Key Result Areas
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-md" style={{ marginTop: 0 }}>
                Add 1–6 weighted KRAs. Weights must total 100%. Optionally add goal
                completion % and evidence.
              </p>

              <div className="mb-md">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Quick add</span>
                <div className="flex flex-wrap gap-sm mt-xs">
                  {KRA_PRESETS.map((p) => (
                    <button
                      key={p}
                      onClick={() => setKras((prev) => [...prev, { name: p, weight: 25, goalCompletion: null, evidence: "" }])}
                      className="px-3 py-1.5 rounded-full border border-border-strong text-label-md font-label-md text-text-primary hover:bg-surface-canvas transition-colors"
                      type="button"
                    >
                      + {p}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-md">
                {kras.map((k, i) => (
                  <div
                    key={i}
                    className="p-md rounded-lg border border-border-subtle bg-surface-canvas"
                  >
                    <div className="flex items-start justify-between gap-xs">
                      <input
                        type="text"
                        value={k.name}
                        onChange={(e) => updateKra(i, { name: e.target.value })}
                        placeholder={`KRA ${i + 1} name (e.g. ${KRA_PRESETS[i] || "Project Delivery"})`}
                        className="flex-1 px-3 py-2 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container"
                        style={{ fontSize: 14 }}
                      />
                      {kras.length > 1 && (
                        <button
                          onClick={() => setKras((p) => p.filter((_, idx) => idx !== i))}
                          className="shrink-0 px-2 py-1 text-text-muted hover:text-text-primary"
                          type="button"
                          aria-label="Remove KRA"
                        >
                          <span className="material-symbols-outlined text-[18px]">close</span>
                        </button>
                      )}
                    </div>
                    <div className="flex flex-col sm:flex-row gap-sm mt-sm">
                      <label className="flex-1 flex flex-col gap-1">
                        <span className="font-label-sm text-label-sm text-text-muted">Weight %</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={k.weight}
                          onChange={(e) => updateKra(i, { weight: Number(e.target.value) })}
                          className="px-3 py-2 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container"
                          style={{ fontSize: 14 }}
                        />
                      </label>
                      <label className="flex-1 flex flex-col gap-1">
                        <span className="font-label-sm text-label-sm text-text-muted">Goal completion % (optional)</span>
                        <input
                          type="number"
                          min={0}
                          max={100}
                          value={k.goalCompletion ?? ""}
                          onChange={(e) =>
                            updateKra(i, {
                              goalCompletion:
                                e.target.value === "" ? null : Number(e.target.value),
                            })
                          }
                          placeholder="0-100"
                          className="px-3 py-2 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container"
                          style={{ fontSize: 14 }}
                        />
                      </label>
                    </div>
                    <label className="block mt-sm">
                      <span className="font-label-sm text-label-sm text-text-muted">Evidence / notes (optional)</span>
                      <textarea
                        value={k.evidence ?? ""}
                        onChange={(e) => updateKra(i, { evidence: e.target.value })}
                        placeholder="e.g. Shipped checkout v2, cut cart abandonment 18%"
                        rows={2}
                        className="mt-1 w-full px-3 py-2 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container resize-y"
                        style={{ fontSize: 14 }}
                      />
                    </label>
                  </div>
                ))}
              </div>

              <button
                onClick={() => setKras((p) => [...p, emptyKra()])}
                className="mt-md inline-flex items-center gap-xs px-4 py-2 border border-border-strong rounded text-text-primary hover:bg-surface-canvas transition-colors"
                type="button"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add KRA
              </button>

              {/* Weight total indicator */}
              <div
                className={`mt-md p-sm rounded border ${
                  Math.abs(weightSum - 100) <= 0.5
                    ? "border-border-strong"
                    : "border-border-strong"
                }`}
                style={{
                  background:
                    Math.abs(weightSum - 100) <= 0.5
                      ? "rgba(34,197,94,0.06)"
                      : "rgba(251,191,36,0.06)",
                }}
              >
                <span className="font-label-md text-label-md text-text-primary">
                  Weight total:{" "}
                  <b className={Math.abs(weightSum - 100) <= 0.5 ? "text-primary" : ""}>
                    {Math.round(weightSum * 10) / 10}%
                  </b>{" "}
                  {Math.abs(weightSum - 100) <= 0.5 ? "✓ must equal 100%" : "(must equal 100%)"}
                </span>
              </div>

              {error && (
                <p className="mt-md text-body-sm text-text-primary" style={{ color: "var(--danger, #dc2626)" }}>
                  {error}
                </p>
              )}

              <div className="flex flex-col sm:flex-row gap-sm mt-lg">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => { setError(""); setStep("context"); }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1 disabled:opacity-50"
                  disabled={!canNextKra()}
                  onClick={() => { setError(""); setStep("notes"); }}
                  type="button"
                >
                  Continue
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>
          )}

          {/* ===== NOTES ===== */}
          {step === "notes" && (
            <div>
              <h2 className="font-headline-sm text-headline-sm text-text-primary mb-xs" style={{ marginTop: 0 }}>
                Anything else to weigh in?
              </h2>
              <p className="font-body-md text-body-md text-text-muted mb-md" style={{ marginTop: 0 }}>
                Optional context helps the scorer be fair and specific.
              </p>
              <label className="block font-title-md text-title-md text-text-primary mb-xs">Notable strengths or wins</label>
              <textarea
                value={strengths}
                onChange={(e) => setStrengths(e.target.value)}
                rows={3}
                placeholder="e.g. Mentored 2 juniors; unblocked the mobile team; drove the design system rollout."
                className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-y mb-lg"
                style={{ fontSize: 14 }}
              />
              <label className="block font-title-md text-title-md text-text-primary mb-xs">Areas for growth</label>
              <textarea
                value={growth}
                onChange={(e) => setGrowth(e.target.value)}
                rows={3}
                placeholder="e.g. Needs to improve written communication and cross-team visibility."
                className="w-full px-3.5 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container resize-y mb-lg"
                style={{ fontSize: 14 }}
              />

              {error && (
                <p className="mb-md text-body-sm" style={{ color: "var(--danger, #dc2626)" }}>{error}</p>
              )}

              <div className="flex flex-col sm:flex-row gap-sm">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => { setError(""); setStep("kra"); }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1 disabled:opacity-50"
                  disabled={loading}
                  onClick={handleGenerate}
                  type="button"
                >
                  {loading ? (
                    <>
                      <RefreshCw size={16} className="animate-spin" />
                      Scoring KRAs…
                    </>
                  ) : (
                    <>
                      <span>Generate scorecard</span>
                      <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* ===== RESULT ===== */}
          {step === "result" && resp && (
            <div>
              {/* Grade header */}
              <div className="p-md rounded-lg border border-border-subtle bg-surface-canvas mb-lg">
                <div className="flex flex-wrap items-center justify-between gap-md">
                  <div>
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">Overall score</span>
                    <div className="flex items-baseline gap-2">
                      <span className="font-display-md text-display-md text-text-primary">
                        {resp.total.toFixed(2)}
                      </span>
                      <span className="font-body-md text-body-md text-text-muted">/ 5</span>
                      <span
                        className={`ml-2 inline-block px-3 py-1 rounded-full font-label-md text-label-md text-on-primary ${
                          resp.total >= 4.5 ? "bg-emerald-600" :
                          resp.total >= 3.5 ? "bg-blue-600" :
                          resp.total >= 2.5 ? "bg-amber-500" : "bg-red-500"
                        }`}
                      >
                        {resp.grade} · {resp.gradeLabel}
                      </span>
                    </div>
                    <div className="text-sm mt-1">
                      <span className="font-label-md text-label-md text-text-primary">
                        {Math.round(resp.percent)}% of max
                      </span>
                      <span className="text-text-muted"> · Weight total: {resp.weightSum}%</span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => downloadPDF()}
                      className="inline-flex items-center justify-center gap-xs px-4 py-2 border border-border-strong rounded text-text-primary hover:bg-surface-canvas transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                      Export PDF
                    </button>
                    <button
                      onClick={() =>
                        downloadWord(buildWordText(), "performance-scorecard")
                      }
                      className="inline-flex items-center justify-center gap-xs px-4 py-2 border border-border-strong rounded text-text-primary hover:bg-surface-canvas transition-colors"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">description</span>
                      Export Word
                    </button>
                  </div>
                </div>
              </div>

              {/* Scorecard table */}
              <div className="overflow-x-auto rounded-lg border border-border-subtle mb-lg">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-surface-canvas border-b border-border-subtle">
                      <th className="px-4 py-2.5 font-label-md text-label-md text-text-muted uppercase tracking-wider">KRA</th>
                      <th className="px-4 py-2.5 font-label-md text-label-md text-text-muted uppercase tracking-wider text-center">Weight</th>
                      <th className="px-4 py-2.5 font-label-md text-label-md text-text-muted uppercase tracking-wider text-center">Score</th>
                      <th className="px-4 py-2.5 font-label-md text-label-md text-text-muted uppercase tracking-wider text-center">Weighted</th>
                      <th className="px-4 py-2.5 font-label-md text-label-md text-text-muted uppercase tracking-wider">Basis</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resp.items.map((it, i) => (
                      <tr key={i} className="border-b border-border-subtle last:border-0">
                        <td className="px-4 py-3">
                          <div className="font-title-sm text-title-sm text-text-primary">{it.name}</div>
                          {it.goalCompletion != null && (
                            <div className="font-label-sm text-label-sm text-text-muted">
                              Goal: {it.goalCompletion}%
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-center font-body-md text-body-md text-text-primary">{it.weight}%</td>
                        <td className="px-4 py-3 text-center">
                          <div className="text-primary text-[16px] tracking-tight">{renderStars(it.score)}</div>
                          <div className="font-label-sm text-label-sm text-text-muted">{it.score.toFixed(1)} / 5</div>
                        </td>
                        <td className="px-4 py-3 text-center font-title-md text-title-md text-text-primary">
                          {it.weighted.toFixed(2)}
                        </td>
                        <td className="px-4 py-3 font-body-sm text-body-sm text-text-muted leading-relaxed">{it.basis || "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-surface-canvas">
                      <td className="px-4 py-2.5 font-label-md text-label-md text-text-primary" colSpan={3}>
                        TOTAL
                      </td>
                      <td className="px-4 py-2.5 text-center font-title-md text-title-md text-text-primary">
                        {resp.total.toFixed(2)}
                      </td>
                      <td className="px-4 py-2.5 font-body-sm text-body-sm text-text-muted">
                        Σ (score × weight) / 100
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Narrative sections */}
              {[
                { h: "Overall Summary", b: resp.overall },
                { h: "Key Strengths", b: resp.strengths },
                { h: "Areas for Growth", b: resp.growth },
                { h: "Next Steps", b: resp.nextSteps },
              ].map(
                (s) =>
                  s.b && (
                    <div key={s.h} className="mb-md">
                      <h3 className="font-title-md text-title-md text-text-primary mb-xs">{s.h}</h3>
                      <p className="font-body-sm text-body-sm text-text-muted leading-relaxed whitespace-pre-line">{s.b}</p>
                    </div>
                  )
              )}

              {/* AI disclaimer */}
              <div
                className="mt-lg p-md rounded border border-dashed"
                style={{ borderColor: "var(--border-strong)", background: "var(--surface-canvas)" }}
              >
                <span className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                  AI-generated draft. Review and edit before use. Not a substitute
                  for HR, legal, or employment advice.
                </span>
              </div>

              <div className="flex flex-col sm:flex-row gap-sm mt-lg">
                <button
                  className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                  onClick={() => { setError(""); setStep("kra"); setResp(null); }}
                  type="button"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Edit inputs
                </button>
                <button
                  className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors sm:flex-1"
                  onClick={handleGenerate}
                  type="button"
                >
                  <RefreshCw size={16} />
                  Regenerate scorecard
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
