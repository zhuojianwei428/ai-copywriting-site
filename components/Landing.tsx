"use client";

import { useState } from "react";
import GeneratorModal from "./GeneratorModal";
import ScoreGeneratorModal from "./ScoreGeneratorModal";
import { useAuth } from "./auth/AuthContext";
import { FAQ_ITEMS } from "../lib/jsonld";

type FormatKey = "self" | "manager" | "peer" | "360";

const FORMATS: {
  key: FormatKey;
  label: string;
  desc: string;
  badge: string;
}[] = [
  {
    key: "self",
    label: "Self Review",
    desc: "Highlight your key wins, growth areas, and project impact with balanced self-advocacy.",
    badge: "Employee view",
  },
  {
    key: "manager",
    label: "Manager Review",
    desc: "Structured evaluation of performance, competencies, and forward-looking developmental goals.",
    badge: "Leadership view",
  },
  {
    key: "peer",
    label: "Peer Review",
    desc: "Constructive feedback on collaboration, technical execution, and cross-team contributions.",
    badge: "Lateral feedback",
  },
  {
    key: "360",
    label: "360° Feedback",
    desc: "Holistic multi-perspective assessment synthesized directly against organization rubrics.",
    badge: "Multi-source",
  },
];

const STEPS = ["Format", "Role & Level", "Inputs", "Draft"];

