"use client";

import { createBrowserClient } from "@supabase/ssr";
import { readSupabaseEnv } from "./env";

/**
 * 浏览器端 Supabase 客户端。
 * - publishable / anon key 都是公开 key（配合 RLS 使用，非 secret），故允许 NEXT_PUBLIC_。
 * - 仅用于登录/注册/会话等 Auth 操作；读取用户身份的服务端请用 server.ts。
 */
export function createClient() {
  const { url, key } = readSupabaseEnv();
  if (!url || !key) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY)."
    );
  }
  return createBrowserClient(url, key);
}
