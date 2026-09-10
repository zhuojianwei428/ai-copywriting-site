import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { readSupabaseEnv } from "./env";

/**
 * Edge middleware：刷新过期的 Supabase session cookie。
 * 不含任何 auth 逻辑，只负责维持会话存活（标准 @supabase/ssr 做法）。
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const { url, key } = readSupabaseEnv();

  // 未配置 Supabase 时不拦截（保持当前公开行为），配置后由 API 层鉴权兜底。
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // 触发一次会话刷新（@supabase/ssr 官方推荐写法）：
  // 过期的 access token 会在这里被静默续期，并把新 cookie 写回响应。
  await supabase.auth.getUser();

  return supabaseResponse;
}
