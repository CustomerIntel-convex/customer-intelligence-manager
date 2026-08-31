import { useEffect, useState } from "react";
import { ConvexProvider, useQuery } from "convex/react";
import { useAuthActions } from "@convex-dev/auth/react";
import { BrowserRouter, NavLink, Route, Routes, useLocation } from "react-router-dom";
import { convex, api } from "./lib/convex";
import { Kicker, LiveDot, timeAgo, todayLine } from "./components/ui";
import Landing from "./pages/Landing";
import Overview from "./pages/Overview";
import Issues from "./pages/Issues";
import IssueDetail from "./pages/IssueDetail";
import Mail from "./pages/Mail";
import Chat from "./pages/Chat";
import DemoPanel from "./pages/DemoPanel";

const RAIL = [
  { to: "/", n: "01", label: "Brief", end: true },
  { to: "/issues", n: "02", label: "Issues", badge: "issues" },
  { to: "/mail", n: "03", label: "Mail" },
  { to: "/chat", n: "04", label: "Ask" },
  { to: "/demo", n: "05", label: "Demo" },
];

const TITLES: Record<string, string> = {
  "/": "The Morning Brief",
  "/issues": "Issues — the ledger of customer problems",
  "/mail": "The inbox — routed, investigated, answered",
  "/chat": "Ask the agent",
  "/demo": "Demo scenarios",
};

/** Masthead — the newspaper nameplate. */
function Masthead() {
  const location = useLocation();
  const [clock, setClock] = useState(() => new Date());
  useEffect(() => {
    const t = setInterval(() => setClock(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  const title =
    TITLES[location.pathname] ??
    (location.pathname.startsWith("/issues") ? "Issue" : "Customer Intelligence");

  return (
    <header className="shrink-0 border-b border-[#ece5d5]/25 px-10 pb-3 pt-4">
      <div className="flex items-baseline justify-between">
        <div className="flex items-baseline gap-4">
          <span
            className="text-[19px] font-medium tracking-tight text-[#ece5d5]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {title}
          </span>
          <Kicker className="hidden md:block">{todayLine()}</Kicker>
        </div>
        <div className="flex items-center gap-5">
          <span className="hidden items-center gap-2 lg:flex">
            <Kicker>convex / openai / firecrawl / agentmail</Kicker>
          </span>
          <span className="flex items-center gap-2">
            <LiveDot />
            <Kicker className="text-[#86d99a]">on duty</Kicker>
          </span>
          <span className="font-mono text-[11px] tabular-nums text-[#8a8271]">
            {clock.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", second: "2-digit" })}
          </span>
        </div>
      </div>
    </header>
  );
}

/** Numbered left rail. */
function Rail() {
  const company = useQuery(api.queries.getCompany, {});
  const badges = useQuery(api.queries.getNavBadges, {});
  const activity = useQuery(api.queries.listActivity, {});
  const user = useQuery(api.auth.currentUser, {});
  const last = activity?.[0];

  return (
    <aside className="flex w-[188px] shrink-0 flex-col border-r border-[#ece5d5]/12 px-5 pb-5 pt-7">
      {/* wordmark */}
      <div className="px-1">
        <div className="font-mono text-[9.5px] uppercase tracking-[0.24em] text-[#8a8271]">
          Customer
          <br />
          Intelligence
        </div>
        <div className="mt-2 h-px w-8 bg-[#f0a428]/70" />
      </div>

      {/* nav */}
      <nav className="mt-8 space-y-1">
        {RAIL.map((r) => (
          <NavLink
            key={r.to}
            to={r.to}
            end={r.end as any}
            className={({ isActive }) =>
              `group flex items-baseline gap-3 rounded-none py-1.5 pl-1 pr-2 transition-colors ${
                isActive
                  ? "text-[#ece5d5]"
                  : "text-[#6f695c] hover:text-[#c3bAA8]"
              }`
            }
          >
            {({ isActive }) => (
              <>
                <span
                  className={`font-mono text-[10px] tabular-nums ${
                    isActive ? "text-[#f0a428]" : "text-[#4d483e]"
                  }`}
                >
                  {r.n}
                </span>
                <span
                  className={`text-[13px] ${isActive ? "font-medium" : ""}`}
                  style={{ fontFamily: isActive ? "var(--font-display)" : undefined }}
                >
                  {r.label}
                </span>
                {r.badge === "issues" && badges && badges.critical + badges.emerging > 0 && (
                  <span className="ml-auto font-mono text-[10px] tabular-nums text-[#f0a428]">
                    {badges.critical + badges.emerging}
                  </span>
                )}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* colophon */}
      <div className="mt-auto space-y-3">
        <div className="ruled pt-3">
          <Kicker>Watching</Kicker>
          <div
            className="mt-1.5 truncate text-[13px] text-[#ece5d5]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            {company?.name ?? "—"}
          </div>
          <div className="mt-0.5 truncate font-mono text-[9.5px] text-[#6f695c]">
            {company?.agentInbox ?? "not provisioned"}
          </div>
        </div>
        <div className="ruled pt-2.5">
          <div className="flex items-center justify-between">
            <Kicker>Last action</Kicker>
            <span className="font-mono text-[9.5px] text-[#8a8271]">
              {last ? `${timeAgo(last.startedAt)} ago` : "—"}
            </span>
          </div>
          {user && (
            <div className="mt-2 flex items-center justify-between gap-2">
              <span className="truncate font-mono text-[9.5px] text-[#6f695c]">{user.email}</span>
              <SignOut />
            </div>
          )}
        </div>
        <p className="font-mono text-[8.5px] uppercase tracking-[0.18em] leading-relaxed text-[#6f695c]">
          observes · investigates
          <br />
          remembers · reports
        </p>
      </div>
    </aside>
  );
}

function SignOut() {
  return (
    <button
      onClick={() => {
        Object.keys(localStorage)
          .filter((k) => k.includes("convexAuth"))
          .forEach((k) => localStorage.removeItem(k));
        window.location.reload();
      }}
      className="shrink-0 font-mono text-[8.5px] uppercase tracking-[0.16em] text-[#6f695c] transition-colors hover:text-[#ece5d5]"
    >
      exit
    </button>
  );
}

function Shell() {
  return (
    <div className="flex h-full flex-col">
      <Masthead />
      <div className="flex min-h-0 flex-1">
        <Rail />
        <main className="min-w-0 flex-1 overflow-y-auto px-10 py-7">
          <Routes>
            <Route path="/" element={<Overview />} />
            <Route path="/issues" element={<Issues />} />
            <Route path="/issues/:issueId" element={<IssueDetail />} />
            <Route path="/mail" element={<Mail />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/demo" element={<DemoPanel />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

const JWT_KEY =
  "__convexAuthJWT_" + (import.meta as any).env.VITE_CONVEX_URL.replace(/[^a-z0-9]/gi, "");

function AuthGate() {
  const [session, setSession] = useState<boolean>(() => !!localStorage.getItem(JWT_KEY));
  useEffect(() => {
    const check = () => setSession(!!localStorage.getItem(JWT_KEY));
    const t = setInterval(check, 500);
    window.addEventListener("storage", check);
    return () => {
      clearInterval(t);
      window.removeEventListener("storage", check);
    };
  }, []);
  if (!session) return <Landing />;
  return (
    <BrowserRouter>
      <Shell />
    </BrowserRouter>
  );
}

export default function App() {
  return (
    <ConvexProvider client={convex}>
      <AuthGate />
    </ConvexProvider>
  );
}
