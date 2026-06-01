"use client";

import { useEffect } from "react";
import { removeCache } from "@/lib/browser-cache";

export function CacheInvalidator({ keys }: { keys: string[] }) {
  useEffect(() => {
    removeCache(keys);
  }, [keys]);

  return null;
}
