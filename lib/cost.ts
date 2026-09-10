/**
 * 单次 AI 调用的成本估算（元）——只用于日志观察与告警，不参与实际计费。
 *
 * 单价取 2026-09-10 生效的 DeepSeek V4 Flash 闲时价：
 *   输入（缓存未命中）1 元/百万、输入（缓存命中）0.02 元/百万、输出 4 元/百万
 * 高峰时段（工作日 9:00–12:00、14:00–18:00）为闲时的 2 倍。
 * 价格再调整时，改这几个常量（或设对应的 env）即可。
 */

const PRICE_INPUT_PER_MTOK = Number(process.env.PRICE_INPUT_PER_MTOK || 1);
const PRICE_OUTPUT_PER_MTOK = Number(process.env.PRICE_OUTPUT_PER_MTOK || 4);
const PRICE_CACHE_HIT_PER_MTOK = Number(
  process.env.PRICE_CACHE_HIT_PER_MTOK || 0.02
);

export function estimateCost(
  promptTokens?: number | null,
  completionTokens?: number | null,
  cacheHit?: number | null
): number {
  const hit = Math.min(cacheHit ?? 0, promptTokens ?? 0);
  const miss = Math.max((promptTokens ?? 0) - hit, 0);
  const input =
    (miss / 1_000_000) * PRICE_INPUT_PER_MTOK +
    (hit / 1_000_000) * PRICE_CACHE_HIT_PER_MTOK;
  const output = ((completionTokens ?? 0) / 1_000_000) * PRICE_OUTPUT_PER_MTOK;
  return Number((input + output).toFixed(6));
}

/**
 * DeepSeek 的上下文缓存是**自动前缀匹配**的：只要请求前缀（一般是 system prompt）
 * 与近期请求一致，命中部分就按缓存价计费，代码侧无需任何配置。
 * 这也是为什么 SYSTEM_PROMPT 要保持稳定、并且放在 messages 最前面。
 */
export function cacheHitTokens(usage: any): number | null {
  return (
    usage?.prompt_cache_hit_tokens ??
    usage?.prompt_tokens_details?.cached_tokens ??
    null
  );
}
