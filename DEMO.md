# Demo Runbook — 3-Minute Walkthrough

**Setup (before the demo starts):**
- Dashboard running: `npm run dev` → http://localhost:5173 (or the live convex.site URL)
- Provision done once: Demo panel → **Provision (setup)** (creates inboxes, company, sources)
- Reset to a clean state: Demo panel → **Reset demo data**

**Video style:** talk less, click more — let the product move; narrate one line per screen.

**First click of the video:** open the live URL → hit **"See it working live"** (one
click, Convex Auth) — that IS the opening shot: judges see a real login → real app.

> Everything below runs the **real** pipeline: real emails through AgentMail, real web research through Firecrawl, real analysis through OpenAI, realtime state in Convex. No mocks.

---

## The story (what you say)

> "If you run a hotel, a restaurant, a clinic — your customers are talking right now: reviews, forums, email. Nobody has time to connect all of it. So we hired an employee whose only job is to listen. Meet ours."

## Step 0 — The owner's morning brief (~25s)

Stay on **Overview**. This is The Marlow House, a 12-room boutique hotel:

> "This is the screen the owner reads with her morning coffee: complaints clustering, trends, what needs attention — assembled overnight, by itself."

For a longer cut, optionally open the **Chat** tab and type naturally:

> "Hey — let me know what guests are complaining about today."

> "No canned prompts — the agent reads its live state, and when it needs fresh intel it decides to go get it."

*(Record this as a separate pickup: the agent answers from what it knows, announces
it's kicking off live web research, and the Overview shows the live sweep.)*

> "Full spectrum: it researches whatever the business tells it to care about. Change the watch rules and its research changes."

## Step 1 — The agent's memory (~15s)

Click **Load the agent's memory**.

> "Last month the agent tracked a booking-confirmation failure — the booking engine and the front desk disagreed, resolved Aug 18. It also watches two stable topics: breakfast grumbles (declining) and parking. This history lives in Convex."

*(Overview shows: 0 critical · 0 emerging · 3 stable, and the memory entry in the activity feed.)*

## Step 2 — A guest email arrives (~20s)

Click **A customer email arrives**. Switch to **Overview** — the activity feed updates in realtime.

> "A real email just landed in the agent's inbox. Watch the feed: classified as a deposit-refund complaint, urgency scored, and an issue opened."

*(Dashboard shows, live: `📡 Detected customer signal` → `🧠 Opened new issue: Deposit Refund Delays`.)*

## Step 3 — The public discussion ramps (~50s)

Click **Public discussion ramps up**. Stay on Overview.

> "Meanwhile the travel forums are picking up. Twenty signals arrive over the next few seconds. The agent clusters each one into the issue and recomputes the trend."

*(Recent changes flips to the issue's trend. When the priority threshold crosses, the agent starts investigating on its own:)*

> "It didn't wait for anyone — the trend crossed its priority threshold, so it's investigating: generating search queries, searching the public web, extracting evidence."

**Optional Firecrawl showcase:** in the Demo panel, hit **▶ Start research** — a bounded 2-minute live research burst with a countdown and live stats. **■ Stop** whenever you've made the point.

## Step 4 — The issue matures (~30s, can overlap with step 3)

Open the issue from Recent changes.

> "Here's the conclusion. 18 mentions this week vs 3 last. Confidence 92%. And this is the part that makes it an employee, not a dashboard: it remembered the August booking-confirmation incident and noted this one hits a *different group* — card-paying guests after checkout. There's a recommended action."

*(Point at: trend, confidence meter, 🧠 Historical context card, evidence timeline, recommended action.)*

> "And it reported this to the owner by itself." *(Mail page: the report + its body.)*

## Step 5 — The owner replies (optional; omit from the submitted cut)

Click the owner's question — **"Is this only affecting guests who paid by card at checkout?"** — a real reply on the report thread.

> "Email is two-way. The owner replies on the thread — watch the feed. The agent runs a focused investigation on the question, then answers with evidence."

*(After ~1 min, Mail page shows the agent's reply, grounded in the evidence timeline.)*


## Step 6 — Competitor research (optional; omit from the submitted cut)

Click the owner's second question — **"Are other boutique hotels seeing the same deposit complaints?"**

> "Now it does fresh web research. Its answer: no direct reports about this property, but this matches a known industry-wide pattern — deposit holds and refund delays are among the most-complained-about hotel practices. Evidence, not vibes."

## Step 7 — Scale proof: watch any brand (~40s, optional)

In the Demo panel, switch **Watched product → Starbucks**, reload memory, and run the chat question again — the same agent now monitors a global brand on the live internet, with real complaints clustering into real issues.

> "A boutique hotel this morning, a global brand the next. Same employee."

## Step 8 — Chat with the agent (live, optional)

Chat page:

- "What are guests complaining about this week?" → quantitative answer from live state
- "Which one is most urgent?" → prioritized answer
- "Email me the findings." → sends a digest

## Closing

> "It doesn't summarize what customers said. It listens 24/7 — the inbox is monitored around the clock — it investigates what changed, remembers what the business already knows, and tells the team what needs attention. The morning brief for anyone with customers."

*(Point at the sidebar: Observes · Investigates · Remembers · Reports.)*

---

## Timing budget

| Submitted cut | Target |
|---|---|
| Landing + morning brief | 25s |
| Memory + customer email | 30s |
| Ramp → autonomous investigation | 55s |
| Issue evidence + historical context | 40s |
| Sent report + closing | 25s |
| **Target runtime** | **2m 55s maximum** |

Record the email follow-up and competitor-research steps separately if desired. The submitted cut should end after showing the sent report; do not wait for both reply investigations on camera.

## Recovery / notes

- Everything is idempotent: **Reset demo data** → re-run steps in order.
- Inbound email: AgentMail webhook (primary) + 2-minute poll fallback (cron) — both feed the same handler.
- If a button errors, check Convex dashboard logs (`npx convex dashboard`).
- **Firecrawl budget:** toggle web research on/off from the **Demo panel → Web research · Firecrawl** card (live Convex state, shows remaining credits). When paused, investigations complete from stored email/discussion evidence and note the pause in their findings; free HN monitoring keeps running. Top up credits, flip the toggle, and the competitor-research step (6) shines with live web evidence again.
- The monitor cycle can also be triggered manually ("Run monitor" via chat:runMonitorNow) — deterministic keyword pre-filtering keeps noise out.
