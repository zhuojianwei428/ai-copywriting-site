import { auth } from "@clerk/nextjs/server";

/**
 * Clerk 是否已在服务端配置齐全。
 *
 * 需要 publishable key（前端可见）与 secret key（仅服务端）同时存在：
 * 只有 publishable key 时 `auth()` 无法验证会话，此时按"未配置"处理，
 * 保持全站公开，避免把站点锁死在一个半配置状态里。
 */
export function isClerkConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY && process.env.CLERK_SECRET_KEY
  );
}

/**
 * 服务端鉴权（供 /api/* Route Handler 使用）。
 *
 * - Clerk 未配置时返回 null（放行）——登录墙上线前的公开行为，便于本地开发。
 * - 已配置时要求存在已登录会话；无会话返回 { error }，调用方应回 401。
 *
 * 这是"调用 AI 前拦门"的服务端兜底：即使有人绕过前端直接 POST，也拿不到 DeepSeek。
 */
export async function requireUser(): Promise<{ error: string } | null> {
  if (!isClerkConfigured()) return null; // 未配置 → 不拦截
  try {
    const { userId } = await auth();
    if (!userId) return { error: "Please sign in to continue." };
    return null;
  } catch {
    return { error: "Authentication is unavailable. Please try again." };
  }
}

/**
 * 取当前登录用户 id，**不拦截**（游客返回 null）。
 *
 * 用于"免登录也能用，但登录用户额度更高"的配额分档 —— 生成接口已对游客开放，
 * 这里只是识别身份，决定是否给更高的每日上限。
 */
export async function currentUserId(): Promise<string | null> {
  if (!isClerkConfigured()) return null;
  try {
    const { userId } = await auth();
    return userId ?? null;
  } catch {
    return null;
  }
}
