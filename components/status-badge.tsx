import type { RequestStatus } from "@/lib/types";
import { titleCase } from "@/lib/format";

const styles: Record<RequestStatus, string> = {
  pending: "border-amber/30 bg-yellow-50 text-amber",
  approved: "border-mint/30 bg-emerald-50 text-mint",
  rejected: "border-danger/30 bg-orange-50 text-danger"
};

export function StatusBadge({ status }: { status: RequestStatus }) {
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-semibold ${styles[status]}`}>
      {titleCase(status)}
    </span>
  );
}
