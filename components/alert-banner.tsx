import { AlertCircle, CheckCircle2, Info } from "lucide-react";

type AlertBannerProps = {
  error?: string;
  message?: string;
};

export function AlertBanner({ error, message }: AlertBannerProps) {
  const text = error ?? message;

  if (!text) {
    return null;
  }

  const isError = Boolean(error);
  const Icon = isError ? AlertCircle : message ? CheckCircle2 : Info;

  return (
    <div
      className={`mb-5 flex items-start gap-3 rounded-md border p-3 text-sm font-semibold ${
        isError
          ? "border-danger/30 bg-orange-50 text-danger"
          : "border-mint/30 bg-emerald-50 text-mint"
      }`}
      role={isError ? "alert" : "status"}
    >
      <Icon className="mt-0.5 size-4 shrink-0" />
      <span>{text}</span>
    </div>
  );
}
