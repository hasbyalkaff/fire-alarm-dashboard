"use client";

import { useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Flame, Loader2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/field";
import { Button } from "@/components/ui/button";

export function LoginForm() {
  const router = useRouter();
  const params = useSearchParams();
  const from = params.get("from") || "/";
  const expired = params.get("expired") === "1";

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const usernameRef = useRef<HTMLInputElement>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        const json = await res.json().catch(() => ({}));
        setError(json?.error?.message ?? "Incorrect username or password.");
        setSubmitting(false);
        // Move focus back to the first field so keyboard/SR users land on the fix (§12).
        usernameRef.current?.focus();
        return;
      }
      router.replace(from);
      router.refresh();
    } catch {
      setError("Couldn't reach the server. Try again.");
      setSubmitting(false);
      usernameRef.current?.focus();
    }
  }

  return (
    <Card className="w-full max-w-sm">
      <form onSubmit={onSubmit} className="flex flex-col gap-4 p-6">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-2 text-lg font-semibold text-fg">
            <Flame size={22} style={{ color: "var(--status-alarm-strong)" }} aria-hidden />
            Fire Alarm Monitoring
          </span>
          <p className="text-sm text-fg-muted">Sign in to continue.</p>
        </div>

        {expired && (
          <p className="rounded-md px-3 py-2 text-sm" style={{ backgroundColor: "var(--status-fault-bg)", color: "var(--status-fault-fg)" }} role="status">
            Your session expired. Please sign in again.
          </p>
        )}

        <Input
          ref={usernameRef}
          label="Username"
          name="username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoComplete="username"
          autoCapitalize="none"
          spellCheck={false}
          required
        />
        <Input
          label="Password"
          name="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          autoComplete="current-password"
          required
        />

        <div aria-live="assertive" className="min-h-0">
          {error && (
            // Sign-in failure is an error, not a fire alarm: fault amber, not sacred red.
            <p className="text-sm" style={{ color: "var(--status-fault-fg)" }}>
              {error}
            </p>
          )}
        </div>

        <Button type="submit" disabled={submitting} className="w-full">
          {submitting && <Loader2 size={16} className="animate-spin" aria-hidden />}
          Sign In
        </Button>

        <p className="text-center text-xs text-fg-subtle">
          Demo: admin / officer / viewer · password <span className="font-mono" translate="no">password123</span>
        </p>
      </form>
    </Card>
  );
}
