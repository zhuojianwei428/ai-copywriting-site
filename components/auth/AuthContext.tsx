"use client";

import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useClerk, useUser } from "@clerk/nextjs";
import AuthModal from "./AuthModal";

/** 站点自用的精简用户对象（只暴露 UI 需要的字段，避免组件耦合 Clerk 类型）。 */
export interface AuthUser {
  id: string;
  email: string | null;
  imageUrl: string | null;
}

interface AuthContextValue {
  /** 已登录用户；null = 游客 */
  user: AuthUser | null;
  /** 首次读取会话中，避免闪烁 */
  initializing: boolean;
  /** 引导用户登录：未登录时打开登录弹窗并返回 false；已登录返回 true */
  requireSignIn: () => boolean;
  /** 是否需要登录：未登录则弹窗，登录成功后自动执行 action（点生成入口用这个） */
  gate: (action: () => void) => void;
  /** 是否显示登录弹窗 */
  authOpen: boolean;
  setAuthOpen: (open: boolean) => void;
  /** 登出 */
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/** Clerk 是否已配置（未配置时全站游客模式，登录墙不生效） */
export const CLERK_ENABLED = Boolean(
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY
);

/** 未配置 Clerk 时的降级实现：永远是游客，点生成直接放行。 */
function GuestProvider({ children }: { children: ReactNode }) {
  const value: AuthContextValue = {
    user: null,
    initializing: false,
    requireSignIn: () => true,
    gate: (action: () => void) => action(),
    authOpen: false,
    setAuthOpen: () => {},
    signOut: async () => {},
  };
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 已登录/未登录的统一入口，基于 Clerk 的 useUser。
 *
 * gate 的语义：游客触发时先弹登录框，把 action 暂存；登录成功的那一刻
 * 自动关闭弹窗并执行 action（例如打开生成器），用户不需要再点一次。
 */
function ClerkAuthProvider({ children }: { children: ReactNode }) {
  const { isLoaded, isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();
  const [authOpen, setAuthOpen] = useState(false);
  const pendingRef = useRef<(() => void) | null>(null);

  const authUser: AuthUser | null = user
    ? {
        id: user.id,
        email: user.primaryEmailAddress?.emailAddress ?? null,
        imageUrl: user.imageUrl ?? null,
      }
    : null;

  // 登录成功后自动续上被拦下的动作
  useEffect(() => {
    if (!isSignedIn || !pendingRef.current) return;
    const action = pendingRef.current;
    pendingRef.current = null;
    setAuthOpen(false);
    // 让弹窗先卸载，再执行动作，避免两层弹窗叠加
    const t = setTimeout(action, 0);
    return () => clearTimeout(t);
  }, [isSignedIn]);

  function requireSignIn(): boolean {
    if (isSignedIn) return true;
    setAuthOpen(true);
    return false;
  }

  function gate(action: () => void) {
    if (isSignedIn) {
      action();
      return;
    }
    pendingRef.current = action;
    setAuthOpen(true);
  }

  async function signOut() {
    try {
      await clerkSignOut({ redirectUrl: "/" });
    } catch {
      // ignore
    }
  }

  return (
    <AuthContext.Provider
      value={{
        user: authUser,
        initializing: !isLoaded,
        requireSignIn,
        gate,
        authOpen,
        setAuthOpen,
        signOut,
      }}
    >
      {children}
      {authOpen && <AuthModal open onClose={() => setAuthOpen(false)} />}
    </AuthContext.Provider>
  );
}

export function AuthProvider({ children }: { children: ReactNode }) {
  if (!CLERK_ENABLED) return <GuestProvider>{children}</GuestProvider>;
  return <ClerkAuthProvider>{children}</ClerkAuthProvider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within <AuthProvider>");
  return ctx;
}
