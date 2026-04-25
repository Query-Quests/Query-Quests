"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import PublicHeader from "@/components/marketing/PublicHeader";
import PublicFooter from "@/components/marketing/PublicFooter";

const FONT_STYLE = {
  fontFamily: "var(--font-geist-sans), Geist, Arial, sans-serif",
};

/**
 * /verify-email — URL-token email verification page.
 *
 * Visual style matches the Pencil "04 · Verify Email" frame (`bAGAB`)
 * adapted to our existing URL-token flow (the Pencil mock shows OTP
 * boxes; we deliberately keep the token-in-URL contract powered by
 * `/api/verify-email`).
 *
 * States:
 *   - "no-token"   : URL has no `?token=` param           (red X card)
 *   - "verifying"  : token present, request in flight     (spinner card)
 *   - "success"    : API returned 200                     (green check card)
 *   - "error"      : API returned non-200 / network fail  (red X card)
 */
export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");

  // Pick the meaningful initial state synchronously so the first paint
  // never flashes "Verification failed" while we're actually verifying.
  const initialState = token ? "verifying" : "no-token";
  const [state, setState] = useState(initialState);
  const [message, setMessage] = useState(
    token ? "" : "No verification token provided.",
  );

  useEffect(() => {
    if (!token) return;

    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await res.json().catch(() => ({}));
        if (cancelled) return;
        if (res.ok) {
          setState("success");
          setMessage(data.message || "You can now sign in.");
        } else {
          setState("error");
          setMessage(data.error || "We couldn't verify this link.");
        }
      } catch {
        if (cancelled) return;
        setState("error");
        setMessage("An error occurred while verifying your email.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [token]);

  const goLogin = () => router.push("/auth");

  return (
    <div
      className="min-h-screen flex flex-col bg-[#f9f9f9] text-[#030914]"
      style={FONT_STYLE}
    >
      <PublicHeader variant="light" />

      <main className="flex-1 flex items-center justify-center px-4 py-16 sm:py-24">
        <div className="w-full max-w-[520px] bg-white border border-gray-200 rounded-2xl px-8 sm:px-14 py-12 sm:py-14 flex flex-col items-center text-center">
          <StateIcon state={state} />

          <h1 className="mt-6 text-[24px] font-bold leading-[1.2] tracking-[-0.4px] text-[#030914]">
            {headingFor(state)}
          </h1>

          <p className="mt-3 text-[14px] leading-[1.6] text-[#6b7280] max-w-[380px]">
            {bodyFor(state, message)}
          </p>

          {(state === "success" ||
            state === "error" ||
            state === "no-token") && (
            <button
              type="button"
              onClick={goLogin}
              className="mt-8 w-full h-12 rounded-full bg-[#19aa59] text-white text-[14px] font-semibold hover:bg-[#15934d] transition-colors focus:outline-none focus:ring-2 focus:ring-[#19aa59]/40 focus:ring-offset-2"
            >
              Go to Login
            </button>
          )}

          {state !== "verifying" && (
            <p className="mt-5 text-[13px] text-[#6b7280]">
              Need a new link?{" "}
              <a
                href="/auth?tab=register"
                className="font-semibold text-[#19aa59] hover:underline"
              >
                Sign up again
              </a>
            </p>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  );
}

function StateIcon({ state }) {
  // 80px round badge, matching the Pencil card's mail-icon slot.
  const base =
    "h-20 w-20 rounded-full flex items-center justify-center flex-shrink-0";

  if (state === "verifying") {
    return (
      <div
        className={`${base} bg-[#19aa59]/10`}
        role="status"
        aria-label="Verifying"
      >
        <Loader2 className="h-9 w-9 text-[#19aa59] animate-spin" />
      </div>
    );
  }

  if (state === "success") {
    return (
      <div className={`${base} bg-[#19aa59]/10`} aria-hidden>
        <CheckCircle className="h-10 w-10 text-[#19aa59]" strokeWidth={2.2} />
      </div>
    );
  }

  // no-token | error → red X. We swap the Pencil mail icon for a
  // destructive variant so the failure state is unambiguous.
  return (
    <div className={`${base} bg-[#ef4444]/10`} aria-hidden>
      <XCircle className="h-10 w-10 text-[#ef4444]" strokeWidth={2.2} />
    </div>
  );
}

function headingFor(state) {
  switch (state) {
    case "verifying":
      return "Verifying your email…";
    case "success":
      return "Email verified!";
    case "no-token":
      return "Verify Your Email";
    case "error":
    default:
      return "Verification failed";
  }
}

function bodyFor(state, message) {
  switch (state) {
    case "verifying":
      return "Hang tight while we confirm your verification link.";
    case "success":
      return message || "You can now sign in.";
    case "no-token":
      return "No verification token provided. Open the link from the email we sent you, or request a new one.";
    case "error":
    default:
      return message || "We couldn't verify this link.";
  }
}
