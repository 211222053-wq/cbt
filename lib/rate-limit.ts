import { env } from "@/lib/env";

type Entry = { count: number; resetAt: number };
const store = new Map<string, Entry>();

export function checkRateLimit(key: string) {
  const now = Date.now();
  const windowMs = env.RATE_LIMIT_WINDOW_SEC * 1000;
  const limit = env.RATE_LIMIT_MAX_ATTEMPTS;
  const found = store.get(key);
  if (!found || found.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1 };
  }
  if (found.count >= limit) {
    return { allowed: false, remaining: 0, retryAfterSec: Math.ceil((found.resetAt - now) / 1000) };
  }
  found.count += 1;
  store.set(key, found);
  return { allowed: true, remaining: limit - found.count };
}
