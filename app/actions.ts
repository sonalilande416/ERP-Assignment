"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { getSessionProfile } from "@/lib/auth";

const authSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  confirmPassword: z.string().min(8).optional(),
  fullName: z.string().min(2).optional()
});

function errorMessage(error: unknown, fallback: string) {
  return error instanceof Error ? error.message : fallback;
}

export async function signInAction(formData: FormData) {
  const payload = authSchema.omit({ fullName: true }).parse({
    email: formData.get("email"),
    password: formData.get("password")
  });
  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not configured.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  try {
    const { data: emailExists } = await supabase.rpc("email_exists", {
      p_email: payload.email
    });

    if (emailExists === false) {
      redirect("/login?error=No user found with this email.");
    }
  } catch {
    // If the optional helper RPC is not installed yet, fall back to Supabase Auth's generic response.
  }

  let signInError: { message: string } | null = null;
  try {
    const { error } = await supabase.auth.signInWithPassword(payload);
    signInError = error;
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent(errorMessage(error, "Login failed."))}`);
  }

  if (signInError) redirect(`/login?error=${encodeURIComponent(signInError.message)}`);
  redirect("/?message=Logged in successfully.");
}

export async function signUpAction(formData: FormData) {
  const payload = authSchema.parse({
    email: formData.get("email"),
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
    fullName: formData.get("fullName")
  });

  if (payload.password !== payload.confirmPassword) {
    redirect("/login?error=Passwords do not match.");
  }

  let supabase;
  try {
    supabase = await createClient();
  } catch (error) {
    const message = error instanceof Error ? error.message : "Supabase is not configured.";
    redirect(`/login?error=${encodeURIComponent(message)}`);
  }

  let signUpError: { message: string } | null = null;
  try {
    const { error } = await supabase.auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        data: { full_name: payload.fullName }
      }
    });
    signUpError = error;
  } catch (error) {
    redirect(`/login?error=${encodeURIComponent(errorMessage(error, "Signup failed."))}`);
  }

  if (signUpError) redirect(`/login?error=${encodeURIComponent(signUpError.message)}`);
  redirect("/login?message=Account created successfully. You can log in now.");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

const requestSchema = z.object({
  itemId: z.string().uuid(),
  quantity: z.coerce.number().int().min(1).max(25)
});

export async function createRequestAction(formData: FormData) {
  const { supabase, user } = await getSessionProfile();
  const payload = requestSchema.parse({
    itemId: formData.get("itemId"),
    quantity: formData.get("quantity")
  });
  const receipt = formData.get("receipt");

  if (!(receipt instanceof File) || receipt.size === 0) {
    redirect("/request?error=Receipt upload is required.");
  }

  const safeName = receipt.name.replace(/[^a-zA-Z0-9_.-]/g, "-");
  const path = `receipts/${user.id}/${crypto.randomUUID()}-${safeName}`;
  const { error: uploadError } = await supabase.storage
    .from("request-receipts")
    .upload(path, receipt, {
      contentType: receipt.type || "application/octet-stream",
      upsert: false
    });

  if (uploadError) {
    redirect(`/request?error=${encodeURIComponent(uploadError.message)}`);
  }

  const { error } = await supabase.from("requests").insert({
    employee_id: user.id,
    item_id: payload.itemId,
    quantity: payload.quantity,
    attachment_path: path
  });

  if (error) {
    await supabase.storage.from("request-receipts").remove([path]);
    redirect(`/request?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  redirect("/requests?message=Request submitted successfully.");
}

const processSchema = z.object({
  requestId: z.string().uuid(),
  approve: z.enum(["true", "false"]).transform((value) => value === "true"),
  reason: z.string().max(250).optional()
});

export async function processRequestAction(formData: FormData) {
  const { supabase } = await getSessionProfile();
  const payload = processSchema.parse({
    requestId: formData.get("requestId"),
    approve: formData.get("approve"),
    reason: formData.get("reason") || undefined
  });

  const { error } = await supabase.rpc("process_item_request", {
    p_request_id: payload.requestId,
    p_approve: payload.approve,
    p_rejection_reason: payload.reason ?? null
  });

  if (error) {
    redirect(`/admin/requests?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/requests");
  redirect(`/admin/requests?message=Request ${payload.approve ? "approved" : "rejected"} successfully.`);
}

const inventorySchema = z.object({
  itemName: z.string().min(2),
  category: z.string().min(2),
  totalStock: z.coerce.number().int().min(0),
  availableStock: z.coerce.number().int().min(0)
});

export async function upsertInventoryAction(formData: FormData) {
  const { supabase } = await getSessionProfile();
  const payload = inventorySchema.parse({
    itemName: formData.get("itemName"),
    category: formData.get("category"),
    totalStock: formData.get("totalStock"),
    availableStock: formData.get("availableStock")
  });

  if (payload.availableStock > payload.totalStock) {
    redirect("/admin/inventory?error=Available stock cannot exceed total stock.");
  }

  const { error } = await supabase.from("inventory").insert({
    item_name: payload.itemName,
    category: payload.category,
    total_stock: payload.totalStock,
    available_stock: payload.availableStock
  });

  if (error) {
    redirect(`/admin/inventory?error=${encodeURIComponent(error.message)}`);
  }

  revalidatePath("/");
  revalidatePath("/admin/inventory");
  redirect("/admin/inventory?message=Inventory item added successfully.");
}
