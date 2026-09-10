// NOTE: the npm package is named "openai" and is imported here only as a
// wire-compatible chat-completions HTTP client pointed at DeepSeek's endpoint.
// The only upstream service called is DeepSeek; no other provider credential
// is read or used anywhere in this route.
import DeepSeekClient from "openai";
import {
  SYSTEM_PROMPT,
  buildPrompt,
  BLOCK_MARKERS,
  conductedText,
  overviewMetaLine,
} from "../../../lib/prompt";
import { currentUserId } from "../../../lib/clerk/requireUser";
import { consumeQuota, withQuotaCookie } from "../../../lib/quotas";
import { estimateCost, cacheHitTokens } from "../../../lib/cost";

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
// 现役输出为 600-900 词的完整 7 部分绩效表（约 800-1300 tokens）。
// 上限只是保险丝（避免长报告被硬截断），模型写到自然结束即停，不会强制用满。
/**
 * 输出预算。
 *
 * ⚠️ 不能按"报告只要 ~1000 token"来设：**推理型模型的 reasoning token 与正文共用
 * 这一份预算**。设成 1600 时实测三次里两次正文被截断在句子中间、或整段为空，
 * 服务端只能补上模板尾 —— 用户看到的就是半截报告。
 * 这里给足余量并设下限，避免环境变量被设小又把产品搞坏。
 */
const MAX_OUTPUT_TOKENS = Math.max(
  8192,
  Number(process.env.MAX_OUTPUT_TOKENS || 0) || 0
);

/**
 * 生成对游客开放（免登录），靠每日配额而不是登录墙来防滥用：
 *  - 游客：GUEST_DAILY_LIMIT 次/天（默认 5）
 *  - 登录：USER_DAILY_LIMIT 次/天（默认 50）
 *  - 全站：GLOBAL_DAILY_LIMIT 次/天（默认 500），超出后只服务登录用户
 * 计数写在签名 cookie 里，见 lib/quotas.ts。
 */
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

  // 模板化章节由服务端拼装，模型不写（省 12-18% 输出 token）：
  // 标题编号、第 2 部分流程说明、第 1 部分的姓名/职位/任期骨架、第 7 部分。
  const metaLine = overviewMetaLine({
    reviewType,
    jobTitle,
    employeeName,
    tenure,
    strengths: safeStrengths,
    growthAreas: safeGrowth,
    tone,
  });
  const blockReplacements: Record<string, string> = {
    "[[OVERVIEW]]": `1. Basic Overview\n${metaLine ? `${metaLine}\n\n` : ""}`,
    "[[FRAMEWORK]]": `\n\n2. How This Evaluation Was Conducted\n${conductedText(
      reviewType
    )}\n\n3. Evaluation Framework\n`,
    "[[GOALS]]": "\n\n4. Progress Against Goals\n",
    "[[CHALLENGES]]": "\n\n5. Challenges & Analysis of Causes\n",
    "[[CONCLUSION]]": "\n\n6. Conclusion & Recommendations\n",
  };
  const REPORT_TAIL = "\n\n7. Other Notes\nNone.";

  /**
   * 把模型输出里的块标记替换成模板文本。
   * 标记可能被切到两个 chunk 里（"[[FRAM" + "EWORK]]"），所以尾部要留一段缓冲。
   * 模型若完全没用标记（降级），输出原样透传 —— 内容不丢，只是少了标题编号。
   */
  let carry = "";
  let markersHit = 0;
  function transform(text: string, flush = false): string {
    carry += text;
    let out = "";
    for (;;) {
      let idx = -1;
      let mark = "";
      for (const m of BLOCK_MARKERS) {
        const i = carry.indexOf(m);
        if (i >= 0 && (idx === -1 || i < idx)) {
          idx = i;
          mark = m;
        }
      }
      if (idx === -1) break;
      out += carry.slice(0, idx) + (blockReplacements[mark] ?? "");
      markersHit += 1;
      carry = carry.slice(idx + mark.length);
    }
    if (flush) {
      out += carry;
      carry = "";
      return out;
    }
    // 尾部若是不完整标记的前缀，留到下一个 chunk 再判定
    let keep = 0;
    for (const m of BLOCK_MARKERS) {
      const max = Math.min(m.length - 1, carry.length);
      for (let n = max; n > 0; n--) {
        if (carry.endsWith(m.slice(0, n))) {
          if (n > keep) keep = n;
          break;
        }
      }
    }
    if (keep > 0) {
      out += carry.slice(0, carry.length - keep);
      carry = carry.slice(carry.length - keep);
    } else {
      out += carry;
      carry = "";
    }
    return out;
  }

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
    /** 模型真正吐出的正文字符数（0 = 正文为空，全被推理吃掉或上游异常） */
    let aiChars = 0;
    /** reasoning_content 字符数 —— 与正文共用 max_tokens，是截断的嫌疑主因 */
    let reasoningChars = 0;
    /** "stop" = 正常结束；"length" = 撞到 max_tokens 被截断 */
    let finishReason = "";

    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // DeepSeek 在最后一个 chunk 返回 usage（需 stream_options.include_usage）
            const maybeUsage = (chunk as any)?.usage;
            if (maybeUsage) usage = maybeUsage;
            const choice: any = chunk.choices?.[0];
            if (choice?.finish_reason) finishReason = String(choice.finish_reason);
            const delta: any = choice?.delta || {};
            // 推理型模型把思考放在 reasoning_content：不进正文，但要单独计数
            if (delta.reasoning_content) {
              reasoningChars += String(delta.reasoning_content).length;
            }
            const text = delta.content || "";
            if (text) {
              aiChars += text.length;
              const rendered = transform(text);
              if (rendered) {
                outputChars += rendered.length;
                controller.enqueue(encoder.encode(rendered));
              }
            }
          }

          // 收尾：吐出残留缓冲 + 追加模板化的第 7 部分
          const tail = transform("", true) + REPORT_TAIL;
          outputChars += tail.length;
          controller.enqueue(encoder.encode(tail));

          const incomplete =
            aiChars === 0 ||
            markersHit < BLOCK_MARKERS.length ||
            finishReason === "length";

          logCall({
            event: "generate_done",
            // 不完整的调用升到 warn：在 Vercel 面板按 level:warning 过滤即可
            // 只看到出问题的那些，不必在 info 洪流里逐条翻。
            level: incomplete ? "warn" : undefined,
            ip,
            keyHint: maskKey(apiKey),
            model,
            // 预算与模型的实际生效值 —— 核查 env 时看这两个就够，不用翻面板
            maxOutputTokens: MAX_OUTPUT_TOKENS,
            inputChars,
            outputChars,
            markersHit,
            // 诊断三元组：正文为空 / 被截断时靠这三个字段定位原因
            aiChars,
            reasoningChars,
            finishReason: finishReason || null,
            incomplete,
            aiTokens: usage?.completion_tokens ?? null,
            promptTokens: usage?.prompt_tokens ?? null,
            completionTokens: usage?.completion_tokens ?? null,
            totalTokens: usage?.total_tokens ?? null,
            cacheHitTokens: cacheHitTokens(usage),
            cacheMissTokens: usage?.prompt_cache_miss_tokens ?? null,
            costCNY: estimateCost(
              usage?.prompt_tokens,
              usage?.completion_tokens,
              cacheHitTokens(usage)
            ),
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
