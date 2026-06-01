import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Profile, Role } from "@/lib/types";

export async function getSessionProfile() {
  const supabase = await createClient();
  const {
    data: { user }
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("id, full_name, role, created_at")
    .eq("id", user.id)
    .single<Profile>();

  if (error || !profile) {
    redirect("/login?error=profile");
  }

  return { supabase, user, profile };
}

export function assertRole(profile: Profile, allowed: Role[]) {
  if (!allowed.includes(profile.role)) {
    redirect("/");
  }
}
