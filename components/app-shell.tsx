import Link from "next/link";
import type { ReactNode } from "react";
import { BarChart3, Boxes, ClipboardList, LayoutDashboard, PackagePlus, ShieldCheck } from "lucide-react";
import type { Profile } from "@/lib/types";
import { CacheSync } from "@/components/cache-sync";
import { SignOutButton } from "@/components/sign-out-button";

export function AppShell({
  profile,
  children
}: {
  profile: Profile;
  children: ReactNode;
}) {
  const isStaff = profile.role === "manager" || profile.role === "admin";
  const links = [
    { href: "/", label: "Dashboard", icon: LayoutDashboard },
    { href: "/request", label: "New Request", icon: PackagePlus },
    { href: "/requests", label: "My Requests", icon: ClipboardList },
    ...(isStaff
      ? [
          { href: "/admin/requests", label: "Approvals", icon: ShieldCheck },
          { href: "/admin/inventory", label: "Inventory", icon: Boxes },
          { href: "/admin/report", label: "Report", icon: BarChart3 }
        ]
      : [])
  ];

  return (
    <div className="min-h-screen bg-cloud">
      <aside className="fixed inset-y-0 left-0 hidden w-64 border-r border-line bg-white p-4 lg:block">
        <Link href="/" className="mb-8 flex items-center gap-3 text-lg font-black text-ink">
          <span className="grid size-10 place-items-center rounded-md bg-brand text-white">ERP</span>
          <span>Workspace Manager</span>
        </Link>
        <nav className="grid gap-1">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring flex items-center gap-3 rounded-md px-3 py-2 text-sm font-semibold text-steel hover:bg-cloud hover:text-ink"
            >
              <link.icon className="size-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <main className="lg:pl-64">
        <CacheSync profile={profile} />
        <header className="sticky top-0 z-10 border-b border-line bg-white/95 px-4 py-3 backdrop-blur md:px-8">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-brand">{profile.role.toUpperCase()}</p>
              <h1 className="text-xl font-bold text-ink">{profile.full_name}</h1>
            </div>
            <SignOutButton />
          </div>
          <nav className="mt-3 flex gap-2 overflow-x-auto lg:hidden">
            {links.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring inline-flex shrink-0 items-center gap-2 rounded-md border border-line bg-white px-3 py-2 text-sm font-semibold"
              >
                <link.icon className="size-4" />
                {link.label}
              </Link>
            ))}
          </nav>
        </header>
        <div className="mx-auto w-full max-w-7xl px-4 py-6 md:px-8">{children}</div>
      </main>
    </div>
  );
}
