# Hackathon log

- **Project:** Customer Intelligence Manager
- **Event:** Convex All Gas Hackathon
- **What it does:** An autonomous AI employee that continuously listens to customer voice across a real business inbox and the public web, investigates emerging issues with verbatim evidence, remembers past incidents, and reports to the team.
- **Live app:** https://majestic-orca-275.convex.site
- **Repo:** https://github.com/CustomerIntel-convex/customer-intelligence-manager
- **Frontend:** Convex static hosting
- **Convex deployment:** https://majestic-orca-275.convex.cloud
- **Components:** @agentmail/convex, @convex-dev/auth, @convex-dev/static-hosting, @convex-dev/workpool
- **Convex features:** schema, tables, indexes, queries, mutations, actions, HTTP actions, crons, scheduled functions, realtime queries, auth
- **Auth:** Convex Auth
- **AI models:** gpt-4.1, gpt-4o-mini
- **Started:** 2026-08-29T19:00:00Z
- **Last updated:** 2026-09-01T21:52:25Z

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

### 2026-08-30 - working tree
Redesigned the product surface: a landing page (serif display type, radar-sweep satellite
mark, the agent loop as a typographic strip) that flows into the authenticated workspace,
and a cohesive dashboard restyle — warm ink/paper palette with amber signal accents,
editorial headings, grain-field atmosphere (`src/pages/Landing.tsx`, `src/index.css`,
`src/components/ui.tsx`, all pages). Convex features: realtime queries, auth.

### 2026-08-30 - working tree
Added Convex Auth (password provider) with a one-click demo sign-in so judges get the full
authenticated workspace with zero friction; auth tables, JWT session tokens and the
sign-in routes run on the same deployment. Also added an everyday consumer-brand scenario
(Starbucks) as the lead demo — the agent watches real public complaints about a real brand
(`convex/auth.ts`, `convex/auth.config.ts`, `convex/lib/scenarios.ts`, `src/App.tsx`).
Convex features: auth, registered component, schema.

### 2026-08-30 - working tree
Bursts now open with an inbox scan — an OpenAI summary of recent customer mail logged to
the activity feed — and the chat agent can re-aim its entire watch on any product named in
conversation: identity, keywords and monitored sources are rebuilt and fresh full-spectrum
research starts on the new product. Verified live by pointing it at two products it had
never seen; real complaint threads clustered into issues both times. Also fixed burst
search pacing and rate-limit retry so free-tier caps stop silently emptying results
(`convex/research.ts`, `convex/chat.ts`, `convex/demo.ts`, `convex/lib/firecrawl.ts`,
`convex/lib/analysis.ts`). Convex features: actions, internal queries, mutations,
scheduled functions.

### 2026-08-31 - working tree
Redesigned the product surface as an editorial daily brief: newspaper masthead with a
live clock, numbered section rail, hairline-ruled ledger rows instead of cards,
typographic status marks, and Fraunces display numerals for the headline figures
(`src/index.css`, `src/components/ui.tsx`, `src/App.tsx`, all of `src/pages/`). Landing
page rebuilt as a front page with an SVG radar brand mark; dashboard, issue detail,
mail, chat and demo panels all moved onto the new primitives. Verified on the live
deployment after two rounds of screenshot critique (fixed a doubled baseline under the
signal-volume chart, flat-trend label rendering, and low-contrast microcopy).

### 2026-09-01 - working tree
Multi-tenant workspaces on Convex Auth: signing up creates an isolated company
(members table links auth subject → company), every dashboard query resolves the
caller's company, and issue detail enforces ownership. The demo login still lands
on the seeded workspace, untouched. Landing page gained a sign-up path; onboarding
configures sources + watch rules for any named product and opens with a live
research burst. Re-enabled the 30-minute monitor cron across listening companies
with a shared Firecrawl credit floor and per-company source cap
(`convex/lib/tenant.ts`, `convex/tenant.ts`, `convex/schema.ts`, `convex/agent.ts`,
`convex/queries.ts`). Verified live: a fresh account watching a real SaaS product
clustered its first web complaints into issues within a minute, with no data
crossing between workspaces. Convex features: auth, per-user data isolation,
compound indexes, scheduled functions, crons.

### 2026-09-01 - working tree
Credit-burn postmortem and fix. The re-enabled 30-minute monitor cycle drained the
shared Firecrawl pool (~959 credits in a day): every monitoring search scraped its
results to markdown (~1 credit per page), and the budget floor compared against a
cached balance that only refreshed on manual toggles, so it never tripped. Now each
cycle refreshes the real balance first (free endpoint), pauses paid fetches below a
150-credit floor, and monitoring/sweep searches run light — titles and snippets
only, ~1 credit per call — while investigations keep full markdown scraping for
evidence (`convex/lib/firecrawl.ts`, `convex/agent.ts`, `convex/research.ts`).
Convex features: actions, crons, internal actions.
