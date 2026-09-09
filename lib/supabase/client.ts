"use client";

import { createBrowserClient } from "@supabase/ssr";

/**
 * 浏览器端 Supabase 客户端。
 * - anon key 是公开 key（配合 RLS 使用，非 secret），故允许 NEXT_PUBLIC_。
 * - 仅用于登录/注册/会话等 Auth 操作；读取用户身份的服务端请用 server.ts。
 */
export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) {
    throw new Error(
      "Supabase env missing. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }
  return createBrowserClient(url, anonKey);
}
