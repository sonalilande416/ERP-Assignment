"use client";

import { useEffect } from "react";
import { cacheKeys } from "@/lib/cache-keys";
import { writeCache } from "@/lib/browser-cache";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem, Profile, ResourceRequest } from "@/lib/types";

export function CacheSync({ profile }: { profile: Profile }) {
  useEffect(() => {
    let active = true;

    async function sync() {
      const supabase = createClient();

      const [inventoryResult, requestResult] = await Promise.all([
        supabase
          .from("inventory")
          .select("id, item_name, category, total_stock, available_stock, created_at, updated_at")
          .order("item_name")
          .returns<InventoryItem[]>(),
        supabase
          .from("requests")
          .select(
            "id, employee_id, item_id, status, quantity, attachment_path, rejection_reason, processed_by, processed_at, created_at, inventory(item_name, category)"
          )
          .order("created_at", { ascending: false })
          .returns<ResourceRequest[]>()
      ]);

      if (!active) return;

      if (inventoryResult.data) {
        writeCache(cacheKeys.inventory, inventoryResult.data, 5 * 60 * 1000);
      }

      if (requestResult.data) {
        writeCache(cacheKeys.myRequests, requestResult.data, 60 * 1000);
      }

      writeCache(cacheKeys.profile, profile, 30 * 60 * 1000);
    }

    sync().catch(() => {
      // Cache sync is an optimization; Supabase server-rendered pages remain the source of truth.
    });

    return () => {
      active = false;
    };
  }, [profile]);

  return null;
}
