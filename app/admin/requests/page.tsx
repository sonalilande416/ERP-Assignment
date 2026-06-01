import { Check, FileText, X } from "lucide-react";
import { processRequestAction } from "@/app/actions";
import { AppShell } from "@/components/app-shell";
import { AlertBanner } from "@/components/alert-banner";
import { Button } from "@/components/button";
import { CacheInvalidator } from "@/components/cache-invalidator";
import { Textarea } from "@/components/input";
import { StatusBadge } from "@/components/status-badge";
import { assertRole, getSessionProfile } from "@/lib/auth";
import { cacheKeys } from "@/lib/cache-keys";
import { formatDate } from "@/lib/format";
import type { ResourceRequest } from "@/lib/types";

type AdminRequest = ResourceRequest & {
  employee: {
    full_name: string;
    role: string;
  } | null;
};

export default async function AdminRequestsPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await getSessionProfile();
  assertRole(profile, ["manager", "admin"]);

  const { data, error } = await supabase
    .from("requests")
    .select(
      "id, employee_id, item_id, status, quantity, attachment_path, rejection_reason, processed_by, processed_at, created_at, inventory(item_name, category), employee:profiles!requests_employee_id_fkey(full_name, role)"
    )
    .order("created_at", { ascending: false })
    .returns<AdminRequest[]>();

  const requests = data ?? [];

  return (
    <AppShell profile={profile}>
      {params.message ? (
        <CacheInvalidator keys={[cacheKeys.inventory, cacheKeys.myRequests, cacheKeys.monthlyReport]} />
      ) : null}
      <div className="grid gap-6">
        <section>
          <h2 className="text-2xl font-black text-ink">Request approvals</h2>
          <p className="mt-1 text-steel">Approvals call the Postgres transaction function that validates stock and locks rows.</p>
          <div className="mt-4">
            <AlertBanner error={params.error ?? error?.message} message={params.message} />
          </div>
        </section>
        <div className="grid gap-4">
          {requests.map((request) => (
            <article key={request.id} className="panel p-4">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-bold text-ink">{request.inventory?.item_name ?? "Deleted item"}</h3>
                    <StatusBadge status={request.status} />
                  </div>
                  <p className="mt-1 text-sm text-steel">
                    {request.employee?.full_name ?? "Employee"} requested {request.quantity} · {formatDate(request.created_at)}
                  </p>
                  <p className="mt-1 text-sm text-steel">Attachment path: {request.attachment_path}</p>
                </div>
                <a
                  href={`/api/receipts?path=${encodeURIComponent(request.attachment_path)}`}
                  className="focus-ring inline-flex h-10 items-center gap-2 rounded-md border border-line bg-white px-3 text-sm font-semibold text-ink hover:bg-cloud"
                >
                  <FileText className="size-4" />
                  Receipt
                </a>
              </div>
              {request.status === "pending" ? (
                <form action={processRequestAction} className="mt-4 grid gap-3 md:grid-cols-[1fr_auto_auto]">
                  <input type="hidden" name="requestId" value={request.id} />
                  <Textarea name="reason" placeholder="Reason required for rejection, optional for approval" />
                  <Button name="approve" value="true">
                    <Check className="size-4" />
                    Approve
                  </Button>
                  <Button tone="danger" name="approve" value="false">
                    <X className="size-4" />
                    Reject
                  </Button>
                </form>
              ) : (
                <p className="mt-4 text-sm text-steel">
                  Processed {formatDate(request.processed_at)}
                  {request.rejection_reason ? ` · ${request.rejection_reason}` : ""}
                </p>
              )}
            </article>
          ))}
          {requests.length === 0 ? <p className="panel p-4 text-sm text-steel">No requests to review.</p> : null}
        </div>
      </div>
    </AppShell>
  );
}
