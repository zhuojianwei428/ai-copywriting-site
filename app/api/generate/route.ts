// NOTE: the npm package is named "openai" and is imported here only as a
// wire-compatible chat-completions HTTP client pointed at DeepSeek's endpoint.
// The only upstream service called is DeepSeek; no other provider credential
// is read or used anywhere in this route.
import DeepSeekClient from "openai";
import { SYSTEM_PROMPT, buildPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- 轻量内存限流（MVP 够用，Serverless 重启后失效）----
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

// ---- 简易用量统计（内存，按 UTC 日期计数，仅用于告警）----
const dailyCount = new Map<string, number>();
const DAILY_WARN_THRESHOLD = Number(
  process.env.DAILY_CALL_WARN_THRESHOLD || 500
);
function bumpDaily(): number {
  const day = new Date().toISOString().slice(0, 10);
  const next = (dailyCount.get(day) || 0) + 1;
  dailyCount.set(day, next);
  // 只保留当天，避免 Map 无限增长
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

/** API Key 脱敏：只保留前 3 位与末 4 位，绝不输出完整密钥 */
function maskKey(key: string | undefined): string {
  if (!key) return "(unset)";
  return `${key.slice(0, 3)}***${key.slice(-4)}`;
}

/**
 * 结构化调用日志。
 * 硬约束：不记录用户输入的完整内容（只记录字符长度），不记录明文 API Key。
 */
function logCall(entry: Record<string, unknown>) {
  const line = JSON.stringify({
    ts: new Date().toISOString(),
    route: "/api/generate",
    ...entry,
  });
  if (entry.level === "warn" || entry.level === "error") {
    console.warn(`[gen][${String(entry.level).toUpperCase()}] ${line}`);
  } else {
    console.log(`[gen] ${line}`);
  }
}

const MAX_INPUT_CHARS = Number(process.env.MAX_INPUT_CHARS || 6000);
const MAX_OUTPUT_TOKENS = Number(process.env.MAX_OUTPUT_TOKENS || 700);

export async function POST(req: Request) {
  const ip = getIp(req);
  const startedAt = Date.now();

  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) {
    logCall({
      event: "missing_key",
      level: "error",
      ip,
      keyHint: maskKey(apiKey),
    });
    return Response.json(
      { error: "AI service is not configured. Please set DEEPSEEK_API_KEY." },
      { status: 500 }
    );
  }

  if (isRateLimited(ip, 5)) {
    logCall({
      event: "rate_limited",
      level: "warn",
      ip,
      keyHint: maskKey(apiKey),
      dailyCalls: bumpDaily(),
    });
    return Response.json(
      { error: "Too many requests. Please try again later." },
      { status: 429 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    logCall({ event: "bad_request", ip, keyHint: maskKey(apiKey) });
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { reviewType, jobTitle, employeeName, tenure, strengths, growthAreas, tone } = body;

  if (!reviewType || !tone) {
    logCall({ event: "missing_fields", ip, keyHint: maskKey(apiKey) });
    return Response.json(
      { error: "Missing required fields: reviewType and tone." },
      { status: 400 }
    );
  }

  const safeStrengths: string[] = Array.isArray(strengths) ? strengths : [];
  const safeGrowth: string[] = Array.isArray(growthAreas) ? growthAreas : [];

  // 只统计长度，用于成本观察与异常检测；不落任何原文
  const inputChars = [
    reviewType,
    jobTitle,
    employeeName,
    tenure,
    tone,
    ...safeStrengths,
    ...safeGrowth,
  ]
    .filter((v) => typeof v === "string")
    .reduce((sum: number, v: string) => sum + v.length, 0);

  if (inputChars > MAX_INPUT_CHARS) {
    logCall({
      event: "input_too_long",
      level: "warn",
      ip,
      keyHint: maskKey(apiKey),
      inputChars,
      maxInputChars: MAX_INPUT_CHARS,
    });
    return Response.json(
      { error: "Your input is too long. Please shorten it and try again." },
      { status: 413 }
    );
  }

  const prompt = buildPrompt({
    reviewType,
    jobTitle,
    employeeName,
    tenure,
    strengths: safeStrengths,
    growthAreas: safeGrowth,
    tone,
  });

  const deepseek = new DeepSeekClient({
    apiKey,
    baseURL: process.env.DEEPSEEK_BASE_URL || "https://api.deepseek.com",
  });

  // 注意：deepseek-chat / deepseek-reasoner 已于 2026-07-24 永久停用，
  // 现役模型为 deepseek-v4-flash（默认，成本低）与 deepseek-v4-pro（约 3 倍价格）。
  const model = process.env.DEEPSEEK_MODEL || "deepseek-v4-flash";
  const dailyCalls = bumpDaily();

  if (
    dailyCalls === DAILY_WARN_THRESHOLD ||
    dailyCalls % DAILY_WARN_THRESHOLD === 0
  ) {
    logCall({
      event: "daily_quota_warning",
      level: "warn",
      ip,
      keyHint: maskKey(apiKey),
      model,
      dailyCalls,
      threshold: DAILY_WARN_THRESHOLD,
      message: `Daily generation count reached ${dailyCalls} (threshold ${DAILY_WARN_THRESHOLD}). Check for abuse or unexpected API spend.`,
    });
  }

  try {
    const stream = await deepseek.chat.completions.create({
      model,
      stream: true,
      stream_options: { include_usage: true },
      temperature: 0.7,
      max_tokens: MAX_OUTPUT_TOKENS,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const encoder = new TextEncoder();
    let outputChars = 0;
    let usage: any = null;

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // DeepSeek 在最后一个 chunk 返回 usage（需 stream_options.include_usage）
            const maybeUsage = (chunk as any)?.usage;
            if (maybeUsage) usage = maybeUsage;
            const text = chunk.choices?.[0]?.delta?.content || "";
            if (text) {
              outputChars += text.length;
              controller.enqueue(encoder.encode(text));
            }
          }

          logCall({
            event: "generate_done",
            ip,
            keyHint: maskKey(apiKey),
            model,
            inputChars,
            outputChars,
            promptTokens: usage?.prompt_tokens ?? null,
            completionTokens: usage?.completion_tokens ?? null,
            totalTokens: usage?.total_tokens ?? null,
            durationMs: Date.now() - startedAt,
            dailyCalls,
          });
        } catch {
          logCall({
            event: "stream_error",
            level: "error",
            ip,
            keyHint: maskKey(apiKey),
            model,
            inputChars,
            outputChars,
            durationMs: Date.now() - startedAt,
            dailyCalls,
          });
          controller.enqueue(
            encoder.encode("\n\n[Generation interrupted. Please try again.]")
          );
        } finally {
          controller.close();
        }
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
      },
    });
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
