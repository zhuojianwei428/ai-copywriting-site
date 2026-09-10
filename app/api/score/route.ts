// Scoring route: asks DeepSeek to assign 1-5 stars per KRA and returns a
// parsed, validated scorecard. Weighted totals are computed client-side in
// lib/score.ts (deterministic), so the model output is only stars + rationale.
// No other provider is called; the `openai` package is used purely as a
// wire-compatible client against DeepSeek's endpoint.
import DeepSeekClient from "openai";
import { SCORE_SYSTEM_PROMPT, buildScorePrompt } from "../../../lib/scorePrompt";
import { computeScorecard, gradeOf, type KraInput } from "../../../lib/score";
import { currentUserId } from "../../../lib/clerk/requireUser";
import { consumeQuota, withQuotaCookie } from "../../../lib/quotas";
import { estimateCost, cacheHitTokens } from "../../../lib/cost";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- lightweight in-memory rate limit (MVP; resets on Serverless cold start) ----
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string, limit = 5, windowMs = 60_000): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > limit;
}

const dailyCount = new Map<string, number>();
const DAILY_WARN_THRESHOLD = Number(
  process.env.DAILY_CALL_WARN_THRESHOLD || 500
);
function bumpDaily(): number {
  const day = new Date().toISOString().slice(0, 10);
  const next = (dailyCount.get(day) || 0) + 1;
  dailyCount.set(day, next);
  for (const key of dailyCount.keys()) {
    if (key !== day) dailyCount.delete(key);
  }
  return next;
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

function maskKey(key: string | undefined): string {
  if (!key) return "(unset)";
  return `${key.slice(0, 3)}***${key.slice(-4)}`;
}

function logCall(entry: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    route: "/api/score",
    ...entry,
  });
  if (entry.level === "warn" || entry.level === "error") {
    console.warn(`[score][${String(entry.level).toUpperCase()}] ${line}`);
  } else {
    console.log(`[score] ${line}`);
  }
}

const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 6000);
/**
 * 输出预算 —— 同 generate 路由：推理 token 与正文共用预算，设小了 JSON 会被
 * 截断成非法格式（解析失败=整个功能报错），所以给足余量并设下限。
 */
const MAX_OUTPUT_TOKENS = Math.max(
  8192,
  Number(process.env.MAX_SCORE_OUTPUT_TOKENS || 0) || 0
);

interface ScoreBody {
  reviewType: string;
  jobTitle?: string;
  cycle?: string;
  tone: string;
  strengths?: string;
  growthAreas?: string;
  kra: KraInput[];
}

/** Tolerant JSON extraction: strip fences, find first { ... } block. */
function extractJson(text: string): any | null {
  let s = text.trim();
  s = s.replace(/```json/gi, "```").replace(/```/g, "");
  const start = s.indexOf("{");
  const end = s.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) return null;
  try {
    return JSON.parse(s.slice(start, end + 1));
  } catch {
    return null;
  }
}

/** 与 /api/generate 同一套配额：游客可用，超限引导注册。 */
export async function POST(req: Request): Promise<Response> {
  const userId = await currentUserId();
  const quota = consumeQuota(req.headers.get("cookie"), userId);

  if (!quota.allowed) {
    logCall({
      event: "quota_exceeded",
      level: "warn",
      ip: getIp(req),
      signedIn: Boolean(userId),
      used: quota.used,
      limit: quota.limit,
    });
    return Response.json(
      {
        error: quota.reason,
        code: "quota_exceeded",
        requireSignIn: Boolean(quota.requireSignIn),
      },
      { status: 429 }
    );
  }

  const res = await handlePost(req);
  return withQuotaCookie(res, quota.setCookie);
}

