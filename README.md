# 🛰️ Customer Intelligence Manager

**The morning brief for anyone with customers.** An autonomous AI employee — built for the [Convex All Gas hackathon](https://vibeapps.dev/judging/convex-all-gas-hackathon-openai/submit) — that reads your inbox and the public web every day, investigates what changed, remembers what your business already knows, and tells you what to fix. Run a hotel, a clinic, a restaurant, a SaaS: if you have customers talking, it listens.

> It doesn't just summarize what customers said. It listens 24/7, investigates what changed, remembers what the company already knows, and tells the team what needs attention.

## How it works

```
OBSERVE    monitored sources on demand (HN via direct free fetch; web/Reddit via
           Firecrawl when enabled) + inbound email via webhook/poll
DETECT     deterministic keyword pre-filter, then OpenAI classifies every new
           item against the company's watch rules
INVESTIGATE  when the priority threshold crosses, the agent plans targeted
           web searches (Firecrawl) and extracts verbatim evidence
REMEMBER   every signal, issue, evidence item and investigation lives in Convex —
           including resolved incidents the agent compares new issues against
PRIORITIZE deterministic scoring: frequency × growth × urgency × impact × novelty,
            scaled by evidence confidence
REPORT     internal alerts email themselves to the team via AgentMail
FOLLOW UP  employees reply on the email thread; the agent investigates the
           question and answers with evidence
```

## The stack

| Tech | Role |
|---|---|
| **Convex** | All persistent state (signals, issues, evidence, investigations, reports), scheduled autonomy, realtime reactive dashboard, http endpoints |
| **Firecrawl** | Targeted investigation searches (evidence extraction with verbatim excerpts); kill-switchable via env when budget is exhausted |
| **OpenAI** | Classification, clustering, historical comparison, prioritization inputs, investigation planning, evidence extraction, report & reply writing (JSON-schema structured outputs) |
| **AgentMail** | The agent's real business inbox (`customer.intelligence@agentmail.to`): inbound customer email → signals; employee replies → focused investigations + evidence-backed answers; outbound internal reports |

## The demo (The Marlow House)

A fictional 12-room boutique hotel with a pre-loaded memory: resolved booking-confirmation failures plus stable breakfast and parking topics. During the demo:

1. A **real customer email** arrives → classified → issue opened
2. 20 public-discussion signals ramp in → clustered → trend ↑6×
3. The priority threshold crosses → the agent **investigates on its own** with real web research about hotel deposit holds and refund delays
4. It recognizes the relationship to the August booking incident — *a different guest segment this time*
5. It emails an internal report to the hotel owner
6. The owner replies with focused questions → fresh investigations → evidence-backed answers on the thread

See **[DEMO.md](./DEMO.md)** for the full 3-minute walkthrough with speaker notes.

## Running it

```bash
npm install
npx convex dev          # push functions + run the dev deployment
npm run dev             # dashboard at http://localhost:5173
```

Env vars (in Convex): `OPENAI_API_KEY`, `FIRECRAWL_API_KEY`, `AGENTMAIL_API_KEY`, `AGENTMAIL_WEBHOOK_SECRET` (Svix secret from the registered webhook). Web research (Firecrawl) is toggled live from the dashboard — Demo panel → *Web research* — with the credit balance shown; the `FIRECRAWL_ENABLED` env var acts only as the fallback default.

First-time setup: open the dashboard → **Demo** → *Provision*. That creates the three real AgentMail inboxes (agent, employee, customer), the company, watch rules, and monitored sources.

**Cost control:** the 30-minute monitor cron refreshes the shared Firecrawl balance before paid searches, pauses them below the configured credit floor, and caps each company to three sources per cycle. Investigations use at most two searches. The **Live research burst** button runs a bounded, operator-controllable two-minute sweep; a deterministic keyword pre-filter keeps fuzzy search noise away from the LLM.

**Deployed:** dashboard at **https://majestic-orca-275.convex.site** (official Convex static hosting — dashboard, AgentMail webhook and health route on one origin). A legacy Vercel deployment is kept as a secondary.

## Architecture

```
convex/
  schema.ts           normalized model: companies, sources, watchRules, signals,
                      issues, evidence, investigations, reports, agentTasks, chat, emailRouting
  agent.ts            the loop: monitor cycle, signal clustering, investigation, reporting
  email.ts            AgentMail integration: webhook ingest → routing (customer vs employee)
  monitor.ts          polling fallback for inbound mail (cron backup for the webhook)
  state.ts            all state mutations + deterministic priority scoring
  lib/analysis.ts     every LLM interaction (strict JSON schemas)
  lib/firecrawl.ts    search/scrape + content hashing
  demo.ts             deterministic scenario steps (each runs the real pipeline)
  crons.ts            30-min monitor cycle + 2-min inbound-mail poll
src/
  pages/              Overview, Issues, IssueDetail, Mail, Chat, DemoPanel
```

**Design principles:** evidence over hallucination (every conclusion traces to stored evidence), deterministic orchestration (the LLM never decides control flow), semantic state (issues and relationships, not chat logs), and visible autonomy (the activity feed shows the agent working in realtime).
