import { useQuery, api } from "../lib/convex";
import {
  Kicker,
  Mark,
  Numeral,
  Trend,
  SkeletonBlock,
  EmptyState,
  fmtDate,
  statusText,
} from "../components/ui";
import { Sparkline } from "../components/charts";
import { Link } from "react-router-dom";

const SEVERITY_MARK: Record<string, string> = {
  critical: "bg-[#e5484d]",
  high: "bg-[#f0a428]",
  medium: "bg-[#c3b6e0]",
  low: "bg-[#8fb7d9]",
};

export default function Issues() {
  const rows = useQuery(api.queries.listIssuesDetailed, {});

  if (rows === undefined)
    return (
      <div className="space-y-4">
        {[...Array(5)].map((_, i) => (
          <SkeletonBlock key={i} className="h-16" />
        ))}
      </div>
    );

  const active = rows.filter((r: any) => r.issue.status !== "resolved");
  const resolved = rows.filter((r: any) => r.issue.status === "resolved");

  const Row = ({ row }: { row: any }) => {
    const i = row.issue;
    return (
      <Link
        to={`/issues/${i._id}`}
        className="ledger-row group flex items-center gap-6 border-b border-[#ece5d5]/8 py-4"
      >
        <span className={`h-8 w-[3px] shrink-0 ${SEVERITY_MARK[i.severity] ?? "bg-[#6f695c]"}`} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-baseline gap-x-3">
            <span
              className={`text-[16px] tracking-tight ${statusText(i.status)}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {i.title}
            </span>
            <Mark status={i.status} />
          </div>
          <p className="mt-1 line-clamp-1 max-w-2xl text-[12px] leading-relaxed text-[#8a8271]">
            {i.description}
          </p>
          <div className="mt-1.5 flex flex-wrap items-center gap-x-4 font-mono text-[10px] text-[#6f695c]">
            <span>
              <span className="text-[#cfc6b2]">{i.mentionsThisWeek}</span>/wk · {i.mentionsPrevWeek} prev
            </span>
            {i.affectedSegment && <span>{i.affectedSegment}</span>}
            <span>first {fmtDate(i.firstDetectedAt)}</span>
          </div>
          {i.historicalNote && (
            <p className="mt-1.5 font-mono text-[10px] text-[#c3b6e0]/80">❖ {i.historicalNote}</p>
          )}
        </div>
        <Sparkline
          data={row.spark}
          width={110}
          height={30}
          stroke={(i.growthMultiplier ?? 1) > 1 ? "#e5484d" : "#86d99a"}
          className="hidden w-[110px] shrink-0 opacity-80 sm:block"
        />
        <div className="hidden w-16 shrink-0 text-right md:block">
          <Trend growth={i.growthMultiplier} />
        </div>
        <div className="w-14 shrink-0 text-right">
          <Numeral className="text-[22px]" tone={i.priorityScore >= 60 ? "signal" : "dim"}>
            {Math.round(i.priorityScore)}
          </Numeral>
          <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#4d483e]">prio</div>
        </div>
        <div className="w-14 shrink-0 text-right">
          <Numeral className="text-[22px]" tone={i.confidence >= 70 ? "live" : "dim"}>
            {i.confidence}
          </Numeral>
          <div className="font-mono text-[8px] uppercase tracking-[0.18em] text-[#4d483e]">conf</div>
        </div>
      </Link>
    );
  };

  return (
    <div className="space-y-10">
      {rows.length === 0 && (
        <EmptyState
          glyph="◎"
          title="No issues yet"
          hint="When customer signals cluster, the agent opens a normalized issue with evidence and a priority score."
        />
      )}

      {active.length > 0 && (
        <section>
          <div className="flex items-baseline justify-between border-b border-[#ece5d5]/25 pb-2">
            <Kicker>Active — {active.length}</Kicker>
            <Kicker>priority · confidence</Kicker>
          </div>
          {active.map((row: any) => (
            <Row key={row.issue._id} row={row} />
          ))}
        </section>
      )}

      {resolved.length > 0 && (
        <section className="opacity-55 transition-opacity hover:opacity-100">
          <div className="flex items-baseline justify-between border-b border-[#ece5d5]/15 pb-2">
            <Kicker>Resolved — {resolved.length} · the agent's memory</Kicker>
          </div>
          {resolved.map((row: any) => (
            <Row key={row.issue._id} row={row} />
          ))}
        </section>
      )}
    </div>
  );
}
