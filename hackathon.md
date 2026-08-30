# Hackathon log

- **Project:** Customer Intelligence Manager
- **Event:** Convex All Gas Hackathon
- **What it does:** An autonomous AI employee that continuously listens to customer voice across a real business inbox and the public web, investigates emerging issues with verbatim evidence, remembers past incidents, and reports to the team.
- **Live app:** https://majestic-orca-275.convex.site
- **Repo:** https://github.com/CustomerIntel-convex/customer-intelligence-manager
- **Frontend:** Convex static hosting
- **Convex deployment:** https://majestic-orca-275.convex.cloud
- **Components:** @agentmail/convex, @convex-dev/static-hosting, @convex-dev/workpool
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, crons, scheduled functions, realtime queries
- **Auth:** none
- **AI models:** gpt-4.1, gpt-4o-mini
- **Started:** 2026-08-29T19:00:00Z
- **Last updated:** 2026-08-30T13:00:00Z

## Log

### 2026-08-29 - working tree
Scaffolded the Vite + React + TypeScript dashboard and the normalized Convex schema:
companies, sources, watchRules, signals, issues, evidence, investigations, reports,
agentTasks, chatMessages, emailRouting, with indexes on company, issue, score and time
(`convex/schema.ts`, `src/pages/`). Convex features: schema, tables, indexes.

### 2026-08-29 - working tree
Built the agent loop: a monitor cycle that sweeps configured sources with change detection,
classifies new items against watch rules with structured-output OpenAI calls, clusters
signals into issues (existing / historical-recurrence / new), and triggers investigations
that plan web searches, extract verbatim evidence, and compare against resolved incidents
(`convex/agent.ts`, `convex/lib/analysis.ts`, `convex/lib/firecrawl.ts`). Convex features:
actions, internal mutations, scheduled functions.

### 2026-08-29 - working tree
Wired the AgentMail component for the agent's real business inbox: signed webhook ingest,
routing of inbound mail (customer feedback becomes a signal; employee questions trigger an
investigation and an evidence-backed reply on the same thread), durable report sending, and
a polling fallback cron that feeds the same handler (`convex/email.ts`, `convex/monitor.ts`,
`convex/http.ts`, `convex/crons.ts`). Convex features: HTTP actions, crons, scheduled
functions, registered component.

### 2026-08-29 - working tree
Shipped the realtime ops dashboard: overview with signal-volume chart and live agent
activity feed, issues board with sparklines and priority/confidence chips, issue detail with
evidence timeline and investigation progress, mail view with per-scenario filter tabs, and a
chat that answers from live state and can trigger investigations or send reports
(`src/pages/Overview.tsx`, `src/pages/IssueDetail.tsx`, `src/pages/Mail.tsx`,
`src/pages/Chat.tsx`, `convex/queries.ts`, `convex/chat.ts`). Convex features: realtime
queries, mutations, actions.

### 2026-08-30 - working tree
Added the deterministic demo scenario runner (three product scenarios with switchable
company identity, sources and story data), a bounded live-research burst with start/stop
controls and live stats, and a Firecrawl budget toggle with graceful degradation
(`convex/demo.ts`, `convex/research.ts`, `convex/settings.ts`,
`src/pages/DemoPanel.tsx`). Convex features: mutations, scheduled functions, queries.

### 2026-08-30 - working tree
Migrated the frontend from a third-party host to the official Convex Static Hosting
component on the production deployment; the dashboard, webhook route and health route now
share the same `convex.site` origin (`convex/convex.config.ts`, `convex/http.ts`,
`package.json` deploy script). Convex features: HTTP actions, registered component.

### 2026-08-30 - working tree
End-to-end rehearsal on the production deployment: provisioning, seeded historical memory,
a real inbound customer email through the signed webhook (classified and clustered), the
ramp of public signals with an autonomous investigation, the internal report email, and two
employee follow-up questions answered with fresh web research (`convex/debug.ts`,
`convex/demo.ts`).

### 2026-08-30 - working tree
Made live research full-spectrum: the research burst now derives its rotating web-search
angles from the company's active watch rules (complaints, pricing, missing features,
competitors, churn, plus reliability), so it researches whatever the company cares about.
Added chat-driven autonomy: a natural-language chat message (e.g. asking for today's
complaints) makes the agent decide to kick off a live research burst itself, answering from
live state with evidence citations (`convex/research.ts`, `convex/chat.ts`,
`convex/lib/analysis.ts`). Convex features: actions, mutations, scheduled functions,
queries.
