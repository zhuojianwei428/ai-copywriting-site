"use client";

import { useState } from "react";
import { Check, Copy, Pencil, RefreshCw, FileText, FileDown, ArrowLeft } from "lucide-react";
import { CssText } from "./CssText";
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

function toggle(list: string[], v: string): string[] {
  return list.includes(v) ? list.filter((x) => x !== v) : [...list, v];
}

export default function Wizard() {
  const [step, setStep] = useState<number>(1);
  const [reviewType, setReviewType] = useState<ReviewType | null>(null);
  const [jobTitle, setJobTitle] = useState("");
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

  const canGoBack = step > 1 && step < 5;

  return (
    <div className="container" style={{ marginTop: 24 }}>
      {/* 进度条 */}
      {step < 5 && (
        <div style={{ marginBottom: 18 }}>
          <div className="progress-track">
            {[1, 2, 3, 4].map((s) => (
              <div
                key={s}
                className={`progress-seg ${step === s ? "active" : ""} ${step > s ? "done" : ""}`}
                onClick={() => s < step && setStep(s)}
                title={`Step ${s}`}
              />
            ))}
          </div>
          <div style={{ color: "var(--muted)", fontSize: 13, marginTop: 6 }}>
            Step {step} of 4
          </div>
        </div>
      )}

      <div className="result-card">
        {/* ===================== STEP 1 ===================== */}
        {step === 1 && (
          <div>
            <h2 style={{ marginTop: 0 }}>What type of review are you writing?</h2>
            <p style={{ color: "var(--muted)", marginTop: -6 }}>
              Choose the perspective. This shapes the tone and structure.
            </p>
            <div style={{ display: "grid", gap: 12 }}>
              {REVIEW_TYPES.map((t) => (
                <div
                  key={t.id}
                  className={`opt-card ${reviewType === t.id ? "selected" : ""}`}
                  onClick={() => setReviewType(t.id as ReviewType)}
                >
                  <span className="check">
                    <Check size={20} />
                  </span>
                  <span>
                    <div style={{ fontWeight: 600 }}>
                      <CssText text={t.title} as="span" />
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 14 }}>{t.desc}</div>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ marginTop: 16 }}>
              <button
                className="btn btn-primary btn-block"
                disabled={!reviewType}
                onClick={() => setStep(2)}
              >
                <CssText text="Continue" as="span" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 2 ===================== */}
        {step === 2 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Tell us about the role</h2>
            <p style={{ color: "var(--muted)", marginTop: -6 }}>
              Optional, but it makes the review far more specific.
            </p>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Job title
            </label>
            <input
              type="text"
              value={jobTitle}
              onChange={(e) => setJobTitle(e.target.value)}
              placeholder="e.g. Senior Marketing Manager"
              style={{
                width: "100%",
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                font: "inherit",
                marginBottom: 18,
              }}
            />
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>
              Time in this role
            </label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10 }}>
              {TENURES.map((t) => (
                <button
                  key={t}
                  className={`chip ${tenure === t ? "selected" : ""}`}
                  onClick={() => setTenure(t)}
                >
                  <CssText text={t} as="span" />
                </button>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setStep(1)}>
                <ArrowLeft size={16} /> <CssText text="Back" as="span" />
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(3)}>
                <CssText text="Continue" as="span" />
              </button>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                <CssText text="Skip this step" as="span" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 3 ===================== */}
        {step === 3 && (
          <div>
            <h2 style={{ marginTop: 0 }}>What went well?</h2>
            <p style={{ color: "var(--muted)", marginTop: -6 }}>
              Tap everything that applies. The more you pick, the better the output.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginBottom: 18 }}>
              {STRENGTHS.map((s) => (
                <button
                  key={s}
                  className={`chip ${strengths.includes(s) ? "selected" : ""}`}
                  onClick={() => setStrengths((p) => toggle(p, s))}
                >
                  <CssText text={s} as="span" />
                </button>
              ))}
            </div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 6 }}>
              Anything else? Add specific numbers or projects.
            </label>
            <textarea
              value={freeNote}
              onChange={(e) => setFreeNote(e.target.value)}
              placeholder="e.g. Led the Q2 checkout rebuild, cut cart abandonment by 18%"
              style={{
                width: "100%",
                minHeight: 90,
                padding: "12px 14px",
                border: "1px solid var(--border)",
                borderRadius: 10,
                font: "inherit",
                resize: "vertical",
              }}
            />
            <div style={{ display: "flex", gap: 10, marginTop: 18 }}>
              <button className="btn btn-secondary" onClick={() => setStep(2)}>
                <ArrowLeft size={16} /> <CssText text="Back" as="span" />
              </button>
              <button className="btn btn-primary" style={{ flex: 1 }} onClick={() => setStep(4)}>
                <CssText text="Continue" as="span" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== STEP 4 ===================== */}
        {step === 4 && (
          <div>
            <h2 style={{ marginTop: 0 }}>Any areas for growth?</h2>
            <p style={{ color: "var(--muted)", marginTop: -6 }}>
              Choose a tone — this is the last step.
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 10, margin: "10px 0 20px" }}>
              {GROWTH.map((g) => (
                <button
                  key={g}
                  className={`chip ${growthAreas.includes(g) ? "selected" : ""}`}
                  onClick={() => setGrowthAreas((p) => toggle(p, g))}
                >
                  <CssText text={g} as="span" />
                </button>
              ))}
            </div>
            <label style={{ display: "block", fontWeight: 600, marginBottom: 8 }}>Tone</label>
            <div style={{ display: "grid", gap: 12 }}>
              {TONES.map((t) => (
                <div
                  key={t.id}
                  className={`opt-card ${tone === t.id ? "selected" : ""}`}
                  onClick={() => setTone(t.id as Tone)}
                >
                  <span className="check">
                    <Check size={20} />
                  </span>
                  <span>
                    <div style={{ fontWeight: 600 }}>
                      <CssText text={t.id} as="span" />
                    </div>
                    <div style={{ color: "var(--muted)", fontSize: 14 }}>{t.desc}</div>
                  </span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 20 }}>
              <button className="btn btn-secondary" onClick={() => setStep(3)}>
                <ArrowLeft size={16} /> <CssText text="Back" as="span" />
              </button>
              <button
                className="btn btn-primary"
                style={{ flex: 1 }}
                disabled={!tone || loading}
                onClick={handleGenerate}
              >
                <CssText text="Generate My Review" as="span" />
              </button>
            </div>
          </div>
        )}

        {/* ===================== RESULT (step 5) ===================== */}
        {step === 5 && (
          <div id="result-section">
            <h2 style={{ marginTop: 0 }}>Your performance review</h2>
            {loading ? (
              <div>
                <div className="skeleton lg" />
                <div className="skeleton" />
                <div className="skeleton" />
                <div className="skeleton lg" />
                <div className="skeleton" />
                <div style={{ color: "var(--muted)", fontSize: 14 }}>
                  Writing your performance review...
                </div>
              </div>
            ) : editing ? (
              <div className="result-text">
                <textarea value={draft} onChange={(e) => setDraft(e.target.value)} />
                <div style={{ marginTop: 12 }}>
                  <button className="btn btn-primary" onClick={saveEdit}>
                    <CssText text="Save" as="span" />
                  </button>
                </div>
              </div>
            ) : (
              <div className="result-text">{result}</div>
            )}

            {error && (
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 10,
                  background: "#fef2f2",
                  color: "#b91c1c",
                  fontSize: 14,
                }}
              >
                {error}
                <div style={{ marginTop: 8 }}>
                  <button className="btn btn-secondary" onClick={handleGenerate}>
                    <RefreshCw size={16} /> <CssText text="Retry" as="span" />
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && (
              <div
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <button className="btn btn-secondary" onClick={handleCopy}>
                  <Copy size={16} /> <CssText text={copied ? "Copied" : "Copy"} as="span" />
                </button>
                <button className="btn btn-secondary" onClick={startEdit}>
                  <Pencil size={16} /> <CssText text="Edit" as="span" />
                </button>
                <button className="btn btn-secondary" onClick={handleGenerate}>
                  <RefreshCw size={16} /> <CssText text="Regenerate" as="span" />
                </button>
                <button className="btn btn-success" onClick={downloadPDF}>
                  <FileText size={16} /> <CssText text="Download PDF" as="span" />
                </button>
                <button className="btn btn-success" onClick={() => downloadWord(result)}>
                  <FileDown size={16} /> <CssText text="Download Word" as="span" />
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
