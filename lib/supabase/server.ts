"use server";

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { readSupabaseEnv } from "./env";

/**
 * 服务端 Supabase 客户端（Route Handler / Server Component）。
 * 只读会话 cookie，不向浏览器暴露任何 secret（用的是 publishable/anon key，配合 RLS）。
 */
export async function createClient() {
  const { url, key } = readSupabaseEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }

  const cookieStore = await cookies();

  return createServerClient(url, key, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // 在 Server Component 中调用 set 会被忽略——由 middleware 负责刷新会话。
        }
      },
    },
  });
}
