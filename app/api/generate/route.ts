import OpenAI from "openai";
import { SYSTEM_PROMPT, buildPrompt } from "../../../lib/prompt";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// ---- 轻量内存限流（MVP 够用，Serverless 重启后失效，后续可换 Redis）----
const rateMap = new Map<string, { count: number; resetAt: number }>();
function isRateLimited(ip: string, limit = 10, windowMs = 60_000): boolean {
  const now = Date.now();
  const rec = rateMap.get(ip);
  if (!rec || now > rec.resetAt) {
    rateMap.set(ip, { count: 1, resetAt: now + windowMs });
    return false;
  }
  rec.count += 1;
  return rec.count > limit;
}

function getIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}

export async function POST(req: Request) {
  const ip = getIp(req);
  if (isRateLimited(ip)) {
    return Response.json(
      { error: "You've generated a lot just now. Please try again in a minute." },
      { status: 429 }
    );
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "AI service is not configured. Please set OPENAI_API_KEY." },
      { status: 500 }
    );
  }

  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { reviewType, jobTitle, tenure, strengths, growthAreas, tone } = body;

  if (!reviewType || !tone) {
    return Response.json(
      { error: "Missing required fields: reviewType and tone." },
      { status: 400 }
    );
  }

  const prompt = buildPrompt({
    reviewType,
    jobTitle,
    tenure,
    strengths: Array.isArray(strengths) ? strengths : [],
    growthAreas: Array.isArray(growthAreas) ? growthAreas : [],
    tone,
  });

  const openai = new OpenAI({
    apiKey,
    baseURL: process.env.OPENAI_BASE_URL || undefined,
  });

  const model = process.env.OPENAI_MODEL || "gpt-4o-mini";

  try {
    const stream = await openai.chat.completions.create({
      model,
      stream: true,
      temperature: 0.7,
      max_tokens: 700,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    });

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            const text = chunk.choices?.[0]?.delta?.content || "";
            if (text) controller.enqueue(encoder.encode(text));
          }
        } catch (e) {
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
    const msg =
      e?.status === 401
        ? "AI authentication failed. Check your API key."
        : "The AI service returned an error. Please try again.";
    return Response.json({ error: msg }, { status: 502 });
  }
}
