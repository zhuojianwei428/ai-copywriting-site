import type { KraInput } from "./score";

/**
 * Scoring-mode system prompt. Hard constraints:
 *  - Output ONE JSON object, nothing before/after.
 *  - The model assigns 1–5 stars per KRA; the CLIENT computes weighted
 *    totals from stars + weights, so the model must NEVER return totals.
 *  - Only score what the user provided. No invented metrics.
 */
export const SCORE_SYSTEM_PROMPT = `You are an expert HR performance-appraisal reviewer producing a structured, evidence-based scorecard in the style of an enterprise HRMS (key-result-area evaluation).

You will receive a role, optional appraisal cycle, and a list of KRAs each with a weight (%) and optional goal-completion (%) and evidence.

Your job: assign each KRA a fair score on a 1-5 star scale, and write concise professional rationale. Use the full 1-5 range honestly — not everything is a 4 or 5.

Scoring anchors (use consistently):
1 = Significantly below expectations
2 = Below expectations
3 = Meets expectations
4 = Exceeds expectations
5 = Outstanding / far exceeds

Rules:
- Score ONLY based on evidence the user supplied. If an area has no evidence, default to a neutral 3 and say the basis needs more documentation. Never invent metrics, dates, or achievements.
- Keep each "basis" to one tight sentence (12-25 words), grounded in what was provided.
- Weighted totals and overall score are computed by the system — do NOT include them.
- Return ONLY a single valid JSON object with this exact shape (no markdown fences, no commentary):

{
  "kra_scores": [
    { "score": 4, "basis": "Concise justification referencing supplied evidence." }
  ],
  "overall": "3-4 sentence neutral summary of overall performance.",
  "strengths": "Short paragraph, 2-3 bullets joined by newlines, of proven strengths.",
  "growth": "Short paragraph, 2-3 bullets joined by newlines, constructive areas for growth.",
  "next_steps": "Short paragraph of 2-3 forward-looking actions."
}

The "kra_scores" array MUST have exactly the same length and order as the KRA list you are given. Output strictly valid JSON.`;

export interface ScoreGenerateInput {
  jobTitle?: string;
  cycle?: string;
  reviewType: string;
  kra: KraInput[];
  strengths?: string;
  growthAreas?: string;
  tone: string;
}

export function buildScorePrompt(input: ScoreGenerateInput): string {
  const kraLines = input.kra.map((k, i) => {
    const parts = [
      `KRA ${i + 1}: ${k.name || "(unnamed)"}`,
      `Weight: ${k.weight ?? 0}%`,
    ];
    if (k.goalCompletion != null && Number.isFinite(k.goalCompletion))
      parts.push(`Goal completion: ${k.goalCompletion}%`);
    if (k.evidence && k.evidence.trim())
      parts.push(`Evidence: ${k.evidence.trim()}`);
    return parts.join(" | ");
  });

  const labels: Record<string, string> = {
    self: "Self review",
    manager: "Manager review",
    peer: "Peer review",
    "360": "360-degree feedback",
  };
  const reviewTypeLabel = labels[input.reviewType] || input.reviewType;

  return `Review type: ${reviewTypeLabel}
Job title: ${input.jobTitle || "N/A"}
Appraisal cycle: ${input.cycle || "N/A"}

Key Result Areas to score (weighted):
${kraLines.join("\n")}

Additional strengths observed:
${input.strengths || "(none provided)"}

Additional areas for growth:
${input.growthAreas || "(none provided)"}

Tone: ${input.tone}`;
}
