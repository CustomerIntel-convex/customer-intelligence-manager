import { useEffect, useState } from "react";
import { useMutation, useAction, useQuery } from "convex/react";
import { api } from "../lib/convex";
import { Kicker, LiveDot, Button } from "../components/ui";

/** Per-scenario UI copy (data lives in convex/lib/scenarios.ts). */
const SCENARIO_COPY: Record<
  string,
  { label: string; product: string; step2: string; step3: string; q1: string; q2: string }
> = {
  marlow: {
    label: "The Marlow House",
    product: "Boutique hotel (everyday business)",
    step2: "A guest emails: her $150 deposit still hasn't been released three weeks after checkout. The webhook classifies it and a signal is created.",
    step3: "20 signals arrive: a real deposit-refund complaint pattern. The agent clusters them and auto-investigates with live web research.",
    q1: 'The owner asks: "Is this only affecting guests who paid by card at checkout?"',
    q2: 'The owner asks: "Are other boutique hotels seeing the same deposit complaints?"',
  },
  starbucks: {
    label: "Starbucks",
    product: "Starbucks (everyday consumer brand)",
    step2: "A daily customer emails about mobile-order waits being broken again. The webhook classifies it and a signal is created.",
    step3: "20 signals arrive: a real complaints pattern. The agent clusters them and auto-investigates with live web research on the brand.",
    q1: 'Maria asks: "Is this only affecting morning-rush stores?"',
    q2: 'Maria asks: "Are competitors seeing the same thing?"',
  },
  acme: {
    label: "Acme AI",
    product: "Acme Assistant (fictional)",
    step2: "Dana sends a real email to the agent's inbox about slow mobile checkout. The webhook classifies it and a signal is created.",
    step3: "20 scenario signals arrive over ~20s. Watch the agent cluster them, watch the issue grow, and auto-trigger an investigation.",
    q1: 'Maria asks: "Is this only affecting mobile users?"',
    q2: 'Maria asks: "Are competitors seeing the same thing?"',
  },
  firecrawl: {
    label: "Firecrawl",
    product: "Firecrawl API (real product)",
    step2: "A high-volume customer emails about 429 rate limits breaking their batch jobs. The webhook classifies it and a signal is created.",
    step3: "20 signals arrive: a real rate-limit complaint pattern. The agent clusters them and auto-investigates with live web research on the product name.",
    q1: 'Maria asks: "Is this only affecting high-volume API users?"',
    q2: 'Maria asks: "Are competitors seeing the same rate-limit complaints?"',
  },
  agentmail: {
    label: "AgentMail",
    product: "AgentMail API (real product)",
    step2: "A customer emails about message.received webhooks arriving 10+ minutes late. The webhook classifies it and a signal is created.",
    step3: "20 signals arrive: delayed-webhook complaints. The agent clusters them and auto-investigates with live web research on the product name.",
    q1: 'Maria asks: "Is this only affecting webhook users?"',
    q2: 'Maria asks: "Are competitors seeing the same delivery delays?"',
  },
};

