/**
 * 统一读取 Supabase 环境变量。
 *
 * Supabase 新版控制台把前端公开 key 从 "anon key" 改名为 "publishable key"
 * （值形如 `sb_publishable_...`）。两者作用等价：都是设计上可公开的前端 key，
 * 真正的访问控制靠 RLS 策略，因此可以安全地走 NEXT_PUBLIC_ 前缀。
 *
 * 这里同时兼容两种命名，复制哪一组都能跑。
 * 注意：service_role / secret key 绝不能出现在 NEXT_PUBLIC_ 变量里。
 */
export function readSupabaseEnv(): { url?: string; key?: string } {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return { url, key };
}

/** Supabase 是否已配置（未配置时全站保持游客公开，登录墙不生效）。 */
export function isSupabaseConfigured(): boolean {
  const { url, key } = readSupabaseEnv();
  return Boolean(url && key);
}
