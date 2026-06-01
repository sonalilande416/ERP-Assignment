import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

type RequestRow = {
  id: string;
  status: "pending" | "approved" | "rejected";
  quantity: number;
  created_at: string;
  inventory: { item_name: string; category: string } | null;
  employee: { full_name: string } | null;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type"
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const authHeader = req.headers.get("Authorization") ?? "";
  const token = authHeader.replace("Bearer ", "");

  if (!supabaseUrl || !anonKey || !serviceRoleKey || !token) {
    return json({ error: "Missing function configuration or JWT" }, 401);
  }

  const userClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: `Bearer ${token}` } }
  });
  const {
    data: { user },
    error: userError
  } = await userClient.auth.getUser(token);

  if (userError || !user) {
    return json({ error: "Invalid JWT" }, 401);
  }

  const adminClient = createClient(supabaseUrl, serviceRoleKey);
  const { data: profile, error: profileError } = await adminClient
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (profileError || !["manager", "admin"].includes(profile?.role)) {
    return json({ error: "Only managers and admins can generate reports" }, 403);
  }

  const toDate = new Date();
  const fromDate = new Date(toDate);
  fromDate.setDate(toDate.getDate() - 30);

  const { data, error } = await adminClient
    .from("requests")
    .select(
      "id, status, quantity, created_at, inventory(item_name, category), employee:profiles!requests_employee_id_fkey(full_name)"
    )
    .gte("created_at", fromDate.toISOString())
    .lte("created_at", toDate.toISOString())
    .order("created_at", { ascending: false });

  if (error) {
    return json({ error: error.message }, 500);
  }

  const rows = (data ?? []) as RequestRow[];
  const totals = { pending: 0, approved: 0, rejected: 0 };
  const byCategory = new Map<string, { category: string; pending: number; approved: number; rejected: number; total: number }>();

  for (const row of rows) {
    totals[row.status] += 1;
    const category = row.inventory?.category ?? "Uncategorized";
    const current = byCategory.get(category) ?? {
      category,
      pending: 0,
      approved: 0,
      rejected: 0,
      total: 0
    };
    current[row.status] += 1;
    current.total += 1;
    byCategory.set(category, current);
  }

  return json({
    generated_at: new Date().toISOString(),
    from_date: fromDate.toISOString(),
    to_date: toDate.toISOString(),
    totals,
    by_category: [...byCategory.values()].sort((a, b) => b.total - a.total),
    recent_requests: rows.slice(0, 20).map((row) => ({
      id: row.id,
      employee_name: row.employee?.full_name ?? "Unknown",
      item_name: row.inventory?.item_name ?? "Deleted item",
      category: row.inventory?.category ?? "Uncategorized",
      status: row.status,
      quantity: row.quantity,
      created_at: row.created_at
    }))
  });
});

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" }
  });
}
