import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Web-source monitor cycle: every 30 minutes across every listening company.
// Burn is bounded three ways — per-company source cap and a shared credit
// floor inside the cycle (convex/agent.ts), plus the per-company toggle.
crons.interval(
  "monitor-cycle",
  { minutes: 30 },
  internal.agent.runMonitorCycle,
  {}
);

// Inbound mail backup: pure AgentMail REST (no Firecrawl cost), catches
// anything the webhook missed. The webhook remains the primary path.
crons.interval(
  "poll-inbound",
  { minutes: 2 },
  internal.monitor.pollInbound,
  {}
);

export default crons;