export default function Landing() {
  const [format, setFormat] = useState<FormatKey>("self");
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefault, setModalDefault] = useState<FormatKey>("self");
  const [scoreOpen, setScoreOpen] = useState(false);
  const [scoredMode, setScoredMode] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  // 全局登录态：点"开始生成"前先过登录门槛
  const { user, gate, signOut } = useAuth();

  /** 真正打开 narrative 生成器（只有已登录会走到这里） */
  function openGenerator(preset: FormatKey) {
    setModalDefault(preset);
    setModalOpen(true);
  }
  /** CTA 入口：未登录先弹登录框，登录成功后自动打开生成器 */
  function startGenerator(preset: FormatKey) {
    gate(() => openGenerator(preset));
  }
  /** CTA 入口：scored 模式同样先登录 */
  function startScored() {
    gate(() => setScoreOpen(true));
  }

  return (
      <main className="min-h-screen bg-surface-canvas">
      {/* ===================== HEADER ===================== */}
      <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-surface-card/90 backdrop-blur">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary-container text-[22px]">
              rate_review
            </span>
            <span className="font-title-md text-title-md text-text-primary tracking-tight">
              AI Review Writer
            </span>
          </div>
          <div className="flex items-center gap-sm">
            {user ? (
              <>
                <span className="hidden sm:flex items-center gap-xs font-label-md text-label-md text-text-muted">
                  {user.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={user.user_metadata.avatar_url as string}
                      alt=""
                      className="w-6 h-6 rounded-full"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-6 h-6 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-label-sm text-label-sm">
                      {(user.email || "U").slice(0, 1).toUpperCase()}
                    </span>
                  )}
                  {user.email || "Signed in"}
                </span>
                <button
                  onClick={() => signOut()}
                  className="inline-flex items-center px-3 py-2 rounded-lg border border-border-strong text-text-primary font-label-md text-label-md hover:bg-surface-canvas transition-colors"
                  type="button"
                >
                  Sign out
                </button>
              </>
            ) : (
              <button
                onClick={() => startGenerator(format)}
                className="inline-flex items-center justify-center gap-xs px-4 py-2 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2"
              >
                Generate a review
              </button>
            )}
          </div>
        </div>
      </header>

      {/* ===================== SECTION 1: HERO & STEP 1 ===================== */}
      <section className="w-full border-b border-border-subtle bg-surface-card">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop pt-2xl pb-3xl flex flex-col items-center text-center">
          {/* Eyebrow Pill */}
          <div className="inline-flex items-center gap-xs px-3 py-1 rounded-full border border-border-strong bg-surface-canvas mb-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-primary">
              AI Performance Review Generator
            </span>
          </div>
          {/* Headline */}
          <h1 className="font-display-lg text-display-lg-mobile lg:text-display-lg text-text-primary max-w-4xl tracking-tight mb-md">
            AI Performance Review Generator
          </h1>
          {/* SEO subtitle */}
          <p className="font-headline-md text-headline-md text-text-primary max-w-3xl mb-sm">
            Write self, manager &amp; 360° performance reviews in minutes.
          </p>
          {/* Brand tagline subtitle */}
          <p className="font-body-lg text-body-lg text-text-muted max-w-2xl">
            Reviews written with rigor, precision, and nuance — calibrated to
            your rubric, role level, and documented impact. Sign in with
            Google or your email to start.
          </p>

          {/* Interactive Generator Box */}
          <div className="w-full max-w-5xl text-left bg-surface-card border border-border-subtle rounded-xl p-md lg:p-xl shadow-sm">
            {/* Mode Toggle */}
            <div className="flex items-center justify-between gap-md pb-md mb-md border-b border-border-subtle">
              <div className="flex items-center gap-xs">
                <span className="font-title-md text-title-md text-text-primary font-semibold">
                  {scoredMode ? "KRA Scorecard Generator" : "Review Writer"}
                </span>
                <span className="font-label-sm text-label-sm text-text-muted hidden sm:inline">
                  — two output styles
                </span>
              </div>
              <div
                className="inline-flex rounded-lg border border-border-strong bg-surface-canvas p-0.5"
                role="tablist"
                aria-label="Output style"
              >
                <button
                  role="tab"
                  aria-selected={!scoredMode}
                  onClick={() => setScoredMode(false)}
                  className={`px-3.5 py-1.5 rounded-md font-label-md text-label-md transition-colors ${
                    !scoredMode
                      ? "bg-primary-container text-on-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  type="button"
                >
                  Narrative
                </button>
                <button
                  role="tab"
                  aria-selected={scoredMode}
                  onClick={() => setScoredMode(true)}
                  className={`px-3.5 py-1.5 rounded-md font-label-md text-label-md transition-colors ${
                    scoredMode
                      ? "bg-primary-container text-on-primary"
                      : "text-text-muted hover:text-text-primary"
                  }`}
                  type="button"
                >
                  Scored · KRA
                </button>
              </div>
            </div>

            {/* ===== NARRATIVE MODE ===== */}
            {!scoredMode && (
              <>
            {/* Step Indicator Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-lg border-b border-border-subtle gap-md">
              <div className="flex flex-col">
                <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
                  Step 1 of 4
                </span>
                <span className="font-headline-sm text-headline-sm text-text-primary">
                  Select review format to begin
                </span>
              </div>
              {/* Stepper Badges */}
              <div className="grid grid-cols-4 gap-2xs w-full sm:w-80">
                {STEPS.map((s, i) => (
                  <div key={s} className="flex flex-col gap-1">
                    <div
                      className={`h-1 w-full rounded-full ${
                        i === 0 ? "bg-primary-container" : "bg-border-subtle"
                      }`}
                    ></div>
                    <span
                      className={`font-label-sm text-[10px] ${
                        i === 0 ? "text-text-primary" : "text-text-muted"
                      } font-semibold truncate`}
                    >
                      {i + 1}. {s}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* 4 Format Selectable Cards */}
            <div
              className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-md pt-lg pb-xl"
              id="review-format-group"
            >
              {FORMATS.map((f) => {
                const active = format === f.key;
                return (
                  <button
                    key={f.key}
                    onClick={() => setFormat(f.key)}
                    className={`text-left p-lg rounded-lg flex flex-col justify-between h-full transition-all focus:outline-none ${
                      active
                        ? "border-2 border-text-primary bg-surface-canvas"
                        : "border border-border-subtle bg-surface-card hover:border-border-strong"
                    }`}
                    type="button"
                  >
                    <div className="flex flex-col gap-xs">
                      <div className="flex items-center justify-between">
                        <span className="font-title-md text-title-md text-text-primary">
                          {f.label}
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
                          ></span>
                        </span>
                      </div>
                      <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                        {f.desc}
                      </p>
                    </div>
                    <div className="pt-md mt-auto">
                      <span className="inline-block px-2 py-0.5 rounded bg-surface-card border border-border-subtle font-label-sm text-[10px] text-text-muted uppercase">
                        {f.badge}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Action Bar Footer */}
            <div className="pt-md border-t border-border-subtle flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-md">
              <div className="flex items-center gap-xs">
                <span className="font-body-sm text-body-sm text-text-muted">
                  Selected format:
                </span>
                <span className="font-title-md text-title-md text-text-primary font-semibold">
                  {FORMATS.find((f) => f.key === format)?.label}
                </span>
              </div>
              <button
                onClick={() => startGenerator(format)}
                className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2"
                type="button"
              >
                <span>Continue to Step 2: Role &amp; Level</span>
                <span className="material-symbols-outlined text-[18px]">
                  arrow_forward
                </span>
              </button>
            </div>
              </>
            )}

            {/* ===== SCORED MODE ===== */}
            {scoredMode && (
              <div className="pt-sm">
                <div className="flex items-start gap-md p-lg rounded-lg border border-border-strong bg-surface-canvas mb-md">
                  <span className="material-symbols-outlined text-primary-container text-[26px] shrink-0 mt-0.5">
                    fact_check
                  </span>
                  <div>
                    <h2 className="font-headline-sm text-headline-sm text-text-primary mb-xs">
                      Score performance against weighted key results
                    </h2>
                    <p className="font-body-md text-body-md text-text-muted">
                      Define 1–6 KRAs with weights, add goal completion and
                      evidence. We score each KRA on a 1–5 star scale, compute a
                      weighted total and letter grade (A–D), and attach a written
                      evaluation — the way enterprise HRMS appraisals do.
                    </p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-md">
                  {[
                    { icon: "rule", t: "Weighted KRAs", d: "Weights must total 100%" },
                    { icon: "stars", t: "1–5 star scoring", d: "Honest, evidence-based" },
                    { icon: "summarize", t: "Grade + narrative", d: "A–D + written review" },
                  ].map((f) => (
                    <div
                      key={f.t}
                      className="flex-1 p-md rounded-lg border border-border-subtle flex items-start gap-sm"
                    >
                      <span className="material-symbols-outlined text-primary-container text-[20px] shrink-0">
                        {f.icon}
                      </span>
                      <div>
                        <div className="font-title-sm text-title-sm text-text-primary">{f.t}</div>
                        <div className="font-body-sm text-body-sm text-text-muted">{f.d}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-md flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-md pt-md border-t border-border-subtle">
                  <div className="flex items-center gap-xs">
                    <span className="font-body-sm text-body-sm text-text-muted">Output style:</span>
                    <span className="font-title-md text-title-md text-text-primary font-semibold">
                      Structured scorecard
                    </span>
                  </div>
                  <button
                    onClick={() => startScored()}
                    className="inline-flex items-center justify-center gap-xs px-5 py-2.5 bg-primary-container text-on-primary font-label-md text-label-md rounded-lg hover:bg-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary-container focus:ring-offset-2"
                    type="button"
                  >
                    <span>Build a scored review</span>
                    <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 2: OUTPUT MOCKUP ===================== */}
      <section
        id="output"
        className="w-full border-b border-border-subtle bg-surface-canvas py-3xl"
      >
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          {/* Section Header */}
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-xl mb-2xl pb-lg border-b border-border-subtle">
            <div className="max-w-2xl">
              <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted mb-xs block">
                Engineered for credibility
              </span>
              <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-xs">
                Structured, evidence-based review drafts
              </h2>
              <p className="font-body-lg text-body-lg text-text-muted">
                Every generated output enforces clear competency taxonomy,
                concrete metrics, and actionable developmental paths without
                generic corporate filler.
              </p>
            </div>
            <div className="flex items-center gap-md p-md bg-surface-card border border-border-subtle rounded-xl shadow-sm shrink-0">
              <div className="w-16 h-16 rounded-lg overflow-hidden border border-border-subtle shrink-0 bg-surface-canvas">
                <img
                  src="https://lh3.googleusercontent.com/aida-public/AB6AXuCCL_uurcKAhOe8nPwzoAiqZOqF0VcWxNTU9He0rWz_uuc0xpa9KBuMCqbrlHylSpnX1v3AOf9TOpnDhwCdOEylBRldPjBEolrtrL4lpDPvffeHfnvYv58wW9SEG4M_kOb1_SbbxqomXF_w0O6BLzzS192QlSGdQ23vNnPjQigNk-stBlDo8SLKMbNrxGc44ueqkKey7QIeWzyh5Rl5cuZGZJn8bwgt9qtzJd1h1IKTESgGaFLCTrHcMw"
                  alt="Diverse reviewers"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px] text-primary-container">
                    verified
                  </span>
                  <span className="font-title-md text-title-md text-text-primary font-semibold">
                    Managers &amp; ICs
                  </span>
                </div>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Calibrated across engineering, product &amp; design
                </span>
              </div>
            </div>
          </div>

          {/* High-Fidelity Review Document Mockup (sample — illustrative only) */}
          <div className="w-full bg-surface-card border-2 border-dashed border-border-strong rounded-xl overflow-hidden">
            {/* Sample Banner */}
            <div className="bg-surface-canvas border-b border-dashed border-border-strong px-md lg:px-xl py-3 flex flex-col gap-1">
              <div className="flex flex-wrap items-center gap-sm">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300 font-label-sm text-label-sm font-semibold tracking-wide">
                  <span className="material-symbols-outlined text-[14px]">info</span>
                  SAMPLE OUTPUT — ILLUSTRATIVE ONLY
                </span>
                <span className="font-body-sm text-body-sm text-text-muted">
                  Shown in Manager Review format
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                All names, metrics, and milestones shown below are fictional
                examples, not real employee data.
              </p>
              <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                AI-generated draft. Review and edit before use. Not a substitute
                for HR, legal, or employment advice.
              </p>
            </div>
            {/* Document Meta Header Bar */}
            <div className="bg-surface-canvas border-b border-border-subtle p-md lg:px-xl lg:py-md flex flex-wrap items-center justify-between gap-md">
              <div className="flex flex-wrap items-center gap-x-lg gap-y-xs">
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-text-muted block">
                    Subject
                  </span>
                  <span className="font-title-md text-title-md text-text-primary">
                    Elena Rostova • Senior Product Designer (L5)
                  </span>
                </div>
                <div className="h-6 w-px bg-border-subtle hidden sm:block"></div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-text-muted block">
                    Cycle
                  </span>
                  <span className="font-body-md text-body-md text-text-primary">
                    Q3–Q4 Annual Evaluation
                  </span>
                </div>
                <div className="h-6 w-px bg-border-subtle hidden sm:block"></div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-text-muted block">
                    Format
                  </span>
                  <span className="font-body-md text-body-md text-text-primary">
                    Manager Evaluation
                  </span>
                </div>
                <div className="h-6 w-px bg-border-subtle hidden sm:block"></div>
                <div>
                  <span className="font-label-sm text-label-sm uppercase text-text-muted block">
                    Calibration Tone
                  </span>
                  <span className="font-body-md text-body-md text-text-primary">
                    Constructive &amp; Direct
                  </span>
                </div>
              </div>
              {/* Document Action Toolbar */}
              <div className="flex flex-col items-end gap-1.5">
                <div className="flex items-center gap-xs">
                  <div className="relative group">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-strong rounded text-text-muted cursor-not-allowed font-label-md text-label-md"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        content_copy
                      </span>
                      <span>Copy Draft</span>
                    </button>
                  </div>
                  <div className="relative group">
                    <button
                      disabled
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 border border-border-strong rounded text-text-muted cursor-not-allowed font-label-md text-label-md"
                      type="button"
                    >
                      <span className="material-symbols-outlined text-[16px]">
                        picture_as_pdf
                      </span>
                      <span>Export PDF</span>
                    </button>
                  </div>
                </div>
                <p className="font-label-sm text-label-sm text-text-muted text-right">
                  Available after you generate your own draft
                </p>
              </div>
            </div>

            {/* Document Body Canvas */}
            <div className="p-lg lg:p-2xl flex flex-col gap-xl max-w-4xl">
              {/* Executive Summary & Rating */}
              <div className="p-lg rounded-lg border border-border-subtle bg-surface-canvas flex flex-col gap-xs">
                <div className="flex items-center justify-between">
                  <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
                    Executive Rating
                  </span>
                  <span className="px-2.5 py-0.5 rounded bg-surface-card border border-border-strong font-label-md text-label-md font-semibold text-text-primary">
                    Exceeds Expectations (Level 5)
                  </span>
                </div>
                <p className="font-body-md text-body-md text-text-primary leading-relaxed">
                  Elena demonstrated remarkable ownership across the Core
                  Experience domain this half-year. Her leadership during the Checkout
                  Design System unification delivered measurable velocity
                  improvements across both product and mobile engineering squads,
                  while establishing higher accessibility benchmarks
                  organization-wide.
                </p>
              </div>

              {/* Section 1: Core Competencies */}
              <div className="flex flex-col gap-md">
                <div className="pb-2xs border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary tracking-tight">
                    1. Core Competencies &amp; Documented Impact
                  </h3>
                  <span className="font-label-sm text-label-sm text-text-muted">
                    3 verifiable milestones logged
                  </span>
                </div>
                <ul className="flex flex-col gap-sm">
                  {[
                    {
                      t: "Design System Architecture & Velocity",
                      d: "Engineered and published 24 accessible Figma tokens aligned to the internal Tailwind spec. Authored cross-functional guidelines that unblocked 6 teams.",
                      m: "+34% Team Velocity",
                    },
                    {
                      t: "Multi-tier Checkout Redesign",
                      d: "Shipped friction-reduction flows across enterprise checkout portals ahead of the scheduled Q4 holiday freeze. Zero regressions reported in post-release audit.",
                      m: "-18% Drop-off Rate",
                    },
                    {
                      t: "Design Mentorship & Rituals",
                      d: "Structured bi-weekly design critique sessions and onboarded 2 Associate Designers, cutting ramp time by three weeks through documented onboarding runbooks.",
                      m: "2 Mentees Promoted",
                    },
                  ].map((item) => (
                    <li
                      key={item.t}
                      className="p-md rounded border border-border-subtle bg-surface-card flex flex-col sm:flex-row sm:items-start justify-between gap-sm"
                    >
                      <div className="flex flex-col gap-2xs">
                        <span className="font-title-md text-title-md text-text-primary">
                          {item.t}
                        </span>
                        <p className="font-body-md text-body-md text-text-muted">
                          {item.d}
                        </p>
                      </div>
                      <div className="sm:text-right shrink-0">
                        <span className="font-label-sm text-[11px] font-semibold text-text-primary px-2 py-1 bg-surface-canvas rounded border border-border-subtle inline-block">
                          {item.m}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Section 2: Opportunities */}
              <div className="flex flex-col gap-md">
                <div className="pb-2xs border-b border-border-subtle">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary tracking-tight">
                    2. Developmental Objectives &amp; Focus Areas
                  </h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-md">
                  {[
                    {
                      a: "Focus Area A",
                      t: "Cross-Functional Strategic Sync",
                      d: "While design execution is exceptional, Elena can drive higher leverage by introducing Product Management and Analytics earlier in the exploratory phase, rather than post-spec handoff.",
                    },
                    {
                      a: "Focus Area B",
                      t: "Executive-Level Synthesis",
                      d: "Prepare for Staff-level expectations (L6) by framing quarterly initiative proposals in terms of business bottom-line impact and engineering tradeoff matrices.",
                    },
                  ].map((item) => (
                    <div
                      key={item.t}
                      className="p-md rounded border border-border-subtle bg-surface-canvas flex flex-col gap-2xs"
                    >
                      <span className="font-label-sm text-label-sm uppercase text-text-muted">
                        {item.a}
                      </span>
                      <span className="font-title-md text-title-md text-text-primary">
                        {item.t}
                      </span>
                      <p className="font-body-sm text-body-sm text-text-muted leading-relaxed">
                        {item.d}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Section 3: 360 Synthesis */}
              <div className="flex flex-col gap-md">
                <div className="pb-2xs border-b border-border-subtle flex items-center justify-between">
                  <h3 className="font-headline-sm text-headline-sm text-text-primary tracking-tight">
                    3. 360° Qualitative Synthesis
                  </h3>
                  <span className="font-label-sm text-label-sm text-text-muted">
                    Synthesized peer feedback themes
                  </span>
                </div>
                <div className="p-md rounded border border-border-subtle bg-surface-card flex flex-col gap-xs">
                  <p className="font-body-md text-body-md text-text-primary leading-relaxed">
                    <strong className="font-semibold">Consensus Themes:</strong>{" "}
                    Peers consistently commended Elena for her deep empathy during
                    technical feasibility reviews and her responsiveness to urgent
                    pull requests. Multiple engineering leads highlighted that
                    her spec documentation minimizes back-and-forth communication.
                    One recurring opportunity noted was to empower junior
                    teammates to lead design reviews independently.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===================== SECTION 3: HOW IT WORKS ===================== */}
      <section
        id="how-it-works"
        className="w-full border-b border-border-subtle bg-surface-card py-3xl"
      >
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="max-w-2xl mb-2xl">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted mb-xs block">
              Workflow &amp; Architecture
            </span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-xs">
              How it works
            </h2>
            <p className="font-body-lg text-body-lg text-text-muted">
              From unstructured notes to defensible evaluations in four
              disciplined steps.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-lg">
            {[
              {
                n: "01",
                t: "Select format & rubric",
                d: "Choose self, manager, peer, or 360° review. Load your company's core competency criteria or select from industry-standard rating scales.",
                f: "Configurable Rubrics",
              },
              {
                n: "02",
                t: "Input notes & milestones",
                d: "Paste raw bullet points, Slack snippets, Jira metrics, or quick scratchpad notes. The AI structures unstructured fragments into concrete achievements.",
                f: "Raw Input Ingestion",
              },
              {
                n: "03",
                t: "Calibrate tone & level",
                d: "Adjust seniority level (Associate to Director), calibrate directness, and ensure growth feedback is actionable, respectful, and free of cognitive bias.",
                f: "Bias & Tone Guard",
              },
              {
                n: "04",
                t: "Review, refine & export",
                d: "Receive a ready-to-edit review draft. Refine individual sections in-line and export as PDF or Word, ready to drop into your review process.",
                f: "PDF & Word Export",
              },
            ].map((s) => (
              <div
                key={s.n}
                className="p-lg rounded-lg border border-border-subtle bg-surface-canvas flex flex-col justify-between gap-md"
              >
                <div className="flex flex-col gap-sm">
                  <span className="font-headline-md text-headline-md text-text-muted">
                    {s.n}
                  </span>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">
                    {s.t}
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted">
                    {s.d}
                  </p>
                </div>
                <div className="pt-sm border-t border-border-subtle">
                  <span className="font-label-sm text-label-sm text-text-muted uppercase tracking-wider">
                    {s.f}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 4: WHO IT'S FOR ===================== */}
      <section
        id="who"
        className="w-full border-b border-border-subtle bg-surface-canvas py-3xl"
      >
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="max-w-2xl mb-2xl">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted mb-xs block">
              Audience &amp; Utility
            </span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-xs">
              Designed for leaders, teams, and individuals
            </h2>
            <p className="font-body-lg text-body-lg text-text-muted">
              Purpose-built interfaces tailored to each stakeholder in the annual
              performance cycle.
            </p>
          </div>

          {/* Featured Split Card */}
          <div className="w-full mb-xl bg-surface-card border border-border-subtle rounded-xl overflow-hidden grid grid-cols-1 lg:grid-cols-12 shadow-sm">
            <div className="lg:col-span-7 h-64 lg:h-auto min-h-[300px] overflow-hidden relative bg-surface-canvas">
              <img
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuAYjaoslJphmvAizrK5ixM3vB-E8vCaD8S5Riv3SnigAwB9lEwRm702Bg-FK5uTKIneaQF4zc2L7ZArhCoBtLzN2G_lcxXlmox0VjQwvTVCUGmhKPjotY0gJhDChjZwSbR0fnbCTSVj6NTt_2GQ3RfckcK7C5mY9IYI_52E5IOTWnDvKSUaIeZ5Ha_Zuq7Lf3UunPxvfUVYheBeBzP-0qDYzftR2iy_6tueORQx2xxxBtHRE7t9LnzsCA"
                alt="Performance review discussion"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="lg:col-span-5 p-lg lg:p-xl flex flex-col justify-between gap-md bg-surface-card">
              <div className="flex flex-col gap-sm">
                <div className="inline-flex items-center gap-xs px-2.5 py-1 rounded bg-surface-canvas border border-border-subtle w-fit">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                  <span className="font-label-sm text-[11px] uppercase tracking-wider text-text-muted">
                    In-Person Calibration
                  </span>
                </div>
                <h3 className="font-headline-sm text-headline-sm text-text-primary">
                  Turn difficult review cycles into constructive growth dialogues
                </h3>
                <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                  AI Review Writer synthesizes qualitative feedback and concrete
                  deliverables before review meetings, giving managers and ICs a
                  shared, unbiased baseline for meaningful 1-on-1 discussions.
                </p>
              </div>
              <div className="pt-md border-t border-border-subtle flex items-center justify-between font-label-sm text-label-sm text-text-muted">
                <span>Objective Milestones</span>
                <span className="h-1 w-1 rounded-full bg-border-strong"></span>
                <span>Grounded in your notes</span>
                <span className="h-1 w-1 rounded-full bg-border-strong"></span>
                <span>Defensible Rubrics</span>
              </div>
            </div>
          </div>

          {/* Audience Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-lg">
            {[
              {
                tag: "For Leadership",
                icon: "groups",
                t: "Engineering & Product Managers",
                d: "Eliminate review fatigue while writing fair, thorough, and developmental feedback for direct reports. Standardize scoring across diverse roles without spending 40 hours per cycle drafting repetitive prose.",
                items: [
                  "Turns your pasted notes, metrics, and project highlights into balanced review points",
                  "Maintains parity across senior and junior squad members",
                ],
              },
              {
                tag: "For Professionals",
                icon: "person",
                t: "Individual Contributors",
                d: "Articulate your accomplishments and project impact clearly without awkward self-promotion. Translate daily problem-solving and operational firefighting into documented business value.",
                items: [
                  "Balances healthy confidence with self-critical growth targets",
                  "Ensures forgotten early-quarter projects receive proper weighting",
                ],
              },
              {
                tag: "For Teammates",
                icon: "handshake",
                t: "Cross-Functional Peers",
                d: "Provide respectful, actionable peer reviews in minutes instead of hours. Surface nuanced collaborative praise and constructive feedback without creating awkward team dynamics.",
                items: [
                  "SBI framework (Situation-Behavior-Impact) prompts",
                  "Protects candor while maintaining a professional tone",
                ],
              },
              {
                tag: "For HR & People Ops",
                icon: "verified_user",
                t: "People & HR Operations",
                d: "Standardize evaluation quality across departments and reduce unhelpful one-line reviews. Supports consistent, well-documented evaluations and helps reduce unconscious bias in your review cycle.",
                items: [
                  "Prompts you to support claims with concrete, specific language",
                  "Secure sign-in — generate and export as often as you need",
                ],
              },
            ].map((a) => (
              <div
                key={a.t}
                className="p-xl rounded-lg border border-border-subtle bg-surface-card flex flex-col justify-between gap-md hover:border-border-strong transition-all"
              >
                <div className="flex flex-col gap-xs">
                  <div className="flex items-center justify-between mb-2xs">
                    <span className="font-label-sm text-label-sm uppercase tracking-wider text-text-muted">
                      {a.tag}
                    </span>
                    <span className="material-symbols-outlined text-text-muted text-[20px]">
                      {a.icon}
                    </span>
                  </div>
                  <h3 className="font-headline-sm text-headline-sm text-text-primary">
                    {a.t}
                  </h3>
                  <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                    {a.d}
                  </p>
                </div>
                <ul className="flex flex-col gap-2xs pt-md border-t border-border-subtle font-body-sm text-body-sm text-text-primary">
                  {a.items.map((it) => (
                    <li key={it} className="flex items-center gap-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary-container"></span>
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===================== SECTION 5: FAQ ===================== */}
      <section id="faq" className="w-full bg-surface-card py-3xl">
        <div className="max-w-[960px] mx-auto px-gutter-mobile lg:px-gutter-desktop">
          <div className="text-left mb-2xl">
            <span className="font-label-sm text-label-sm uppercase tracking-widest text-text-muted mb-xs block">
              Clarity &amp; Governance
            </span>
            <h2 className="font-headline-lg text-headline-lg text-text-primary tracking-tight mb-xs">
              Frequently asked questions
            </h2>
            <p className="font-body-lg text-body-lg text-text-muted">
              Transparent answers about our rubric calibration, security
              protocols, and bias prevention guardrails.
            </p>
          </div>
          <div className="flex flex-col border-t border-border-subtle" id="faq-accordion">
            {FAQ_ITEMS.map((item, i) => {
              const isOpen = openFaq === i;
              return (
                <div key={item.q} className="border-b border-border-subtle faq-item">
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : i)}
                    className="w-full py-lg flex items-center justify-between text-left focus:outline-none"
                    type="button"
                    aria-expanded={isOpen}
                  >
                    <span className="font-title-md text-title-md text-text-primary pr-md">
                      {item.q}
                    </span>
                    <span
                      className="material-symbols-outlined text-text-muted transition-transform duration-200"
                      style={{ transform: isOpen ? "rotate(180deg)" : "none" }}
                    >
                      expand_more
                    </span>
                  </button>
                  {isOpen && (
                    <div className="pb-lg pr-xl">
                      <p className="font-body-md text-body-md text-text-muted leading-relaxed">
                        {item.a}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ===================== FOOTER ===================== */}
      <footer className="w-full bg-surface-card border-t border-border-subtle">
        <div className="max-w-[1280px] mx-auto px-gutter-mobile lg:px-gutter-desktop py-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-xl pb-xl border-b border-border-subtle">
            <div className="md:col-span-2 flex flex-col gap-sm">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary-container text-[24px]">
                  rate_review
                </span>
                <span className="font-title-md text-title-md text-text-primary tracking-tight">
                  AI Review Writer
                </span>
              </div>
              <p className="font-body-sm text-body-sm text-text-muted max-w-sm">
                Performance review drafting powered by precision AI. Built for
                modern managers and HR leaders.
              </p>
            </div>
            <div className="flex flex-col gap-2xs">
              <span className="font-label-sm text-label-sm uppercase text-text-muted tracking-wider mb-2xs">
                Product
              </span>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#output"
              >
                Features
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#how-it-works"
              >
                How it works
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#who"
              >
                Examples
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#faq"
              >
                FAQ
              </a>
            </div>
            <div className="flex flex-col gap-2xs">
              <span className="font-label-sm text-label-sm uppercase text-text-muted tracking-wider mb-2xs">
                Resources
              </span>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#how-it-works"
              >
                Frameworks
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#faq"
              >
                Bias Guard
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="#output"
              >
                Templates
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="mailto:support@aiwritereview.com"
              >
                Email Support
              </a>
            </div>
            <div className="flex flex-col gap-2xs">
              <span className="font-label-sm text-label-sm uppercase text-text-muted tracking-wider mb-2xs">
                Legal
              </span>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="/privacy"
              >
                Privacy Policy
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="/terms"
              >
                Terms of Service
              </a>
              <a
                className="font-body-sm text-body-sm text-text-muted hover:text-text-primary transition-colors"
                href="mailto:support@aiwritereview.com"
              >
                Contact
              </a>
            </div>
          </div>
          <div className="pt-lg flex flex-col sm:flex-row items-center justify-between gap-sm">
            <span className="font-body-sm text-body-sm text-text-muted">
              © 2026 AI Review Writer
            </span>
            <div className="flex flex-wrap items-center gap-lg">
              <span className="font-label-sm text-label-sm text-text-muted">
                Currently free, no credit card required
              </span>
              <span className="font-label-sm text-label-sm text-text-muted">
                Your reviews are never stored on our servers
              </span>
              <span className="font-label-sm text-label-sm text-text-muted">
                We don&apos;t sell your data
              </span>
              <span className="font-label-sm text-label-sm text-text-muted">
                We don&apos;t store your reviews
              </span>
              <span className="font-label-sm text-label-sm text-text-muted">
                Powered by DeepSeek
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-text-muted pt-sm max-w-3xl">
              Your text is sent to our AI provider (DeepSeek) via API to generate
              your review. We don&apos;t store your reviews on our servers, and
              we don&apos;t sell your data. See our{" "}
              <a
                href="/privacy"
                className="text-primary-container hover:text-primary underline underline-offset-2"
              >
                Privacy Policy
              </a>{" "}
              for details, including what DeepSeek&apos;s own policy covers.
            </p>
            <p className="font-label-md text-label-md text-text-muted pt-sm max-w-3xl font-medium">
              AI-generated draft. Review and edit before use. Not a substitute
              for HR, legal, or employment advice.
            </p>
          </div>
        </div>
      </footer>

      {/* ===================== GENERATOR MODAL ===================== */}
      <GeneratorModal
        open={modalOpen}
        defaultFormat={modalDefault}
        onClose={() => setModalOpen(false)}
      />

      {/* ===================== SCORED REVIEW MODAL ===================== */}
      <ScoreGeneratorModal
        open={scoreOpen}
        onClose={() => setScoreOpen(false)}
      />
      </main>
  );
}