async function handlePost(req: Request) {
  const ip = getIp(req);
  const startedAt = Date.now();

  const apiKey = process.env.DEEPSEEK_API_KEY;

  if (!apiKey) {
    logCall({ event: "missing_key", level: "error", ip, keyHint: maskKey(apiKey) });
    return Response.json(
      { error: "AI service is not configured. Please set DEEPSEEK_API_KEY." },
      { status: 500 }
    );
  }

  if (isRateLimited(ip, 5)) {
    logCall({ event: "rate_limited", level: "warn", ip, keyHint: maskKey(apiKey) });
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: ScoreBody;
  try {
    body = (await req.json()) as ScoreBody;
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const kra = Array.isArray(body.kra)
    ? body.kra.filter((k) => k && k.name && String(k.name).trim())
    : [];
  if (kra.length === 0) {
    return Response.json(
      { error: "Provide at least one KRA with a name." },
      { status: 400 }
    );
  }
  if (!body.reviewType || !body.tone) {
    return Response.json(
      { error: "Missing required fields: reviewType and tone." },
      { status: 400 }
    );
  }

  // 权重合计校验（镜像 lib/score.weightError 但这里宽松到可容错，避免 429 之前卡）
  const weightSum = kra.reduce((s, k) => s + (Number(k.weight) || 0), 0);

  const bodyJson = JSON.stringify(body);
  if (bodyJson.length > MAX_INPUT_CHARS) {
    return Response.json(
      { error: "Your input is too long. Please shorten it and try again." },
      { status: 413 }
    );
  }
  const inputChars = bodyJson.length;

  const prompt = buildScorePrompt({
    reviewType: body.reviewType,
    jobTitle: body.jobTitle,
    cycle: body.cycle,
    tone: body.tone,
    strengths: body.strengths,
    growthAreas: body.growthAreas,
    kra,
  });

  const dailyCalls = bumpDaily();
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";

  try {
    const deepseek = new DeepSeekClient({
      apiKey,
      baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
    });

    const completion = await deepseek.chat.completions.create({
      model,
      stream: false,
      temperature: 0.4,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: SCORE_SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const raw = completion.choices?.[0]?.message?.content || "";
    const parsed = extractJson(raw);
    const usage = (completion as any)?.usage;

    if (!parsed || !Array.isArray(parsed.kra_scores)) {
      logCall({
        event: "score_parse_failed",
        level: "warn",
        ip,
        keyHint: maskKey(apiKey),
        model,
        inputChars,
        outputChars: raw.length,
        durationMs: Date.now() - startedAt,
        dailyCalls,
      });
      return Response.json(
        {
          error:
            "The model did not return a valid scorecard. Please try again.",
          raw: raw.slice(0, 600),
        },
        { status: 502 }
      );
    }

    const stars = parsed.kra_scores;
    const weights = kra.map((k) => Number(k.weight) || 0);
    const calc = computeScorecard(stars, weights);
    const grade = gradeOf(calc.total);

    const items = kra.map((k, i) => ({
      name: String(k.name).trim(),
      weight: weights[i],
      goalCompletion:
        k.goalCompletion != null && Number.isFinite(k.goalCompletion)
          ? Number(k.goalCompletion)
          : null,
      score: Number(stars[i]?.score) || 0,
      basis: String(stars[i]?.basis || "").trim(),
      weighted: calc.items[i]?.weighted ?? 0,
    }));

    logCall({
      event: "score_done",
      ip,
      keyHint: maskKey(apiKey),
      model,
      inputChars,
      outputChars: raw.length,
      promptTokens: usage?.prompt_tokens ?? null,
      completionTokens: usage?.completion_tokens ?? null,
      totalTokens: usage?.total_tokens ?? null,
      cacheHitTokens: cacheHitTokens(usage),
      costCNY: estimateCost(
        usage?.prompt_tokens,
        usage?.completion_tokens,
        cacheHitTokens(usage)
      ),
      kraCount: items.length,
      weightSum: Math.round(weightSum * 100) / 100,
      total: calc.total,
      durationMs: Date.now() - startedAt,
      dailyCalls,
    });

    return Response.json(
      {
        ok: true,
        items,
        total: calc.total,
        percent: calc.percent,
        grade: grade.grade,
        gradeLabel: grade.label,
        weightSum: Math.round(weightSum * 100) / 100,
        overall: String(parsed.overall || "").trim(),
        strengths: String(parsed.strengths || "").trim(),
        growth: String(parsed.growth || "").trim(),
        nextSteps: String(parsed.next_steps || "").trim(),
      },
      { headers: { "Cache-Control": "no-store" } }
    );
  } catch (e: any) {
    logCall({
      event: "upstream_error",
      level: "error",
      ip,
      keyHint: maskKey(apiKey),
      model,
      inputChars,
      upstreamStatus: e?.status ?? null,
      durationMs: Date.now() - startedAt,
      dailyCalls,
    });
    const msg =
      e?.status === 401
        ? "AI authentication failed. Check your API key."
        : "The AI service returned an error. Please try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
