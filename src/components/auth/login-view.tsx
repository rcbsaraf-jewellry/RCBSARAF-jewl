"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Boxes,
  CreditCard,
  Crown,
  Loader2,
  Mail,
  Receipt,
  ShieldCheck,
  ShoppingBag,
  TrendingUp,
  Warehouse,
} from "lucide-react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { AUTH_PROFILES, type AuthProfileId, postLoginPath } from "@/lib/auth-profiles";
import { Button } from "@/components/ui/button";

const ICONS = {
  sales: [TrendingUp, ShoppingBag],
  billing: [Receipt, CreditCard],
  store_manager: [Warehouse, Boxes],
  business_owner: [ShieldCheck, Crown],
} as const;

export function LoginView() {
  const router = useRouter();
  const [role, setRole] = useState<AuthProfileId>("sales");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpTicket, setOtpTicket] = useState<string | null>(null);
  const [seconds, setSeconds] = useState(0);
  const [smtp, setSmtp] = useState<{
    configured: boolean;
    verified: boolean;
    inbox?: string | null;
    error?: string;
  } | null>(null);
  const otpRefs = useRef<Array<HTMLInputElement | null>>([]);
  const sendingFor = useRef<string | null>(null);
  const profile = useMemo(() => AUTH_PROFILES.find((p) => p.id === role)!, [role]);

  useEffect(() => {
    fetch("/api/auth/smtp-status")
      .then((r) => r.json())
      .then((d) =>
        setSmtp({
          configured: Boolean(d.configured),
          verified: Boolean(d.verified),
          inbox: typeof d.inbox === "string" ? d.inbox : null,
          error: typeof d.error === "string" ? d.error : undefined,
        }),
      )
      .catch(() => setSmtp({ configured: false, verified: false }));
  }, []);

  useEffect(() => {
    if (seconds <= 0) return;
    const t = setTimeout(() => setSeconds((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [seconds]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 3200);
    return () => clearTimeout(t);
  }, [toast]);

  async function sendOtpFor(nextRole: AuthProfileId) {
    if (sendingFor.current === nextRole) return;
    sendingFor.current = nextRole;
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: nextRole }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; retryAfter?: number; ticket?: string };
    sendingFor.current = null;
    setBusy(false);
    if (!res.ok || !data.ok) {
      setError(data.error ?? "Could not send code.");
      if (data.retryAfter) setSeconds(data.retryAfter);
      return;
    }
    setOtpSent(true);
    setOtpTicket(data.ticket ?? null);
    setSeconds(data.retryAfter ?? 60);
    setToast(`Code sent for ${AUTH_PROFILES.find((p) => p.id === nextRole)?.label}`);
    requestAnimationFrame(() => otpRefs.current[0]?.focus());
  }

  function chooseRole(next: AuthProfileId) {
    if (otpSent && next === role) return;
    setRole(next);
    setOtp(["", "", "", "", "", ""]);
    setError(null);
    void sendOtpFor(next);
  }

  function changeRole() {
    sendingFor.current = null;
    setOtpSent(false);
    setOtpTicket(null);
    setOtp(["", "", "", "", "", ""]);
    setError(null);
  }

  async function verifyOtp(codeDigits = otp.join("")) {
    if (!/^\d{6}$/.test(codeDigits)) {
      setError("Enter the 6-digit code.");
      return;
    }
    setBusy(true);
    setError(null);
    const res = await fetch("/api/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: profile.demoEmail, role, code: codeDigits, ticket: otpTicket }),
    });
    const data = (await res.json()) as { ok?: boolean; error?: string; grant?: string; redirectTo?: string };
    if (!res.ok || !data.ok || !data.grant) {
      setBusy(false);
      setError(data.error ?? "Invalid code.");
      return;
    }
    const session = await signIn("otp-grant", { grant: data.grant, redirect: false });
    setBusy(false);
    if (!session?.ok) {
      setError("Could not start a session. Request a new code.");
      return;
    }
    setToast("Signed in");
    router.push(data.redirectTo ?? postLoginPath(role));
    router.refresh();
  }

  return (
    <div className="relative min-h-screen overflow-hidden bg-[#f4f1ea] text-[#1c1917]">
      <div className="pointer-events-none absolute -left-24 top-0 h-80 w-80 rounded-full bg-[#c9a227]/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-10 bottom-0 h-96 w-96 rounded-full bg-stone-300/40 blur-3xl" />

      <div className="mx-auto grid min-h-screen max-w-6xl items-center gap-10 px-6 py-10 lg:grid-cols-[1.05fr_1fr]">
        <div className="hidden lg:block">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-md bg-[#c9a227] text-sm font-bold text-[#1c1917]">
              RCB
            </div>
            <div>
              <div className="text-lg font-semibold">Sarafa Books</div>
              <div className="text-xs text-stone-500">Enterprise ERP · Gmail SMTP auth</div>
            </div>
          </div>
          <h1 className="mt-12 max-w-md text-4xl font-semibold leading-tight tracking-tight">
            Choose a role, then sign in with the code from Gmail.
          </h1>
          <p className="mt-4 max-w-md text-sm leading-6 text-stone-500">
            Select Sales, Billing, Store Manager, or Business Owner. A 6-digit code is emailed to your connected Gmail inbox.
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="login-card rounded-2xl p-6"
        >
          <div className="mb-5">
            <h2 className="text-xl font-semibold">Welcome back</h2>
            <p className="mt-1 text-sm text-stone-500">
              {otpSent
                ? `Enter the code sent for ${profile.label}, or change role.`
                : "Select a profile to receive a one-time code."}
            </p>
          </div>

          {otpSent ? (
            <div className="flex items-center gap-3 rounded-xl border border-[#c9a227] bg-[#f8efd4] p-3">
              <div className="min-w-0 flex-1">
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Signing in as
                </div>
                <div className="mt-1 text-sm font-semibold">{profile.label}</div>
                <div className="mt-0.5 text-[11px] leading-4 text-stone-500">{profile.description}</div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                className="shrink-0 bg-white"
                disabled={busy}
                onClick={changeRole}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                Change role
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {AUTH_PROFILES.map((item) => {
                const [Primary, Secondary] = ICONS[item.id];
                const active = item.id === role;
                return (
                  <button
                    key={item.id}
                    type="button"
                    disabled={busy}
                    onClick={() => chooseRole(item.id)}
                    className={`rounded-xl border p-3 text-left transition disabled:opacity-60 ${
                      active
                        ? "border-[#c9a227] bg-[#f8efd4] shadow-[0_0_0_3px_rgba(201,162,39,.18)]"
                        : "border-[#e7e1d8] bg-white hover:border-stone-300"
                    }`}
                  >
                    <div className="flex items-center gap-2 text-[#c9a227]">
                      <Primary className="h-4 w-4" />
                      <Secondary className="h-3.5 w-3.5 opacity-70" />
                    </div>
                    <div className="mt-2 text-sm font-semibold">{item.label}</div>
                    <div className="mt-0.5 text-[11px] leading-4 text-stone-500">{item.description}</div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mt-5 space-y-3">
            {!otpSent ? (
              <Button type="button" variant="gold" className="w-full" disabled={busy} onClick={() => void sendOtpFor(role)}>
                {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                Send code for {profile.label}
              </Button>
            ) : (
              <>
                <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-stone-500">
                  Enter the 6-digit code
                </div>
                <div className="flex gap-2">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={(el) => {
                        otpRefs.current[i] = el;
                      }}
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      aria-label={`Digit ${i + 1}`}
                      className="h-12 w-full rounded-md border border-[#e7e1d8] bg-[#f4f1ea] text-center text-lg font-semibold text-[#1c1917] outline-none focus:border-[#c9a227] focus:bg-white"
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(-1);
                        const next = [...otp];
                        next[i] = v;
                        setOtp(next);
                        if (v && i < 5) otpRefs.current[i + 1]?.focus();
                        if (v && i === 5 && next.join("").length === 6) void verifyOtp(next.join(""));
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Backspace" && !otp[i] && i > 0) otpRefs.current[i - 1]?.focus();
                      }}
                      onPaste={(e) => {
                        const text = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
                        if (!text) return;
                        e.preventDefault();
                        const next = text.split("");
                        while (next.length < 6) next.push("");
                        setOtp(next);
                        otpRefs.current[Math.min(text.length, 5)]?.focus();
                        if (text.length === 6) void verifyOtp(text);
                      }}
                    />
                  ))}
                </div>
                <Button type="button" variant="gold" className="w-full" disabled={busy} onClick={() => void verifyOtp()}>
                  {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
                  Sign in as {profile.label}
                </Button>
                <button
                  type="button"
                  className="w-full text-center text-xs text-stone-500 disabled:opacity-40"
                  disabled={seconds > 0 || busy}
                  onClick={() => void sendOtpFor(role)}
                >
                  {seconds > 0 ? `Resend code in ${seconds}s` : "Resend code"}
                </button>
              </>
            )}
          </div>

          {error && (
            <div className="mt-4 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-xs text-rose-700">
              {error}
            </div>
          )}

          <div className="mt-5 text-[11px] text-stone-500">
            Gmail SMTP:{" "}
            {!smtp
              ? "checking…"
              : smtp.verified
                ? `connected${smtp.inbox ? ` · codes go to ${smtp.inbox}` : ""}`
                : smtp.configured
                  ? smtp.error || "credentials set, not verified"
                  : "not configured"}
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            className="fixed bottom-6 right-6 rounded-md border border-[#c9a227]/50 bg-[#1c1917] px-4 py-2 text-sm text-[#f8efd4] shadow-xl"
          >
            {toast}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
