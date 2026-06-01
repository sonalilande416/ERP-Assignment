import { NextRequest, NextResponse } from "next/server";
import { getSessionProfile } from "@/lib/auth";

export async function GET(request: NextRequest) {
  const path = request.nextUrl.searchParams.get("path");
  if (!path) {
    return NextResponse.json({ error: "Missing receipt path" }, { status: 400 });
  }

  const { supabase } = await getSessionProfile();
  const { data, error } = await supabase.storage.from("request-receipts").createSignedUrl(path, 60);

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? "Receipt not found" }, { status: 404 });
  }

  return NextResponse.redirect(data.signedUrl);
}
