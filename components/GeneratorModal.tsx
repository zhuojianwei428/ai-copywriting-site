"use client";

import { useEffect, useState } from "react";
import { Check, Copy, Pencil, RefreshCw } from "lucide-react";
import { downloadPDF, downloadWord } from "../lib/export";

type ReviewType = "self" | "manager" | "peer" | "360";
type Tone = "Formal" | "Encouraging" | "Direct";

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
  const [jobTitle, setJobTitle] = useState("");
  const [isCustomJobTitle, setIsCustomJobTitle] = useState(false);
  const [tenure, setTenure] = useState<string | null>(null);
  const [strengths, setStrengths] = useState<string[]>([]);
  const [freeNote, setFreeNote] = useState("");
  const [growthAreas, setGrowthAreas] = useState<string[]>([]);
  const [tone, setTone] = useState<Tone | null>(null);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState("");
  const [error, setError] = useState("");

  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [copied, setCopied] = useState(false);

  // Reset to step 1 whenever the modal opens with a (possibly new) default format
  useEffect(() => {
    if (open) {
      setStep(1);
      setReviewType(defaultFormat);
      setResult("");
      setError("");
      setEditing(false);
      setLoading(false);
      setIsCustomJobTitle(false);
      setJobTitle("");
    }
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

  async function handleGenerate() {
    if (!reviewType || !tone) {
      setError("Please choose a review type and a tone before generating.");
      return;
    }
    setLoading(true);
    setError("");
    setResult("");
    if (editing) setEditing(false);
    const finalStrengths = freeNote.trim()
      ? [...strengths, freeNote.trim()]
      : strengths;
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          reviewType,
          jobTitle,
          tenure,
          strengths: finalStrengths,
          growthAreas,
          tone,
        }),
      });
      if (!res.ok || !res.body) {
        let msg = "Something went wrong. Please try again.";
        try {
          const e = await res.json();
          if (e?.error) msg = e.error;
        } catch {}
        setError(msg);
        setLoading(false);
        return;
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setResult(acc);
      }
      setLoading(false);
      setStep(5);
    } catch {
      setError("Network error. Please try again.");
      setLoading(false);
    }
  }

  async function handleCopy() {
    try {
      await navigator.clipboard.writeText(result);
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
              </div>
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
                  <div className="skeleton lg" />
                  <div className="skeleton" />
                  <div className="skeleton" />
                  <div className="skeleton lg" />
                  <div className="skeleton" />
                  <div className="font-body-sm text-body-sm text-text-muted">
                    Writing your performance review...
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
                <div
                  className="whitespace-pre-wrap"
                  style={{ lineHeight: 1.7, fontSize: 15, color: "var(--text-primary)" }}
                >
                  {result}
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
                    onClick={downloadPDF}
                    type="button"
                  >
                    <span className="material-symbols-outlined text-[16px]">picture_as_pdf</span>
                    <span>Export PDF</span>
                  </button>
                  <button
                    className="inline-flex items-center justify-center gap-xs px-4 py-2.5 border border-border-strong rounded text-text-primary bg-surface-card hover:bg-surface-canvas transition-colors"
                    onClick={() => downloadWord(result)}
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
