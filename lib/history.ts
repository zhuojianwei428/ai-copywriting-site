/**
 * 生成历史：纯本地（localStorage）存储，零后端成本。
 *
 * 设计取舍：
 * - 游客生成的内容也写入 guest 桶，登录后自动并到该用户桶下，
 *   所以"登录后才看得见历史"这个门槛不会让用户丢掉之前的记录。
 * - localStorage 不跨设备/不跨浏览器。等日活起来再迁到 Vercel KV（按 userId 存），
 *   届时只需替换本文件的实现，调用方不用动。
 */

export type HistoryKind = "narrative" | "scored";

export type HistoryItem = {
  id: string;
  kind: HistoryKind;
  title: string;
  content: string;
  createdAt: number;
  /**
   * 结构化原文（目前只有 scored 模式用：存 ScoreDoc，编辑页据此还原记分卡表格）。
   * 旧记录没有这个字段 —— 读的时候要按 undefined 处理。
   */
  data?: unknown;
};

/** 每人最多保留的条数，超出丢弃最旧的，避免撑爆 localStorage（5MB 上限） */
const MAX_ITEMS = 50;
/** 单条内容截断上限（字符），防止超长报告把配额吃光 */
const MAX_CHARS = 20_000;

const GUEST = "guest";

function keyOf(scope: string): string {
  return `air:history:${scope || GUEST}`;
}

function safeParse(raw: string | null): HistoryItem[] {
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    if (!Array.isArray(arr)) return [];
    return arr.filter(
      (x) => x && typeof x.id === "string" && typeof x.content === "string"
    ) as HistoryItem[];
  } catch {
    return [];
  }
}

export function loadHistory(scope: string): HistoryItem[] {
  if (typeof window === "undefined") return [];
  return safeParse(window.localStorage.getItem(keyOf(scope)));
}

export function saveHistory(
  scope: string,
  input: { kind: HistoryKind; title: string; content: string; data?: unknown }
): HistoryItem {
  const item: HistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    kind: input.kind,
    title: (input.title || "Untitled").slice(0, 120),
    content: input.content.slice(0, MAX_CHARS),
    createdAt: Date.now(),
    data: input.data,
  };
  if (typeof window === "undefined") return item;
  const list = loadHistory(scope);
  const next = [item, ...list].slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(keyOf(scope), JSON.stringify(next));
  } catch {
    // 配额满：砍掉一半旧记录再试一次
    try {
      window.localStorage.setItem(
        keyOf(scope),
        JSON.stringify(next.slice(0, Math.ceil(MAX_ITEMS / 2)))
      );
    } catch {
      // 放弃写入，不影响主流程
    }
  }
  return item;
}

/**
 * 原地更新一条记录 —— 编辑页改完回写用，避免每次编辑都新开一条历史。
 * 找不到 id 时静默忽略（比如换了浏览器、记录已被删）。
 */
export function updateHistory(
  scope: string,
  id: string,
  patch: { title?: string; content?: string; data?: unknown }
): void {
  if (typeof window === "undefined" || !id) return;
  const list = loadHistory(scope);
  let hit = false;
  const next = list.map((x) => {
    if (x.id !== id) return x;
    hit = true;
    return {
      ...x,
      title: (patch.title ?? x.title).slice(0, 120),
      content: (patch.content ?? x.content).slice(0, MAX_CHARS),
      data: patch.data !== undefined ? patch.data : x.data,
    };
  });
  if (!hit) return;
  try {
    window.localStorage.setItem(keyOf(scope), JSON.stringify(next));
  } catch {
    // ignore
  }
}

export function deleteHistory(scope: string, id: string): void {
  if (typeof window === "undefined") return;
  const next = loadHistory(scope).filter((x) => x.id !== id);
  window.localStorage.setItem(keyOf(scope), JSON.stringify(next));
}

export function clearHistory(scope: string): void {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(keyOf(scope));
}

/**
 * 登录后调用：把游客桶里的记录并入该用户桶，并清空游客桶。
 * 幂等 —— 重复调用不会重复合并（合并后 guest 桶已清空）。
 */
export function mergeGuestIntoUser(userId: string): void {
  if (typeof window === "undefined" || !userId) return;
  const guest = loadHistory(GUEST);
  if (guest.length === 0) return;
  const mine = loadHistory(userId);
  const seen = new Set(mine.map((x) => x.id));
  const merged = [...guest.filter((x) => !seen.has(x.id)), ...mine]
    .sort((a, b) => b.createdAt - a.createdAt)
    .slice(0, MAX_ITEMS);
  try {
    window.localStorage.setItem(keyOf(userId), JSON.stringify(merged));
    window.localStorage.removeItem(keyOf(GUEST));
  } catch {
    // ignore
  }
}
