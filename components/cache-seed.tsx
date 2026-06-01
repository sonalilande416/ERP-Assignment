"use client";

import { useEffect } from "react";
import { writeCache } from "@/lib/browser-cache";

export function CacheSeed<T>({
  cacheKey,
  value,
  ttlMs
}: {
  cacheKey: string;
  value: T;
  ttlMs: number;
}) {
  useEffect(() => {
    writeCache(cacheKey, value, ttlMs);
  }, [cacheKey, ttlMs, value]);

  return null;
}
