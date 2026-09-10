import { createHmac, timingSafeEqual } from "crypto";

/**
 * 每日调用配额（零依赖实现，防滥用第一道防线）。
 *
 * 计数放在一个 HMAC 签名的 httpOnly cookie 里：
 *  - 签名防篡改 —— 改数字、改日期都会验签失败，按"新的一天/新用户"重新计数。
 *  - 防不住"清 cookie / 换浏览器 / 换 IP"，这是 Serverless 无状态环境的固有限制。
 *    真要强限制得上服务端存储（Vercel KV / Upstash Redis），见 SKILL 备注。
 *
 * 配额分两档：游客低、登录用户高。这样"免登录可用"和"防刷"能同时成立。
 */

const COOKIE_NAME = "air_quota";

/** 游客每日生成次数（未登录） */
const GUEST_DAILY = Number(process.env.GUEST_DAILY_LIMIT || 5);
/** 登录用户每日生成次数 */
const USER_DAILY = Number(process.env.USER_DAILY_LIMIT || 50);
/** 全站每日上限：超出后暂停服务给游客（登录用户不受影响）—— 保护钱包的总闸 */
const GLOBAL_DAILY = Number(process.env.GLOBAL_DAILY_LIMIT || 500);

function secret(): string {
  return (
    process.env.CLERK_SECRET_KEY ||
    process.env.QUOTA_SECRET ||
    "dev-insecure-secret"
  );
}

function todayUTC(): string {
  return new Date().toISOString().slice(0, 10);
}

function sign(payload: string): string {
  return createHmac("sha256", secret()).update(payload).digest("base64url");
}

function pickCookie(header: string | null, name: string): string | null {
  if (!header) return null;
  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx < 0) continue;
    if (part.slice(0, idx).trim() === name) {
      return decodeURIComponent(part.slice(idx + 1).trim());
    }
  }
  return null;
}

interface QuotaState {
  /** UTC 日期，如 "2026-09-10" */
  d: string;
  /** 当天已用次数 */
  n: number;
}

/** 解析并验签配额 cookie；无效返回 null。 */
export function readQuota(cookieHeader: string | null): QuotaState | null {
  const raw = pickCookie(cookieHeader, COOKIE_NAME);
  if (!raw) return null;
  const idx = raw.lastIndexOf(".");
  if (idx <= 0) return null;
  const payload = raw.slice(0, idx);
  const sig = raw.slice(idx + 1);
  const expect = sign(payload);
  if (sig.length !== expect.length) return null;
  // 定长比较，避免时序侧信道
  if (!timingSafeEqual(Buffer.from(sig), Buffer.from(expect))) return null;
  try {
    const o = JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
    if (typeof o?.d === "string" && Number.isFinite(o?.n)) {
      return { d: o.d, n: o.n as number };
    }
  } catch {
    // 解析失败 → 视作没有配额记录
  }
  return null;
}

/** 生成 Set-Cookie 头（httpOnly + 2 天过期）。 */
export function writeQuota(state: QuotaState): string {
  const payload = Buffer.from(JSON.stringify(state)).toString("base64url");
  const value = `${payload}.${sign(payload)}`;
  return `${COOKIE_NAME}=${value}; Path=/; HttpOnly; SameSite=Lax; Max-Age=172800`;
}

// ---- 全站每日计数（内存，按 UTC 日期；Serverless 多实例下不精确，仅作总闸）----
const globalDaily = new Map<string, number>();

function bumpGlobal(): number {
  const day = todayUTC();
  const next = (globalDaily.get(day) || 0) + 1;
  globalDaily.set(day, next);
  for (const key of globalDaily.keys()) {
    if (key !== day) globalDaily.delete(key);
  }
  return next;
}

export interface QuotaResult {
  allowed: boolean;
  /** 本档位上限 */
  limit: number;
  /** 本次消耗后已用次数 */
  used: number;
  /** 需要写回浏览器的 Set-Cookie 值（仅 allowed 时有） */
  setCookie?: string;
  /** 被拒原因（仅 !allowed 时有） */
  reason?: string;
  /** 是否建议引导登录 */
  requireSignIn?: boolean;
}

/**
 * 扣减一次配额。
 * @param cookieHeader 请求里的 Cookie 头
 * @param userId Clerk 用户 id；游客传 null
 */
export function consumeQuota(
  cookieHeader: string | null,
  userId: string | null
): QuotaResult {
  const today = todayUTC();
  const limit = userId ? USER_DAILY : GUEST_DAILY;

  // 总闸：全站额度用尽后，只服务登录用户（游客引导去注册）
  const g = bumpGlobal();
  if (!userId && g > GLOBAL_DAILY) {
    return {
      allowed: false,
      limit,
      used: limit,
      reason:
        "We've hit today's site-wide free limit. Please sign in to keep generating.",
      requireSignIn: true,
    };
  }

  const prev = readQuota(cookieHeader);
  const used = prev && prev.d === today ? prev.n : 0;

  if (used >= limit) {
    return {
      allowed: false,
      limit,
      used,
      reason: userId
        ? "You've reached today's generation limit. Please try again tomorrow."
        : "You've used all free generations for today. Sign in to keep going.",
      requireSignIn: !userId,
    };
  }

  const next = used + 1;
  return {
    allowed: true,
    limit,
    used: next,
    setCookie: writeQuota({ d: today, n: next }),
  };
}

/** 给响应用途：把配额 cookie 挂到任何 Response 上。 */
export function withQuotaCookie(res: Response, setCookie?: string): Response {
  if (setCookie) res.headers.append("Set-Cookie", setCookie);
  return res;
}
