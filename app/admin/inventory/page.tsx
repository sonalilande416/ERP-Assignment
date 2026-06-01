import { Plus } from "lucide-react";
import { upsertInventoryAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { AlertBanner } from "@/components/alert-banner";
import { Button } from "@/components/button";
import { CacheInvalidator } from "@/components/cache-invalidator";
import { CacheSeed } from "@/components/cache-seed";
import { Field, Input } from "@/components/input";
import { assertRole, getSessionProfile } from "@/lib/auth";
import { formatDate } from "@/lib/format";
import { cacheKeys } from "@/lib/cache-keys";
import type { InventoryItem } from "@/lib/types";

export default async function AdminInventoryPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await getSessionProfile();
  assertRole(profile, ["manager", "admin"]);

  const { data } = await supabase
    .from("inventory")
    .select("id, item_name, category, total_stock, available_stock, created_at, updated_at")
    .order("item_name")
    .returns<InventoryItem[]>();

  const items = data ?? [];

  return (
    <AppShell profile={profile}>
      {params.message ? <CacheInvalidator keys={[cacheKeys.inventory, cacheKeys.monthlyReport]} /> : null}
      <CacheSeed cacheKey={cacheKeys.inventory} value={items} ttlMs={5 * 60 * 1000} />
      <div className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <section className="grid gap-4">
          <div>
            <h2 className="text-2xl font-black text-ink">Inventory control</h2>
            <p className="mt-1 text-steel">Managers and admins can add controlled workspace resources.</p>
          </div>
          <AlertBanner error={params.error} message={params.message} />
          <div className="panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-cloud text-xs uppercase text-steel">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Available</th>
                    <th className="px-4 py-3">Updated</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{item.item_name}</td>
                      <td className="px-4 py-3 text-steel">{item.category}</td>
                      <td className="px-4 py-3">{item.total_stock}</td>
                      <td className="px-4 py-3">{item.available_stock}</td>
                      <td className="px-4 py-3">{formatDate(item.updated_at)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
        <form action={upsertInventoryAction} className="panel h-fit grid gap-4 p-5">
          <h3 className="text-lg font-bold text-ink">Add item</h3>
          <Field label="Item name">
            <Input name="itemName" required />
          </Field>
          <Field label="Category">
            <Input name="category" placeholder="Laptop, Screen, Software" required />
          </Field>
          <Field label="Total stock">
            <Input name="totalStock" type="number" min={0} required />
          </Field>
          <Field label="Available stock">
            <Input name="availableStock" type="number" min={0} required />
          </Field>
          <Button>
            <Plus className="size-4" />
            Add inventory
          </Button>
        </form>
      </div>
    </AppShell>
  );
}
