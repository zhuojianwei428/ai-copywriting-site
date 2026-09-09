"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { createClient } from "../../lib/supabase/client";
import AuthModal from "./AuthModal";

interface AuthContextValue {
  /** 已登录用户；null = 游客 */
  user: User | null;
  /** 首次读取会话中，避免闪烁 */
  initializing: boolean;
  /** 引导用户登录：未登录时打开登录弹窗并返回 false；已登录返回 true */
  requireSignIn: () => boolean;
  /** 是否显示登录弹窗 */
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  /** 登出 */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [initializing, setInitializing] = useState(true);
  const [authOpen, setAuthOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let supabase: ReturnType<typeof createClient> | null = null;

    try {
      supabase = createClient();
    } catch {
      // Supabase 未配置：保持游客模式，不报错。
      setInitializing(false);
      return;
    }

    supabase.auth.getSession().then(({ data }) => {
      if (!active) return;
      setUser(data.session?.user ?? null);
      setInitializing(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!active) return;
      setUser(session?.user ?? null);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  function requireSignIn(): boolean {
    if (user) return true;
    setAuthOpen(true);
    return false;
  }

  async function signOut() {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{ user, initializing, requireSignIn, authOpen, setAuthOpen, signOut }}
    >
      {children}
      {authOpen && (
        <AuthModal open onClose={() => setAuthOpen(false)} />
      )}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
