import { AppShell } from "@/components/app-shell";
import { AlertBanner } from "@/components/alert-banner";
import { getSessionProfile } from "@/lib/auth";
import { NewRequestForm } from "@/app/request/new-request-form";
import Link from "next/link";
import type { InventoryItem } from "@/lib/types";

export default async function NewRequestPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { supabase, profile } = await getSessionProfile();
  const { data, error } = await supabase
    .from("inventory")
    .select("id, item_name, category, total_stock, available_stock, created_at, updated_at")
    .gt("available_stock", 0)
    .order("item_name")
    .returns<InventoryItem[]>();

  const items = data ?? [];

  return (
    <AppShell profile={profile}>
      <div className="mx-auto max-w-3xl">
        <h2 className="text-2xl font-black text-ink">New resource request</h2>
        <p className="mt-1 text-steel">Upload a receipt or approval note with every request.</p>
        <div className="mt-4">
          <AlertBanner error={params.error ?? error?.message} />
        </div>
        {(profile.role === "manager" || profile.role === "admin") && items.length === 0 ? (
          <div className="mt-4">
            <Link
              href="/admin/inventory"
              className="focus-ring inline-flex h-10 items-center justify-center rounded-md bg-brand px-4 text-sm font-semibold text-white hover:bg-blue-700"
            >
              Add inventory item
            </Link>
          </div>
        ) : null}
        <NewRequestForm initialItems={items} />
      </div>
    </AppShell>
  );
}
