import { AlertTriangle, CheckCircle2, Clock3, Package } from "lucide-react";
import type { ComponentType } from "react";
import { AppShell } from "@/components/app-shell";
import { AlertBanner } from "@/components/alert-banner";
import { CacheInvalidator } from "@/components/cache-invalidator";
import { CacheSeed } from "@/components/cache-seed";
import { StatusBadge } from "@/components/status-badge";
import { getSessionProfile } from "@/lib/auth";
import { cacheKeys } from "@/lib/cache-keys";
import { formatDate } from "@/lib/format";
import type { InventoryItem, ResourceRequest } from "@/lib/types";

export default async function DashboardPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await getSessionProfile();
  const [{ data: inventory }, { data: requests }] = await Promise.all([
    supabase
      .from("inventory")
      .select("id, item_name, category, total_stock, available_stock, created_at, updated_at")
      .order("item_name")
      .returns<InventoryItem[]>(),
    supabase
      .from("requests")
      .select("id, employee_id, item_id, status, quantity, attachment_path, rejection_reason, processed_by, processed_at, created_at, inventory(item_name, category)")
      .order("created_at", { ascending: false })
      .limit(6)
      .returns<ResourceRequest[]>()
  ]);

  const items = inventory ?? [];
  const recent = requests ?? [];
  const lowStock = items.filter((item) => item.available_stock <= 2);
  const pending = recent.filter((request) => request.status === "pending").length;

  return (
    <AppShell profile={profile}>
      {params.message ? <CacheInvalidator keys={[cacheKeys.profile]} /> : null}
      <CacheSeed cacheKey={cacheKeys.inventory} value={items} ttlMs={5 * 60 * 1000} />
      <CacheSeed cacheKey={cacheKeys.myRequests} value={recent} ttlMs={60 * 1000} />
      <div className="grid gap-6">
        <AlertBanner error={params.error} message={params.message} />
        <section>
          <h2 className="text-2xl font-black text-ink">Dashboard</h2>
          <p className="mt-1 text-steel">Live inventory visibility and request status tracking.</p>
        </section>
        <section className="grid gap-4 md:grid-cols-4">
          <Metric icon={Package} label="Inventory items" value={items.length} />
          <Metric icon={CheckCircle2} label="Available units" value={items.reduce((sum, item) => sum + item.available_stock, 0)} />
          <Metric icon={Clock3} label="Pending requests" value={pending} />
          <Metric icon={AlertTriangle} label="Low-stock items" value={lowStock.length} />
        </section>
        <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
          <div className="panel overflow-hidden">
            <div className="border-b border-line p-4">
              <h3 className="font-bold text-ink">Inventory</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="bg-cloud text-xs uppercase text-steel">
                  <tr>
                    <th className="px-4 py-3">Item</th>
                    <th className="px-4 py-3">Category</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Available</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="px-4 py-3 font-semibold text-ink">{item.item_name}</td>
                      <td className="px-4 py-3 text-steel">{item.category}</td>
                      <td className="px-4 py-3">{item.total_stock}</td>
                      <td className="px-4 py-3">{item.available_stock}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel overflow-hidden">
            <div className="border-b border-line p-4">
              <h3 className="font-bold text-ink">Recent requests</h3>
            </div>
            <div className="divide-y divide-line">
              {recent.map((request) => (
                <div key={request.id} className="grid gap-2 p-4">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-semibold text-ink">{request.inventory?.item_name ?? "Deleted item"}</p>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="text-sm text-steel">
                    Qty {request.quantity} · {formatDate(request.created_at)}
                  </p>
                </div>
              ))}
              {recent.length === 0 ? <p className="p-4 text-sm text-steel">No requests yet.</p> : null}
            </div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}

function Metric({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value: number;
}) {
  return (
    <div className="panel p-4">
      <div className="mb-4 grid size-10 place-items-center rounded-md bg-blue-50 text-brand">
        <Icon className="size-5" />
      </div>
      <p className="text-3xl font-black text-ink">{value}</p>
      <p className="text-sm font-medium text-steel">{label}</p>
    </div>
  );
}
