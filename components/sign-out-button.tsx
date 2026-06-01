"use client";

import { LogOut } from "lucide-react";
import { signOutAction } from "@/app/actions";
import { Button } from "@/components/button";
import { clearAppCache } from "@/lib/browser-cache";

export function SignOutButton() {
  return (
    <form action={signOutAction} onSubmit={() => clearAppCache()}>
      <Button tone="neutral">
        <LogOut className="size-4" />
        Sign out
      </Button>
    </form>
  );
}
