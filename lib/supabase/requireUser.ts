import { isSupabaseConfigured } from "./env";
import { createClient } from "./server";

/**
 * 服务端鉴权（供 /api/* Route Handler 使用）。
 *
 * - Supabase 未配置时返回 null（放行）——保持登录墙上线前的公开行为，便于本地开发。
 * - Supabase 已配置时要求存在已登录会话；无会话返回 { error }，调用方应回 401。
 *
 * 这是"付费前拦门"的服务端兜底：即使有人绕过前端直接 POST，也拿不到 DeepSeek。
 */
export async function requireUser(): Promise<{ error: string } | null> {
  if (!isSupabaseConfigured()) return null; // Supabase 未配置 → 不拦截
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return { error: "Please sign in to continue." };
    return null;
  } catch {
    return { error: "Authentication is unavailable. Please try again." };
  }
}
