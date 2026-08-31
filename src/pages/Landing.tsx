import { useState } from "react";
import { useAuthActions } from "@convex-dev/auth/react";
import { Button, Kicker, todayLine } from "../components/ui";

const LOOP = ["OBSERVE", "DETECT", "INVESTIGATE", "REMEMBER", "PRIORITIZE", "REPORT"];

/** Radar-mark satellite — the brand mark, drawn in SVG. Scales cleanly. */
function SatelliteMark({ size = 64 }: { size?: number }) {
  return (
    <svg viewBox="0 0 80 80" width={size} height={size} className="h-auto w-full">
      <circle cx="40" cy="40" r="38.5" fill="none" stroke="rgba(236,229,213,0.16)" strokeWidth="0.8" />
      <circle cx="40" cy="40" r="27" fill="none" stroke="rgba(236,229,213,0.11)" strokeWidth="0.8" />
      <circle cx="40" cy="40" r="15.5" fill="none" stroke="rgba(236,229,213,0.08)" strokeWidth="0.8" />
      <path d="M40 1.5 V78.5 M1.5 40 H78.5" stroke="rgba(236,229,213,0.07)" strokeWidth="0.6" />
      <g className="radar-sweep" style={{ transformOrigin: "40px 40px" }}>
        <path d="M40 40 L40 6 A34 34 0 0 1 60 14 Z" fill="url(#sweepGrad)" />
      </g>
      <defs>
        <linearGradient id="sweepGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#f0a428" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#f0a428" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect x="34" y="34" width="12" height="12" rx="2.5" fill="#ece5d5" />
      <path
        d="M40 34 L40 23 M40 23 L34 16 M40 23 L46 16"
        stroke="#ece5d5"
        strokeWidth="1.4"
        fill="none"
        strokeLinecap="round"
      />
      <circle cx="22" cy="58" r="1.7" fill="#86d99a" />
      <circle cx="60" cy="24" r="1.7" fill="#f0a428" />
    </svg>
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
    window.location.reload();
  };

  return (
    <div className="flex h-full flex-col overflow-y-auto">
      {/* nameplate */}
      <header className="border-b border-[#ece5d5]/25 px-10 pb-4 pt-6">
        <div className="mx-auto flex max-w-4xl items-baseline justify-between">
          <Kicker>Customer Intelligence</Kicker>
          <Kicker className="hidden sm:block">{todayLine()}</Kicker>
          <Kicker className="text-[#86d99a]">agent on duty</Kicker>
        </div>
      </header>

      <main className="mx-auto w-full max-w-4xl flex-1 px-10 pb-12">
        <div className="mt-10 grid items-center gap-10 sm:grid-cols-[1fr_auto]">
          <div>
            <Kicker className="rise-1 text-[#f0a428]">
              The morning brief for anyone with customers
            </Kicker>
            <h1
              className="rise-2 mt-4 text-balance text-[36px] font-medium leading-[1.12] tracking-tight text-[#ece5d5] sm:text-[46px]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              You run the business.
              <br />
              <span className="italic text-[#8a8271]">It listens to your customers.</span>
            </h1>
          </div>
          <div className="rise-2 hidden w-[190px] shrink-0 sm:block">
            <SatelliteMark />
          </div>
        </div>

        <p className="rise-3 mt-6 max-w-xl text-[13.5px] leading-relaxed text-[#a89f8c]">
          An autonomous employee that listens to reviews, forums and your inbox every day,
          clusters what it hears into issues backed by evidence, remembers last month's
          incidents, and emails you only when something matters. Hotel, clinic, restaurant,
          SaaS — if you have customers, it listens.
        </p>

        {/* the loop as a ruled strip */}
        <div className="rise-4 mt-9 border-y border-[#ece5d5]/15 py-3">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-2">
            {LOOP.map((step, i) => (
              <span key={step} className="flex items-center gap-2">
                <span className="font-mono text-[9.5px] tracking-[0.2em] text-[#cfc6b2]">
                  {step}
                </span>
                {i < LOOP.length - 1 && (
                  <span className="font-mono text-[9px] text-[#4d483e]">→</span>
                )}
              </span>
            ))}
          </div>
        </div>

        <div className="rise-5 mt-10 flex flex-col items-start gap-3 sm:flex-row sm:items-center">
          <Button variant="primary" onClick={enter} disabled={busy} className="px-6 py-2.5">
            {busy ? "Opening…" : "See it working live →"}
          </Button>
          <span className="font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-[#8a8271]">
            one click, no signup · a live agent, a real business
          </span>
        </div>
        {error && <p className="mt-3 font-mono text-[10px] text-[#e5484d]">{error}</p>}
      </main>

      <footer className="border-t border-[#ece5d5]/15 px-10 py-4">
        <div className="mx-auto flex max-w-4xl justify-between">
          <Kicker>convex · openai · firecrawl · agentmail</Kicker>
          <Kicker className="hidden sm:block">all gas hackathon</Kicker>
        </div>
      </footer>
    </div>
  );
}
