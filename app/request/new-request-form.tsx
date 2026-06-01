"use client";

import { useEffect, useState } from "react";
import { UploadCloud } from "lucide-react";
import { createRequestAction } from "@/app/actions";
import { Button } from "@/components/button";
import { Field, Input, Select } from "@/components/input";
import { cacheKeys } from "@/lib/cache-keys";
import { readCache, writeCache } from "@/lib/browser-cache";
import { createClient } from "@/lib/supabase/client";
import type { InventoryItem } from "@/lib/types";

export function NewRequestForm({ initialItems }: { initialItems: InventoryItem[] }) {
  const [items, setItems] = useState<InventoryItem[]>(initialItems);
  const [loading, setLoading] = useState(initialItems.length === 0);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const cached = readCache<InventoryItem[]>(cacheKeys.inventory);
    if (cached && initialItems.length === 0) {
      setItems(cached.filter((item) => item.available_stock > 0));
      setLoading(false);
    }

    let active = true;
    const refreshItems = async () => {
      const supabase = createClient();
      const { data, error: refreshError } = await supabase
        .from("inventory")
        .select("id, item_name, category, total_stock, available_stock, created_at, updated_at")
        .gt("available_stock", 0)
        .order("item_name")
        .returns<InventoryItem[]>();

      if (!active) return;
      if (refreshError) {
        setError(refreshError.message);
        setLoading(false);
        return;
      }

      const fresh = data ?? [];
      setItems(fresh);
      writeCache(cacheKeys.inventory, fresh, 5 * 60 * 1000);
      setLoading(false);
    };

    refreshItems().catch((refreshError) => {
      if (!active) return;
      setError(refreshError instanceof Error ? refreshError.message : "Could not refresh inventory.");
      setLoading(false);
    });

    return () => {
      active = false;
    };
  }, [initialItems.length]);

  return (
    <form action={createRequestAction} className="panel mt-6 grid gap-5 p-5">
      {error && items.length === 0 ? (
        <p className="rounded-md border border-danger/30 bg-orange-50 p-3 text-sm font-semibold text-danger">
          {error}
        </p>
      ) : null}
      <Field label="Resource">
        <Select name="itemId" required disabled={loading && items.length === 0}>
          <option value="">
            {loading && items.length === 0
              ? "Loading resources..."
              : items.length === 0
                ? "No inventory items available"
                : "Select an item"}
          </option>
          {items.map((item) => (
            <option key={item.id} value={item.id}>
              {item.item_name} · {item.category} · {item.available_stock} available
            </option>
          ))}
        </Select>
      </Field>
      <Field label="Quantity">
        <Input name="quantity" type="number" min={1} max={25} defaultValue={1} required />
      </Field>
      <Field label="Receipt attachment">
        <Input name="receipt" type="file" accept=".pdf,.png,.jpg,.jpeg,.webp" required />
      </Field>
      <Button className="w-fit">
        <UploadCloud className="size-4" />
        Submit request
      </Button>
    </form>
  );
}
