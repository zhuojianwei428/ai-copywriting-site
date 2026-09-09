/**
 * Structured KRA-based scoring — mirrors the methodology used by Frappe HRMS
 * performance appraisals:
 *   - Each Key Result Area (KRA) carries a weight (%), weights must total 100.
 *   - The AI assigns a 1–5 star score per KRA.
 *   - Weighted score per KRA = star × weight / 100.
 *   - Total = Σ weighted scores → a 0–5 figure.
 *
 * The scoring math is deterministic (computed here on the client from the
 * AI-assigned stars), so results are reproducible and defensible — the model
 * never computes totals itself.
 */

export interface KraInput {
  /** e.g. "Product Delivery" */
  name: string;
  /** weight percentage, 0–100 */
  weight: number;
  /** (optional) goal completion %, 0–100 — mirrors hrms goal_completion */
  goalCompletion?: number | null;
  /** (optional) short evidence note the user provides */
  evidence?: string;
}

export interface ScoredKra {
  name: string;
  weight: number;
  goalCompletion?: number | null;
  /** AI-assigned 1–5 star */
  score: number;
  /** AI rationale line */
  basis: string;
  /** weight × score / 100 (1 decimal) */
  weighted: number;
}

export interface ScoreResult {
  items: ScoredKra[];
  /** Σ weighted, 0–5 */
  total: number;
  /** 0–100 equivalent */
  percent: number;
  /** letter grade A–D derived from total */
  grade: string;
  gradeLabel: string;
  /** narrative sections rendered alongside the table */
  overall: string;
  strengths: string;
  growth: string;
  nextSteps: string;
}

export const MAX_STARS = 5;

/** hrms style: percent(0-100) -> 0-5 by /20 (reused as a sanity helper). */
export function percentToScore(pct: number): number {
  return Math.min(MAX_STARS, Math.max(0, pct / 20));
}

/**
 * Deterministic scorecard computation. `weighted` and `total` are always
 * derived here from the raw stars — never trusted from the model.
 */
export function computeScorecard(
  kraStars: { score: number }[],
  weights: number[]
): { items: { weighted: number }[]; total: number; percent: number } {
  const items = kraStars.map((k, i) => {
    const w = weights[i] ?? 0;
    const weighted = (clampScore(k.score) * w) / 100;
    return { weighted: round1(weighted) };
  });
  const total = round2(items.reduce((s, it) => s + it.weighted, 0));
  const percent = Math.min(100, Math.max(0, round1((total / MAX_STARS) * 100)));
  return { items, total, percent };
}

/** Validate weightage: returns error string if not ~100. */
export function weightError(kras: KraInput[]): string | null {
  const sum = kras.reduce((s, k) => s + (Number(k.weight) || 0), 0);
  if (kras.length === 0) return "Add at least one KRA.";
  if (kras.length > 6) return "Keep it to 6 KRAs max for a readable scorecard.";
  if (Math.abs(sum - 100) > 0.5)
    return `KRA weights must total 100%. Currently ${round1(sum)}%.`;
  return null;
}

export function gradeOf(total: number): { grade: string; label: string } {
  if (total >= 4.5) return { grade: "A", label: "Outstanding" };
  if (total >= 3.5) return { grade: "B", label: "Exceeds Expectations" };
  if (total >= 2.5) return { grade: "C", label: "Meets Expectations" };
  return { grade: "D", label: "Below Expectations" };
}

export function clampScore(s: number): number {
  if (!Number.isFinite(s)) return 0;
  return Math.min(MAX_STARS, Math.max(0, Math.round(s * 2) / 2)); // 0.5 steps
}

export function round1(n: number): number {
  return Math.round(n * 10) / 10;
}
export function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** Human friendly weighted label e.g. "3.0 × 30% = 0.90" */
export function weightedLabel(star: number, weight: number): string {
  return `${star.toFixed(1)} × ${round1(weight)}% = ${round1((clampScore(star) * weight) / 100).toFixed(2)}`;
}
