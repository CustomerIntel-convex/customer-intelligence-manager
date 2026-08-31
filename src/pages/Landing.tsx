import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button } from "../components/ui";

const JWT_KEY =
  "__convexAuthJWT_" +
  (import.meta as any).env.VITE_CONVEX_URL.replace(/[^a-z0-9]/gi, "");

const LOOP = ["OBSERVE", "DETECT", "INVESTIGATE", "REMEMBER", "PRIORITIZE", "REPORT"];

/** Radar-mark satellite — the brand mark, drawn in SVG. */
function SatelliteMark() {
  return (
    <div className="relative h-20 w-20">
      <svg viewBox="0 0 80 80" className="h-full w-full">
        <circle cx="40" cy="40" r="37" fill="none" stroke="rgba(239,233,220,0.14)" strokeWidth="1" />
        <circle cx="40" cy="40" r="26" fill="none" stroke="rgba(239,233,220,0.09)" strokeWidth="1" strokeDasharray="2 4" />
        {/* sweep */}
        <g className="radar-sweep" style={{ transformOrigin: "40px 40px" }}>
          <path d="M40 40 L40 5 A35 35 0 0 1 62 13 Z" fill="url(#sweepGrad)" />
        </g>
        <defs>
          <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stopColor="#f5a623" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#f5a623" stopOpacity="0" />
          </linearGradient>
        </defs>
        {/* body */}
        <rect x="34" y="34" width="12" height="12" rx="2.5" fill="#efe9dc" />
        <path d="M40 34 L40 22 M40 22 L33 15 M40 22 L47 15" stroke="#efe9dc" strokeWidth="1.6" fill="none" strokeLinecap="round" />
        <circle cx="21" cy="59" r="1.6" fill="#7dd88f" />
        <circle cx="61" cy="23" r="1.6" fill="#f5a623" />
      </svg>
    </div>
  );
}

export default function Landing() {
  const { signIn } = useAuthActions();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const enter = async () => {
    setBusy(true);
    setError(null);
    try {
      await signIn("password", {
        email: "demo@customer-intel.app",
        password: "watch-the-customer",
        flow: "signIn",
      });
    } catch {
      try {
        await signIn("password", {
          email: "demo@customer-intel.app",
          password: "watch-the-customer",
          flow: "signUp",
        });
      } catch (e: any) {
        setError(e.message?.slice(0, 100) ?? "sign-in failed");
        setBusy(false);
        return;
      }
    }
    // Convex Auth stored the session tokens — unlock the workspace.
    window.location.reload();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* top bar */}
      <header className="flex items-center justify-between px-8 py-5">
        <span className="font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-500">
          Customer Intelligence
        </span>
        <span className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.22em] text-zinc-600">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60" />
            <span className="relative h-1.5 w-1.5 rounded-full bg-emerald-400" />
          </span>
          agent on duty
        </span>
      </header>

      {/* hero */}
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col items-center px-8 pb-10 pt-6 text-center">
        <div className="rise-1">
          <SatelliteMark />
        </div>

        <p className="rise-2 mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-[#f5a623]">
          The morning brief for anyone with customers
        </p>

        <h1
          className="rise-3 mt-4 max-w-3xl text-balance text-[34px] font-medium leading-[1.15] tracking-tight text-[#efe9dc] sm:text-[44px]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          You run the business.
          <br />
          <span className="text-zinc-500 italic">It listens to your customers</span> — reviews,
          forums, inbox, every day.
        </h1>

        <p className="rise-4 mt-5 max-w-xl text-[13.5px] leading-relaxed text-zinc-400">
          An autonomous employee that clusters what it hears into issues backed by evidence,
          remembers last month's incidents, and emails you only when something matters.
          Hotel, clinic, restaurant, SaaS — if you have customers, it listens.
        </p>

        {/* the loop, as a typographic strip */}
        <div className="rise-5 mt-8 flex flex-wrap items-center justify-center gap-x-1 gap-y-2">
          {LOOP.map((step, i) => (
            <span key={step} className="flex items-center gap-1">
              <span
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-2.5 py-1 font-mono text-[9.5px] tracking-[0.18em] text-zinc-400"
                style={{ animationDelay: `${0.5 + i * 0.1}s` }}
              >
                {step}
              </span>
              {i < LOOP.length - 1 && (
                <span className="font-mono text-[9px] text-zinc-700">→</span>
              )}
            </span>
          ))}
        </div>

        {/* enter */}
        <div className="rise-5 mt-10 w-full max-w-xs">
          <Button variant="primary" onClick={enter} disabled={busy} className="w-full">
            {busy ? "Opening the workspace…" : "See it working live →"}
          </Button>
          <p className="mt-3 text-center text-[10px] leading-relaxed text-zinc-600">
            One click, no signup — you'll watch a live agent monitor a real business.
            Powered by Convex Auth.
          </p>
          {error && <p className="mt-2 text-center text-[10px] text-red-400">{error}</p>}
        </div>
      </main>

      {/* footer strip */}
      <footer className="flex flex-wrap items-center justify-center gap-x-5 gap-y-1 border-t border-white/[0.05] px-8 py-4 font-mono text-[9.5px] uppercase tracking-[0.2em] text-zinc-600">
        <span>convex</span>
        <span className="text-zinc-800">·</span>
        <span>openai</span>
        <span className="text-zinc-800">·</span>
        <span>firecrawl</span>
        <span className="text-zinc-800">·</span>
        <span>agentmail</span>
      </footer>
    </div>
  );
}
