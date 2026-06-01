"use client";

import { cacheKeys } from "@/lib/cache-keys";

type CacheEnvelope<T> = {
  value: T;
  expiresAt: number;
};

export { cacheKeys };

export function readCache<T>(key: string): T | null {
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as CacheEnvelope<T>;
    if (!parsed.expiresAt || parsed.expiresAt < Date.now()) {
      window.localStorage.removeItem(key);
      return null;
    }

    return parsed.value;
  } catch {
    return null;
  }
}

export function writeCache<T>(key: string, value: T, ttlMs: number) {
  try {
    const payload: CacheEnvelope<T> = {
      value,
      expiresAt: Date.now() + ttlMs
    };
    window.localStorage.setItem(key, JSON.stringify(payload));
  } catch {
    // Storage can be unavailable in private mode or full disks; the app should still work.
  }
}

export function removeCache(keys: string[]) {
  try {
    keys.forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore cache cleanup failures.
  }
}

export function clearAppCache() {
  try {
    Object.values(cacheKeys).forEach((key) => window.localStorage.removeItem(key));
  } catch {
    // Ignore cache cleanup failures.
  }
}