/** Live research burst — bounded, visible Firecrawl usage. */
function LiveResearchCard() {
  const status = useQuery(api.research.getStatus, {});
  const start = useMutation(api.research.startResearch);
  const stop = useMutation(api.research.stopResearch);
  const [, forceTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 1000);
    return () => clearInterval(t);
  }, []);

  if (status === undefined) return null;
  const remaining = status.running && status.endsAt ? Math.max(0, status.endsAt - Date.now()) : 0;
  const total = status.endsAt && status.startedAt ? status.endsAt - status.startedAt : 1;
  const progress = status.running ? Math.min(100, ((total - remaining) / total) * 100) : 0;
  const mm = Math.floor(remaining / 60000);
  const ss = Math.floor((remaining % 60000) / 1000);

  return (
    <div className={`ruled pt-4 ${status.running ? "running-sweep" : ""}`}>
      <KickerHead
        right={
          status.running ? (
            <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-[#f5a623]">
              <LiveDot /> researching
            </span>
          ) : undefined
        }
      >
        Live research burst
      </KickerHead>

      <div className="flex items-center justify-between gap-3">
        <p className="max-w-[200px] text-[11px] leading-relaxed text-zinc-500">
          {status.running
            ? "Sweeping sources + searching the live web on the watched product."
            : "Run ~2 minutes of visible web research on the watched product."}
        </p>
        {status.running ? (
          <Button
            variant="default"
            onClick={async () => {
              setBusy(true);
              try {
                await stop({});
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="shrink-0 border-red-500/30 bg-red-500/10 text-red-300 hover:border-red-500/50 hover:bg-red-500/20"
          >
            ■ Stop
          </Button>
        ) : (
          <Button
            variant="primary"
            onClick={async () => {
              setBusy(true);
              try {
                await start({ durationSec: 120 });
              } finally {
                setBusy(false);
              }
            }}
            disabled={busy}
            className="shrink-0"
          >
            ▶ Start research
          </Button>
        )}
      </div>

      {status.running && (
        <div className="mt-3">
          <div className="flex items-center justify-between font-mono text-[10px] text-zinc-500">
            <span>
              {mm}:{ss.toString().padStart(2, "0")} remaining
            </span>
            <span>sweep {status.iterations}</span>
          </div>
          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/[0.06]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#f5a623] to-[#e8892b] transition-all duration-1000"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-3 grid grid-cols-3 gap-2 border-t border-white/[0.06] pt-3">
        {[
          ["sweeps", status.iterations],
          ["items seen", status.itemsSeen],
          ["new signals", status.signalsFound],
        ].map(([k, v]) => (
          <div key={k as string} className="text-center">
            <div className="font-mono text-[15px] font-semibold text-zinc-100">{v}</div>
            <div className="text-[9px] uppercase tracking-wider text-zinc-600">{k}</div>
          </div>
        ))}
      </div>

      {!status.webResearchEnabled && (
        <p className="mt-2.5 text-[10px] leading-relaxed text-amber-400/80">
          Web research is paused — enable it above or sweeps will only use free sources.
        </p>
      )}
    </div>
  );
}
function WebResearchCard() {
  const status = useQuery(api.settings.getWebResearch, {});
  const setWebResearch = useMutation(api.settings.setWebResearch);
  const [busy, setBusy] = useState(false);

  const on = status?.enabled ?? false;
  const credits = status?.credits;

  return (
    <div className="ruled pt-4">
      <KickerHead>Web research · Firecrawl</KickerHead>
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <span
            className={`flex h-2 w-2 rounded-full ${
              on ? "bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.7)]" : "bg-zinc-600"
            }`}
          />
          <span className={`text-[12.5px] font-medium ${on ? "text-emerald-300" : "text-zinc-400"}`}>
            {on ? "Enabled" : "Paused"}
          </span>
        </div>
        <button
          onClick={async () => {
            setBusy(true);
            try {
              await setWebResearch({ enabled: !on });
            } finally {
              setBusy(false);
            }
          }}
          disabled={busy || !status?.configured}
          className={`relative h-6 w-11 shrink-0 rounded-full border transition-all duration-200 disabled:opacity-40 ${
            on
              ? "border-emerald-500/40 bg-emerald-500/25"
              : "border-white/10 bg-white/[0.06]"
          }`}
          aria-label={on ? "Stop web research" : "Enable web research"}
        >
          <span
            className={`absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full transition-all duration-200 ${
              on ? "left-[22px] bg-emerald-300" : "left-[3px] bg-zinc-400"
            }`}
          />
        </button>
      </div>
      <div className="mt-2.5 flex items-center justify-between font-mono text-[10px]">
        <span className="text-zinc-500">credits remaining</span>
        <span className={credits != null && credits < 0 ? "text-red-300" : "text-zinc-300"}>
          {credits ?? "—"}
        </span>
      </div>
      <p className="mt-2.5 border-t border-white/[0.06] pt-2.5 text-[10.5px] leading-relaxed text-zinc-600">
        {on
          ? "Investigations search the live web via Firecrawl. Monitor cycles also query paid sources."
          : "Investigations complete from stored email & discussion evidence and note the pause. Free HN monitoring keeps running."}
      </p>
    </div>
  );
}

function Step({
  n,
  title,
  desc,
  onClick,
  busy,
  done,
  last = false,
}: {
  n: number | string;
  title: string;
  desc: string;
  onClick: () => Promise<any>;
  busy: string | null;
  done?: boolean;
  last?: boolean;
}) {
  const [result, setResult] = useState<string | null>(null);
  const loading = busy === title;
  return (
    <div className="relative flex gap-4 px-5 py-4">
      {/* rail */}
      {!last && (
        <div className="absolute bottom-0 left-[38px] top-11 w-px bg-white/[0.07]" />
      )}
      <div
        className={`relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] font-semibold transition-all ${
          done
            ? "border-emerald-500/40 bg-emerald-500/15 text-emerald-300"
            : loading
              ? "animate-pulse-dot border-indigo-500/50 bg-[#f5a623]/12 text-[#f5a623]"
              : "border-white/[0.1] bg-zinc-900 text-zinc-500"
        }`}
      >
        {done ? "✓" : n}
      </div>
      <div className="min-w-0 flex-1 pb-1">
        <button
          onClick={async () => {
            setResult(null);
            try {
              const r = await onClick();
              setResult(JSON.stringify(r).slice(0, 120));
            } catch (e: any) {
              setResult(`✖ ${e.message.slice(0, 120)}`);
            }
          }}
          disabled={!!busy}
          className="text-left text-[13px] font-medium text-zinc-200 transition hover:text-white disabled:opacity-40"
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="animate-pulse-dot">◍</span> working…
            </span>
          ) : (
            title
          )}
        </button>
        <p className="mt-1 text-[11.5px] leading-relaxed text-zinc-500">{desc}</p>
        {result && (
          <p className="mt-1.5 break-all rounded-lg border border-white/[0.06] bg-black/20 px-2 py-1 font-mono text-[9.5px] text-zinc-500">
            {result}
          </p>
        )}
      </div>
    </div>
  );
}

export default function DemoPanel() {
  const [busy, setBusy] = useState<string | null>(null);
  const ws = useQuery(api.tenant.myWorkspace, {});
  const isDemo = ws?.isDemo !== false;
  const company = useQuery(api.queries.getCompany, {});
  const issues = useQuery(api.queries.listIssues, {});
  const reports = useQuery(api.queries.listReports, {});
  const inbox = useQuery(api.email.getAgentInbox, {});

  const scenario = company?.scenario ?? "acme";
  const copy = SCENARIO_COPY[scenario] ?? SCENARIO_COPY.acme;

  const run = (title: string, fn: () => Promise<any>) => async () => {
    setBusy(title);
    try {
      return await fn();
    } finally {
      setBusy(null);
    }
  };

  const configureScenario = useMutation(api.demo.configureScenario);
  const setup = useAction(api.demo.setup);
  const reset = useMutation(api.demo.resetDemo);
  const seedHistory = useMutation(api.demo.seedHistory);
  const customerEmail = useMutation(api.demo.sendCustomerComplaint);
  const seedSignals = useMutation(api.demo.seedPublicSignals);
  const employeeAsk = useMutation(api.demo.employeeAsk);
  const investigateNow = useMutation(api.chat.runInvestigationNow);

  const rampedIssue = issues?.find((i: any) =>
    ["critical", "confirmed", "emerging"].includes(i.status)
  );
  const reportSent = (reports?.length ?? 0) > 0;
  const employeeMail =
    inbox?.messages.filter((m: any) => m.routing?.classification?.startsWith("employee")).length ?? 0;

  return (
      <div className="space-y-5">
        {/* scenario switcher — demo workspace only */}
        {isDemo && (
        <div className="ruled pt-4">
          <KickerHead right={<span className="font-mono text-[9.5px] text-[#6f695c]">{copy.product}</span>}>
            Watched product
          </KickerHead>
          <div className="mt-2 flex flex-wrap gap-2">
            {Object.entries(SCENARIO_COPY).map(([key, sc]) => (
              <button
                key={key}
                onClick={run(`switch:${key}`, () => configureScenario({ scenario: key }))}
                disabled={!!busy}
                className={`border px-3.5 py-1.5 font-mono text-[11px] uppercase tracking-[0.08em] transition-colors disabled:opacity-40 ${
                  scenario === key
                    ? "border-[#f0a428]/60 bg-[#f0a428]/10 text-[#f0a428]"
                    : "border-[#ece5d5]/15 text-[#6f695c] hover:border-[#ece5d5]/35 hover:text-[#c3baa8]"
                }`}
              >
                {busy === `switch:${key}` ? "switching…" : sc.label}
                {scenario === key && " ▪"}
              </button>
            ))}
          </div>
          <p className="mt-2.5 text-[10.5px] leading-relaxed text-[#6f695c]">
            Switching rewrites the company identity, monitored sources and story data —
            inboxes stay the same. Steps below then run the scenario.
          </p>
        </div>
        )}

      {isDemo && (
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-[13px] text-[#a89f8c]">
          The scenario, step by step — every button runs the real pipeline.
        </p>
        <span className="flex items-center gap-1.5 font-mono text-[9.5px] uppercase tracking-[0.16em] text-[#86d99a]">
          <LiveDot /> live
        </span>
      </div>
      )}

      <div className="grid gap-5 lg:grid-cols-3">
        {isDemo ? (
        <div className="lg:col-span-2">
          <div className="border-b border-white/[0.06] px-5 py-3.5">
            <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
              3-minute walkthrough
            </span>
          </div>
          <div className="divide-y divide-white/[0.04]">
            <Step
              n={0}
              title="Provision (setup)"
              desc="Creates the 3 real AgentMail inboxes (agent, Maria, Dana), the company, watch rules and monitored sources. Idempotent."
              busy={busy}
              done={!!company?.agentInbox}
              onClick={run("Provision (setup)", () => setup({}))}
            />
            <Step
              n={1}
              title="Load the agent's memory"
              desc="Historical context: checkout latency (desktop) resolved Aug 12–18 (payment-provider timeout) + 2 stable topics. This is what it remembers later."
              busy={busy}
              onClick={run("Load the agent's memory", () => seedHistory({}))}
            />
            <Step
              n={2}
              title="A customer email arrives"
              desc={copy.step2}
              busy={busy}
              onClick={run("A customer email arrives", () => customerEmail({}))}
            />
            <Step
              n={3}
              title="Public discussion ramps up"
              desc={copy.step3}
              busy={busy}
              onClick={run("Public discussion ramps up", () => seedSignals({}))}
            />
            <Step
              n={4}
              title="Investigation & report"
              desc="Forces an investigation of the top issue (normally fires automatically when the ramp crosses the threshold) and emails the report to Maria."
              busy={busy}
              done={reportSent}
              onClick={run("Investigation & report", () => investigateNow({}))}
            />
            <Step
              n={5}
              title={copy.q1}
              desc="A real reply on the report thread. The agent investigates the question and replies with evidence."
              busy={busy}
              done={employeeMail >= 1}
              onClick={run(copy.q1, () => employeeAsk({ question: SCENARIO_COPY[scenario].q1.replace(/^Maria asks: "|"$/g, "") }))}
            />
            <Step
              n={6}
              title={copy.q2}
              desc="Fresh web research via Firecrawl, correlated with the issue, replied on the thread."
              busy={busy}
              done={employeeMail >= 2}
              onClick={run(copy.q2, () => employeeAsk({ question: SCENARIO_COPY[scenario].q2.replace(/^Maria asks: "|"$/g, "") }))}
            />
            <Step
              n="↺"
              last
              title="Reset demo data"
              desc="Wipes signals, issues, evidence, investigations, reports and chat. Keeps inboxes and config. Old mail is marked as seen so nothing reprocesses."
              busy={busy}
              onClick={run("Reset demo data", () => reset({}))}
            />
          </div>
        </div>
        ) : (
        <div className="ruled pt-4 lg:col-span-2">
          <KickerHead>Your workspace</KickerHead>
          <div
            className="mt-2 text-[22px] font-medium tracking-tight text-[#ece5d5]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            Watching {company?.product ?? "your product"}
          </div>
          <p className="mt-3 max-w-lg text-[12.5px] leading-relaxed text-[#a89f8c]">
            This is your own isolated workspace. The agent monitors Hacker News, Reddit and
            the open web for your product, clusters complaints into issues with evidence,
            and remembers what it has seen. Use the live research burst on the right to
            sweep the web now, or just ask in the Ask tab.
          </p>
          <div className="mt-4 flex flex-wrap gap-3">
            <Button onClick={run("Investigate top issue", () => investigateNow({}))} disabled={!!busy || (issues?.length ?? 0) === 0}>
              {busy === "Investigate top issue" ? "investigating…" : "⌕ Investigate top issue"}
            </Button>
          </div>
          {(issues?.length ?? 0) === 0 && (
            <p className="mt-3 font-mono text-[10px] leading-relaxed text-[#8a8271]">
              no issues yet — run a research burst or wait for the background monitor
              (every 30 minutes) to find your first signals.
            </p>
          )}
        </div>
        )}

        <div className="space-y-4">
          <LiveResearchCard />
          <WebResearchCard />

          <div className="ruled pt-4">
            <KickerHead>Live state</KickerHead>
            <dl className="space-y-2.5 text-[12px]">
              {[
                ["Agent inbox", company?.agentInbox ?? "—", "mono"],
                ["Employee", company?.employeeEmail ?? "—", "mono"],
                ["Customer", company?.demoCustomerEmail ?? "—", "mono"],
                ["Issues", String(issues?.length ?? 0), "sans"],
                [
                  "Ramping issue",
                  rampedIssue ? `${rampedIssue.title} (${rampedIssue.status})` : "—",
                  "sans",
                ],
                ["Reports sent", String(reports?.length ?? 0), "sans"],
              ].map(([k, v, style]) => (
                <div key={k as string} className="flex items-center justify-between gap-3">
                  <dt className="shrink-0 text-zinc-500">{k}</dt>
                  <dd
                    className={`truncate text-right text-zinc-300 ${style === "mono" ? "font-mono text-[10.5px]" : ""}`}
                  >
                    {v}
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div className="ruled pt-4">
            <KickerHead>Monitored sources</KickerHead>
            <ul className="space-y-2">
              {company?.sources?.map((s: any) => (
                <li key={s._id} className="flex items-center justify-between text-[11.5px]">
                  <span className="text-zinc-300">{s.name}</span>
                  <span
                    className={`flex items-center gap-1.5 font-mono text-[9.5px] ${
                      s.lastCheckedAt ? "text-emerald-400" : "text-zinc-600"
                    }`}
                  >
                    {s.lastCheckedAt && <span className="h-1 w-1 rounded-full bg-current" />}
                    {s.lastCheckedAt ? "checked" : "pending"}
                  </span>
                </li>
              ))}
              {(!company?.sources || company.sources.length === 0) && (
                <li className="text-[11.5px] text-zinc-500">Run setup first.</li>
              )}
            </ul>
            <p className="mt-3 border-t border-white/[0.06] pt-3 text-[10.5px] leading-relaxed text-zinc-600">
              Inbound mail never sleeps: webhook + a 2-minute poll cron feed the same handler. Web
              monitoring is on-demand (budget-friendly); HN uses a free direct feed. Firecrawl web
              research is toggleable via <span className="font-mono">FIRECRAWL_ENABLED</span>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function KickerHead({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="mb-3 flex items-baseline justify-between">
      <div className="kicker">{children}</div>
      {right}
    </div>
  );
}
