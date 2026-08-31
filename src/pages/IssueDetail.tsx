import { useMemo } from "react";
import { useQuery, useMutation, api } from "../lib/convex";
import {
  Kicker,
  Mark,
  Numeral,
  Section,
  Trend,
  Button,
  Favicon,
  fmtDate,
  fmtDateTime,
  timeAgo,
  statusText,
} from "../components/ui";
import { Link, useParams } from "react-router-dom";

const KIND_LABEL: Record<string, string> = {
  signal: "public discussion",
  email: "customer email",
  web: "web evidence",
  historical: "historical",
};
const KIND_TONE: Record<string, string> = {
  signal: "text-[#8fb7d9]",
  email: "text-[#86d99a]",
  web: "text-[#f0a428]",
  historical: "text-[#c3b6e0]",
};

export default function IssueDetail() {
  const { issueId } = useParams();
  const detail = useQuery(api.queries.getIssueDetail, { issueId: issueId as any });
  const investigate = useMutation(api.chat.runInvestigationNow);

  const daily = useMemo(() => {
    if (!detail) return null;
    const arr = new Array(14).fill(0);
    const sod = new Date();
    sod.setHours(0, 0, 0, 0);
    const today = sod.getTime();
    for (const s of detail.signals) {
      const idx = 13 - Math.round((today - new Date(s.occurredAt).setHours(0, 0, 0, 0)) / 86400000);
      if (idx >= 0 && idx < 14) arr[idx]++;
    }
    return arr;
  }, [detail]);

  if (detail === undefined) return <div className="skeleton h-96 w-full" />;
  if (detail === null)
    return (
      <Kicker>
        issue not found ·{" "}
        <Link to="/issues" className="text-[#f0a428]">
          back to issues
        </Link>
      </Kicker>
    );

  const { issue, evidence, signals, investigations, reports } = detail;
  const running = investigations.find((i: any) => i.status === "running" || i.status === "pending");
  const dayLabels = Array.from({ length: 14 }, (_, i) => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    d.setDate(d.getDate() - (13 - i));
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  });

  return (
    <div className="space-y-8">
      {/* headline */}
      <div className="flex items-start justify-between gap-6">
        <div className="min-w-0">
          <Kicker>
            <Link to="/issues" className="hover:text-[#ece5d5]">
              ← issues
            </Link>
          </Kicker>
          <div className="mt-2 flex flex-wrap items-baseline gap-x-4">
            <h2
              className={`text-[26px] font-medium tracking-tight ${statusText(issue.status)}`}
              style={{ fontFamily: "var(--font-display)" }}
            >
              {issue.title}
            </h2>
            <Mark status={issue.status} />
            <Kicker>{issue.severity}</Kicker>
          </div>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[#a89f8c]">
            {issue.description}
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => investigate({ issueId: issue._id })}
          disabled={!!running}
          className="shrink-0"
        >
          {running ? "⌕ investigating…" : "⌕ run investigation"}
        </Button>
      </div>

      {/* figures */}
      <Section strong className="grid grid-cols-2 gap-y-6 md:grid-cols-4">
        <div>
          <Kicker>Mentions</Kicker>
          <div className="mt-1 flex items-baseline gap-2">
            <Numeral className="text-[36px]">{issue.mentionsThisWeek}</Numeral>
            <span className="font-mono text-[11px] text-[#6f695c]">/ {issue.mentionsPrevWeek} wk</span>
          </div>
          <Trend growth={issue.growthMultiplier} className="mt-1 block" />
        </div>
        <div>
          <Kicker>Confidence</Kicker>
          <div className="mt-1 flex items-baseline gap-2">
            <Numeral className="text-[36px]" tone={issue.confidence >= 70 ? "live" : "dim"}>
              {issue.confidence}
            </Numeral>
            <span className="font-mono text-[11px] text-[#6f695c]">% · {evidence.length} items</span>
          </div>
        </div>
        <div>
          <Kicker>Priority</Kicker>
          <div className="mt-1 flex items-baseline gap-2">
            <Numeral className="text-[36px]" tone={issue.priorityScore >= 60 ? "signal" : "dim"}>
              {Math.round(issue.priorityScore)}
            </Numeral>
            <span className="font-mono text-[11px] text-[#6f695c]">/ 100</span>
          </div>
        </div>
        <div>
          <Kicker>Affected</Kicker>
          <div className="mt-1.5 text-[13px] text-[#ece5d5]">{issue.affectedSegment ?? "unknown"}</div>
          <div className="mt-0.5 font-mono text-[9.5px] text-[#6f695c]">
            first {fmtDate(issue.firstDetectedAt)}
            {issue.resolvedAt ? ` · resolved ${fmtDate(issue.resolvedAt)}` : ""}
          </div>
        </div>
      </Section>

      {/* memory / reasoning / recommendation */}
      {(issue.historicalNote || issue.reasoningSummary || issue.recommendedAction) && (
        <div className="grid gap-6 md:grid-cols-3">
          {issue.historicalNote && (
            <Section className="border-t border-[#c3b6e0]/30">
              <Kicker className="text-[#c3b6e0]">❖ Historical context</Kicker>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#cfc6b2]">{issue.historicalNote}</p>
            </Section>
          )}
          {issue.reasoningSummary && (
            <Section>
              <Kicker>Agent reasoning</Kicker>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#a89f8c]">{issue.reasoningSummary}</p>
            </Section>
          )}
          {issue.recommendedAction && (
            <Section className="border-t border-[#86d99a]/30">
              <Kicker className="text-[#86d99a]">➜ Recommended</Kicker>
              <p className="mt-2 text-[12.5px] leading-relaxed text-[#cfc6b2]">{issue.recommendedAction}</p>
            </Section>
          )}
        </div>
      )}

      <div className="grid gap-10 lg:grid-cols-5">
        {/* evidence ledger */}
        <div className="space-y-8 lg:col-span-3">
          <Section strong>
            <div className="flex items-baseline justify-between">
              <Kicker>Evidence — {evidence.length} items</Kicker>
              <Kicker>
                {evidence.filter((e: any) => e.kind === "web").length} from the live web
              </Kicker>
            </div>
            <div className="mt-2">
              {evidence.length === 0 && (
                <Kicker className="py-6">no evidence collected yet</Kicker>
              )}
              {evidence.map((e: any) => (
                <div key={e._id} className="ledger-row animate-fade-up border-b border-[#ece5d5]/8 py-3.5">
                  <div className="flex flex-wrap items-baseline gap-x-2">
                    <span className={`font-mono text-[9.5px] uppercase tracking-[0.14em] ${KIND_TONE[e.kind] ?? "text-[#8a8271]"}`}>
                      {KIND_LABEL[e.kind] ?? e.kind}
                    </span>
                    <span className="font-mono text-[9.5px] text-[#4d483e]">{e.source}</span>
                    <span className="font-mono text-[9.5px] text-[#6f695c]">{fmtDate(e.occurredAt)}</span>
                    <span className="ml-auto font-mono text-[9.5px] text-[#6f695c]">rel {e.relevance}</span>
                  </div>
                  <blockquote className="mt-1.5 border-l border-[#ece5d5]/20 pl-3 text-[12.5px] leading-relaxed text-[#cfc6b2]">
                    {e.excerpt}
                  </blockquote>
                  {e.url && (
                    <a
                      href={e.url}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 inline-flex max-w-full items-center gap-1.5 truncate font-mono text-[10px] text-[#f0a428]/80 hover:text-[#f0a428]"
                    >
                      <Favicon url={e.url} />
                      <span className="truncate">{e.url}</span>
                    </a>
                  )}
                </div>
              ))}
            </div>
          </Section>

          <Section strong>
            <Kicker>Raw signals — {signals.length}</Kicker>
            <div className="mt-2 max-h-72 overflow-y-auto">
              {[...signals]
                .sort((a: any, b: any) => b.occurredAt - a.occurredAt)
                .map((s: any) => (
                  <div key={s._id} className="ledger-row border-b border-[#ece5d5]/8 py-2.5">
                    <div className="flex items-center justify-between font-mono text-[9.5px] text-[#6f695c]">
                      <span>
                        {s.source === "email" ? "✉" : "◍"} {s.source}
                        {s.author ? ` · ${s.author}` : ""}
                      </span>
                      <span>{fmtDate(s.occurredAt)}</span>
                    </div>
                    <p className="mt-1 line-clamp-2 text-[11.5px] leading-relaxed text-[#8a8271]">
                      {s.content}
                    </p>
                  </div>
                ))}
            </div>
          </Section>
        </div>

        {/* right column */}
        <div className="space-y-8 lg:col-span-2">
          <Section strong>
            <Kicker>Mentions / day — 14 days</Kicker>
            <div className="mt-3 flex items-end gap-[3px]" style={{ height: 52 }}>
              {(daily ?? []).map((v: number, i: number) => {
                const max = Math.max(...(daily ?? [1]), 1);
                return (
                  <div
                    key={i}
                    className="flex-1"
                    style={{
                      height: `${Math.max((v / max) * 100, v > 0 ? 8 : 3)}%`,
                      background: v > 0 ? "rgba(134,217,154,0.5)" : "rgba(236,229,213,0.08)",
                    }}
                    title={`${dayLabels[i]}: ${v}`}
                  />
                );
              })}
            </div>
          </Section>

          <Section strong>
            <Kicker>Investigations — {investigations.length}</Kicker>
            <div className="mt-2">
              {investigations.length === 0 && (
                <Kicker className="py-4">none yet — trigger one above</Kicker>
              )}
              {investigations.map((inv: any) => (
                <div
                  key={inv._id}
                  className={`animate-fade-up border-b border-[#ece5d5]/8 py-3.5 ${
                    inv.status === "running" ? "running-sweep" : ""
                  }`}
                >
                  <div className="flex items-baseline justify-between gap-2">
                    <Mark status={inv.status === "pending" ? "running" : inv.status} />
                    <span className="font-mono text-[9px] text-[#4d483e]">
                      {fmtDateTime(inv.startedAt)} · {inv.triggeredBy}
                    </span>
                  </div>
                  {inv.question && (
                    <p className="mt-1.5 text-[12px] italic text-[#cfc6b2]">“{inv.question}”</p>
                  )}
                  {inv.plan.length > 0 && (
                    <div className="mt-2 space-y-0.5">
                      {inv.plan.map((step: string, idx: number) => {
                        const done = inv.status === "complete" || idx < inv.stepIndex;
                        const current = idx === inv.stepIndex && inv.status === "running";
                        return (
                          <div key={idx} className="flex items-center gap-2 font-mono text-[10px]">
                            <span className={done ? "text-[#86d99a]" : current ? "text-[#f0a428] animate-pulse-dot" : "text-[#4d483e]"}>
                              {done ? "●" : "○"}
                            </span>
                            <span className={done ? "text-[#8a8271]" : current ? "text-[#f0a428]" : "text-[#4d483e]"}>
                              {step}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                  {inv.findings && (
                    <p className="mt-2 whitespace-pre-line border-l border-[#ece5d5]/15 pl-3 font-mono text-[10px] leading-relaxed text-[#8a8271]">
                      {inv.findings}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </Section>

          {reports.length > 0 && (
            <Section strong>
              <Kicker>Reports emailed</Kicker>
              <div className="mt-2">
                {reports.map((r: any) => (
                  <div key={r._id} className="animate-fade-up border-b border-[#ece5d5]/8 py-3.5">
                    <div className="flex items-baseline justify-between gap-2">
                      <span className="text-[12.5px] leading-snug text-[#cfc6b2]">{r.subject}</span>
                      <span className="shrink-0 font-mono text-[9px] text-[#4d483e]">{timeAgo(r.sentAt)} ago</span>
                    </div>
                    <div className="mt-0.5 font-mono text-[9.5px] text-[#6f695c]">
                      → {r.sentTo} · {r.kind}
                    </div>
                    <details className="mt-1.5">
                      <summary className="cursor-pointer font-mono text-[10px] text-[#6f695c] hover:text-[#ece5d5]">
                        show report
                      </summary>
                      <pre className="mt-1.5 max-h-72 overflow-y-auto whitespace-pre-wrap border-l border-[#ece5d5]/15 pl-3 font-mono text-[10px] leading-relaxed text-[#8a8271]">
                        {r.bodyText}
                      </pre>
                    </details>
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>
    </div>
  );
}
