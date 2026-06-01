import { Boxes, ShieldCheck, UploadCloud } from "lucide-react";
import type { ComponentType } from "react";
import { AuthModals } from "@/app/login/auth-modals";
import { AlertBanner } from "@/components/alert-banner";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ error?: string; message?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="relative min-h-screen overflow-hidden bg-ink text-white">
      <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80')] bg-cover bg-center" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(17,24,39,0.88),rgba(15,85,214,0.58),rgba(15,159,131,0.44))]" />

      <section className="relative z-10 flex min-h-screen flex-col px-5 py-6 md:px-10">
        <header className="flex items-center gap-3">
          <span className="grid size-12 place-items-center rounded-lg bg-white text-xl font-black text-brand">
            ERP
          </span>
          <div>
            <p className="text-xl font-black">Workspace Manager</p>
            <p className="text-sm font-semibold text-blue-100">Secure Inventory ERP</p>
          </div>
        </header>

        <div className="grid flex-1 items-center py-12">
          <div className="max-w-3xl">
            <p className="mb-4 inline-flex items-center gap-2 rounded-md border border-white/30 bg-white/10 px-3 py-2 text-sm font-bold uppercase text-blue-50 backdrop-blur">
              <ShieldCheck className="size-4" />
              Sonali Enterprise ERP Assignment
            </p>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">
              Secure workspace requests, approvals, and inventory in one flow.
            </h1>
            <p className="mt-5 max-w-2xl text-lg leading-8 text-blue-50">
              Employees request laptops, screens, and software licenses with receipt uploads. Managers approve through
              transaction-safe Supabase workflows.
            </p>

            <div className="mt-6 max-w-xl">
              <AlertBanner error={params.error} message={params.message} />
            </div>

            <div className="mt-8">
              <AuthModals />
            </div>
          </div>
        </div>

        <footer className="grid gap-3 border-t border-white/20 pt-5 text-sm text-blue-50 md:grid-cols-3">
          <Feature icon={Boxes} text="Role-based inventory control" />
          <Feature icon={UploadCloud} text="Private receipt uploads" />
          <Feature icon={ShieldCheck} text="RLS protected approval flow" />
        </footer>
      </section>
    </main>
  );
}

function Feature({
  icon: Icon,
  text
}: {
  icon: ComponentType<{ className?: string }>;
  text: string;
}) {
  return (
    <div className="flex items-center gap-3">
      <span className="grid size-9 place-items-center rounded-md bg-white/15">
        <Icon className="size-4" />
      </span>
      <span className="font-semibold">{text}</span>
    </div>
  );
}
