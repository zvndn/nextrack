"use client";

import { FormEvent, useState, useTransition } from "react";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";

type AuthPanelProps = {
  mode: "login" | "register";
};

export function AuthPanel({ mode }: AuthPanelProps) {
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  async function readErrorMessage(response: Response, fallback: string) {
    const contentType = response.headers.get("content-type") ?? "";

    if (contentType.includes("application/json")) {
      try {
        const payload = await response.json();
        return String(payload?.error ?? fallback);
      } catch {
        return fallback;
      }
    }

    try {
      const text = (await response.text()).trim();
      return text || fallback;
    } catch {
      return fallback;
    }
  }

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const form = new FormData(event.currentTarget);
    const email = String(form.get("email") ?? "");
    const password = String(form.get("password") ?? "");

    startTransition(async () => {
      if (mode === "register") {
        const response = await fetch("/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: form.get("name"),
            username: form.get("username"),
            email,
            password
          })
        });

        if (!response.ok) {
          setError(await readErrorMessage(response, "Registration failed."));
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false
      });

      if (result?.error) {
        setError("Invalid email or password.");
        return;
      }

      window.location.href = "/dashboard";
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      {mode === "register" ? (
        <>
          <label className="grid gap-2 text-sm text-zinc-300">
            Name
            <input name="name" required className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
          </label>
          <label className="grid gap-2 text-sm text-zinc-300">
            Username
            <input name="username" required className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
          </label>
        </>
      ) : null}
      <label className="grid gap-2 text-sm text-zinc-300">
        Email
        <input name="email" type="email" required className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
      </label>
      <label className="grid gap-2 text-sm text-zinc-300">
        Password
        <input name="password" type="password" minLength={8} required className="h-11 rounded-md border border-white/10 bg-black/30 px-3 text-white outline-none focus:border-cyan-300" />
      </label>
      {error ? <p className="rounded-md border border-red-400/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</p> : null}
      <Button type="submit" disabled={isPending}>
        {isPending ? "Working..." : mode === "login" ? "Sign in" : "Create account"}
      </Button>
    </form>
  );
}
