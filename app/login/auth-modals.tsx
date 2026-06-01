"use client";

import { useState } from "react";
import { LogIn, UserPlus, X } from "lucide-react";
import { signInAction, signUpAction } from "@/app/actions";
import { Button } from "@/components/button";
import { Field, Input } from "@/components/input";

type AuthMode = "signin" | "signup" | null;

export function AuthModals() {
  const [mode, setMode] = useState<AuthMode>(null);

  return (
    <>
      <div className="flex flex-wrap gap-3">
        <Button type="button" onClick={() => setMode("signin")} className="h-12 px-6 text-base">
          <LogIn className="size-5" />
          Log in
        </Button>
        <Button
          type="button"
          tone="neutral"
          onClick={() => setMode("signup")}
          className="h-12 border-white/40 bg-white/95 px-6 text-base text-ink hover:bg-white"
        >
          <UserPlus className="size-5" />
          Sign up
        </Button>
      </div>

      {mode ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-ink/55 px-4 py-8 backdrop-blur-sm">
          <div className="panel w-full max-w-md p-5">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase text-brand">
                  {mode === "signin" ? "Welcome back" : "Employee access"}
                </p>
                <h2 className="text-2xl font-black text-ink">
                  {mode === "signin" ? "Log in" : "Create account"}
                </h2>
              </div>
              <button
                type="button"
                aria-label="Close"
                onClick={() => setMode(null)}
                className="focus-ring grid size-10 place-items-center rounded-md border border-line bg-white text-steel hover:bg-cloud"
              >
                <X className="size-5" />
              </button>
            </div>

            {mode === "signin" ? (
              <form action={signInAction} className="grid gap-4">
                <Field label="Email">
                  <Input name="email" type="email" autoComplete="email" required />
                </Field>
                <Field label="Password">
                  <Input name="password" type="password" autoComplete="current-password" minLength={8} required />
                </Field>
                <Button>
                  <LogIn className="size-4" />
                  Log in
                </Button>
              </form>
            ) : (
              <form action={signUpAction} className="grid gap-4">
                <Field label="Full name">
                  <Input name="fullName" autoComplete="name" required />
                </Field>
                <Field label="Email">
                  <Input name="email" type="email" autoComplete="email" required />
                </Field>
                <Field label="Password">
                  <Input name="password" type="password" autoComplete="new-password" minLength={8} required />
                </Field>
                <Field label="Confirm password">
                  <Input
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    minLength={8}
                    required
                  />
                </Field>
                <Button>
                  <UserPlus className="size-4" />
                  Sign up
                </Button>
              </form>
            )}
          </div>
        </div>
      ) : null}
    </>
  );
}
