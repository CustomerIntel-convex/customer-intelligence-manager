import { useQuery, api } from "../lib/convex";
import {
  Kicker,
  Mark,
  Numeral,
  Section,
  Trend,
  TypeGlyph,
  SkeletonBlock,
  EmptyState,
  timeAgo,
  fmtDate,
} from "../components/ui";
import { Sparkline } from "../components/charts";
import { Link } from "react-router-dom";

export default function Overview() {
  const overview = useQuery(api.queries.getOverview, {});

  if (overview === undefined) {
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-4 gap-8">
          {[...Array(4)].map((_, i) => (
            <SkeletonBlock key={i} className="h-16" />
          ))}
        </div>
        <SkeletonBlock className="h-40" />
        <SkeletonBlock className="h-64" />
      </div>
    );
  }
  if (overview === null) {
    return (
      <EmptyState
        glyph="◍"
        title="The agent isn't hired yet"
        hint="Run setup from the Demo panel to provision the company, inboxes and sources."
      />
    );
  }

  const rising = overview.recentChanges.filter((c: any) => (c.growthMultiplier ?? 1) > 1).length;

  return (
    <div className="space-y-10">
      {/* headline figures */}
      <div className="grid grid-cols-2 gap-x-8 gap-y-6 md:grid-cols-4">
        <div>
          <Kicker>Critical</Kicker>
          <Numeral className="mt-1.5 text-[44px]" tone={overview.counts.critical > 0 ? "down" : "dim"}>
            {overview.counts.critical}
          </Numeral>
        </div>
        <div>
          <Kicker>Emerging</Kicker>
          <Numeral className="mt-1.5 text-[44px]" tone={overview.counts.emerging > 0 ? "signal" : "dim"}>
            {overview.counts.emerging}
          </Numeral>
        </div>
        <div>
          <Kicker>Stable</Kicker>
          <Numeral className="mt-1.5 text-[44px]">{overview.counts.stable}</Numeral>
        </div>
        <div>
          <Kicker>Signals under watch</Kicker>
          <Numeral className="mt-1.5 text-[44px]">{overview.signalCount}</Numeral>
          <div className="mt-1 font-mono text-[10px] text-[#6f695c]">
            {overview.emailSignals} email · {overview.webSignals} web · {rising} rising
          </div>
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-5">
        <div className="space-y-10 lg:col-span-3">
          {/* signal volume */}
          <Section strong>
            <div className="flex items-baseline justify-between">
              <Kicker>Signal volume — last 14 days</Kicker>
              <span className="font-mono text-[9.5px] text-[#4d483e]">
                {overview.dayLabels?.[0]} — {overview.dayLabels?.[13]}
              </span>
            </div>
            <div className="mt-4">
              <div className="flex items-end gap-[3px] border-b border-[#ece5d5]/25 pb-px" style={{ height: 56 }}>
                {(overview.totalDaily ?? []).map((v: number, i: number) => {
                  const max = Math.max(...(overview.totalDaily ?? [1]), 1);
                  return (
                    <div
                      key={i}
                      className="flex-1 transition-all duration-300"
                      style={{
                        height: `${Math.max((v / max) * 100, v > 0 ? 10 : 2)}%`,
                        background:
                          v > 0 ? "rgba(240,164,40,0.6)" : "rgba(236,229,213,0.14)",
                      }}
                      title={`${overview.dayLabels?.[i]}: ${v}`}
                    />
                  );
                })}
              </div>
              <div className="mt-3">
                <Kicker>
                  sources — email {overview.emailSignals} · web {overview.webSignals}
                </Kicker>
              </div>
            </div>
          </Section>

          {/* the ledger of changes */}
          <Section strong>
            <div className="flex items-baseline justify-between">
              <Kicker>What changed</Kicker>
              <Link to="/issues" className="font-mono text-[10px] text-[#8a8271] hover:text-[#ece5d5]">
                all issues →
              </Link>
            </div>
            <div className="mt-2">
              {overview.recentChanges.length === 0 && (
                <EmptyState glyph="—" title="Quiet out there" hint="No issues yet." />
              )}
              {overview.recentChanges.map((c: any) => (
                <Link
                  key={c._id}
                  to={`/issues/${c._id}`}
                  className="ledger-row group flex items-center gap-5 border-b border-[#ece5d5]/8 py-3.5"
                >
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] text-[#ece5d5] group-hover:text-[#f0a428]"
                      style={{ fontFamily: "var(--font-display)" }}
                    >
                      {c.title}
                    </div>
                    <div className="mt-0.5 font-mono text-[10px] text-[#6f695c]">
                      {c.mentionsThisWeek} this wk · {c.mentionsPrevWeek} last · {fmtDate(c.updatedAt)}
                    </div>
                  </div>
                  <Sparkline
                    data={c.spark}
                    width={92}
                    height={26}
                    stroke={(c.growthMultiplier ?? 1) > 1 ? "#e5484d" : "#86d99a"}
                    className="w-[92px] shrink-0 opacity-80"
                  />
                  <Trend growth={c.growthMultiplier} className="w-16 shrink-0 text-right" />
                  <Mark status={c.status} className="w-24 shrink-0 text-right" />
                </Link>
              ))}
            </div>
          </Section>
        </div>

        {/* the activity ledger */}
        <div className="lg:col-span-2">
          <Section strong className="lg:sticky lg:top-0">
            <div className="flex items-baseline justify-between">
              <Kicker>The ledger — live</Kicker>
              <Kicker className="text-[#86d99a]">realtime</Kicker>
            </div>
            <div className="mt-2 max-h-[560px] overflow-y-auto pr-1">
              {overview.activity.length === 0 && (
                <EmptyState glyph="◌" title="Agent idle" hint="Monitoring runs continuously." />
              )}
              {overview.activity.map((t: any) => (
                <div
                  key={t._id}
                  className="ledger-row animate-fade-up flex gap-3 border-b border-[#ece5d5]/8 py-3"
                >
                  <TypeGlyph type={t.type} running={t.status === "running"} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline justify-between gap-2">
                      <span
                        className={`text-[12.5px] leading-snug ${
                          t.status === "running" ? "text-[#f0a428]" : "text-[#cfc6b2]"
                        }`}
                      >
                        {t.label}
                      </span>
                      <span className="shrink-0 font-mono text-[9px] tabular-nums text-[#4d483e]">
                        {timeAgo(t.startedAt)}
                      </span>
                    </div>
                    {t.detail && (
                      <p className="mt-0.5 line-clamp-2 font-mono text-[10px] leading-relaxed text-[#6f695c]">
                        {t.detail}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
