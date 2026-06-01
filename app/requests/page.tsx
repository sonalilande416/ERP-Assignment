import { AppShell } from "@/components/app-shell";
import { AlertBanner } from "@/components/alert-banner";
import { CacheInvalidator } from "@/components/cache-invalidator";
import { CacheSeed } from "@/components/cache-seed";
import { StatusBadge } from "@/components/status-badge";
import { getSessionProfile } from "@/lib/auth";
import { cacheKeys } from "@/lib/cache-keys";
import { formatDate } from "@/lib/format";
import type { ResourceRequest } from "@/lib/types";

export default async function RequestsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await getSessionProfile();
  const { data } = await supabase
    .from("requests")
    .select("id, employee_id, item_id, status, quantity, attachment_path, rejection_reason, processed_by, processed_at, created_at, inventory(item_name, category)")
    .order("created_at", { ascending: false })
    .returns<ResourceRequest[]>();

  const requests = data ?? [];

  return (
    <AppShell profile={profile}>
      {params.message ? <CacheInvalidator keys={[cacheKeys.myRequests]} /> : null}
      <CacheSeed cacheKey={cacheKeys.myRequests} value={requests} ttlMs={60 * 1000} />
      <div className="grid gap-6">
        <section>
          <h2 className="text-2xl font-black text-ink">My requests</h2>
          <p className="mt-1 text-steel">Track each submitted resource request from pending to final decision.</p>
          <div className="mt-4">
            <AlertBanner error={params.error} message={params.message} />
          </div>
        </section>
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-cloud text-xs uppercase text-steel">
                <tr>
                  <th className="px-4 py-3">Item</th>
                  <th className="px-4 py-3">Category</th>
                  <th className="px-4 py-3">Qty</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Submitted</th>
                  <th className="px-4 py-3">Reason</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {requests.map((request) => (
                  <tr key={request.id}>
                    <td className="px-4 py-3 font-semibold text-ink">{request.inventory?.item_name ?? "Deleted item"}</td>
                    <td className="px-4 py-3 text-steel">{request.inventory?.category ?? "-"}</td>
                    <td className="px-4 py-3">{request.quantity}</td>
                    <td className="px-4 py-3"><StatusBadge status={request.status} /></td>
                    <td className="px-4 py-3">{formatDate(request.created_at)}</td>
                    <td className="px-4 py-3 text-steel">{request.rejection_reason ?? "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {requests.length === 0 ? <p className="p-4 text-sm text-steel">No requests submitted yet.</p> : null}
        </div>
      </div>
    </AppShell>
  );
}
