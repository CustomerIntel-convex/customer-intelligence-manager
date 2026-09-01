import { mutation, action, internalMutation } from "./_generated/server";
import { v } from "convex/values";
import { api, internal } from "./_generated/api";
import { demoCompanyDoc } from "./lib/tenant";
import { SCENARIOS, ScenarioKey, rampFor } from "./lib/scenarios";
import { DAY_MS, now } from "./lib/util";

// ─────────────────────────────────────────────────────────────────────────────
// Deterministic demo scenarios. Each runs the REAL pipeline (real emails,
// real clustering, real web research). Scenario packs (Acme / Firecrawl /
// AgentMail) live in lib/scenarios.ts.
// ─────────────────────────────────────────────────────────────────────────────

function pack(company: { scenario?: string }) {
  const key = (company.scenario as ScenarioKey) ?? "acme";
  return { key, pack: SCENARIOS[key] ?? SCENARIOS.acme };
}

/** Wipe story data. emailRouting is intentionally KEPT: it is the mail
 * history ledger (per-scenario segregation in the Mail tab) and doubles as
 * the dedupe ledger that prevents reprocessing of old mail. */
export const resetDemo = mutation({
  args: {},
  handler: async (ctx) => {
    // scoped to the DEMO workspace only — tenants keep their state
    const demo = await demoCompanyDoc(ctx as any);
    if (!demo) throw new Error("Run setup first");
    const cid = demo._id;

    const demoIssues = await ctx.db
      .query("issues")
      .withIndex("by_company", (q) => q.eq("company", cid))
      .collect();
    const demoIssueIds = new Set(demoIssues.map((i) => i._id));

    for (const doc of demoIssues) await ctx.db.delete(doc._id);

    let batch = await ctx.db
      .query("signals")
      .withIndex("by_company", (q) => q.eq("company", cid))
      .collect();
    for (const doc of batch) await ctx.db.delete(doc._id);

    for (const table of ["evidence", "investigations"] as const) {
      const rows = await ctx.db.query(table).collect();
      for (const doc of rows) {
        if (demoIssueIds.has(doc.issue as any)) await ctx.db.delete(doc._id);
      }
    }

    const reports = await ctx.db
      .query("reports")
      .withIndex("by_company", (q) => q.eq("company", cid))
      .collect();
    for (const doc of reports) await ctx.db.delete(doc._id);

    const tasks = await ctx.db
      .query("agentTasks")
      .withIndex("by_company", (q) => q.eq("company", cid))
      .collect();
    for (const doc of tasks) await ctx.db.delete(doc._id);
    // legacy rows (pre-multi-tenant) belong to the demo workspace
    const legacyTasks = (await ctx.db.query("agentTasks").collect()).filter(
      (t: any) => t.company === undefined
    );
    for (const doc of legacyTasks) await ctx.db.delete(doc._id);

    const chat = (await ctx.db.query("chatMessages").collect()).filter(
      (m: any) => m.company === undefined || m.company === cid
    );
    for (const doc of chat) await ctx.db.delete(doc._id);

    // mark any not-yet-routed remote mail as seen so nothing reprocesses
    await ctx.scheduler.runAfter(0, internal.monitor.adoptExistingMail, {});
    return "reset";
  },
});

/**
 * Retarget the whole product at a scenario (acme | firecrawl | agentmail):
 * rewrites company identity + sources and wipes story data.
 */
export const configureScenario = mutation({
  args: { scenario: v.string() },
  handler: async (ctx, args) => {
    const key = args.scenario as ScenarioKey;
    const pack = SCENARIOS[key];
    if (!pack) throw new Error(`Unknown scenario: ${args.scenario}`);
    const company = await demoCompanyDoc(ctx as any);
    if (!company) throw new Error("Run setup first");
    await ctx.runMutation(internal.state.configureScenarioInternal, {
      scenario: key,
      name: pack.company.name,
      product: pack.company.product,
      productKeywords: pack.company.productKeywords,
      realProduct: pack.company.realProduct,
      sources: pack.sources,
    });
    await ctx.runMutation(api.demo.resetDemo, {});
    return `configured: ${pack.company.name}`;
  },
});

/**
 * The agent's memory of past weeks: a resolved incident (which the emerging
 * issue will resemble, with a different segment) plus two stable baselines.
 */
export const seedHistory = mutation({
  args: {},
  handler: async (ctx) => {
    const company = await demoCompanyDoc(ctx as any);
    if (!company) throw new Error("Run setup first");
    const { pack: p } = pack(company);
    const hist = p.history;

    const histIssue = await ctx.db.insert("issues", {
      company: company._id,
      title: hist.resolvedIssue.title,
      description: hist.resolvedIssue.description,
      status: "resolved",
      severity: hist.resolvedIssue.severity,
      firstDetectedAt: now() - hist.resolvedIssue.firstDetectedDaysAgo * DAY_MS,
      lastDetectedAt: now() - hist.resolvedIssue.resolvedDaysAgo * DAY_MS,
      mentionCount: hist.signals.length,
      mentionsThisWeek: 0,
      mentionsPrevWeek: 0,
      confidence: 88,
      priorityScore: 0,
      affectedSegment: hist.resolvedIssue.affectedSegment,
      reasoningSummary: hist.resolvedIssue.reasoningSummary,
      recommendedAction: "Monitor after the fix; keep the mitigation on call rotation.",
      resolvedAt: now() - hist.resolvedIssue.resolvedDaysAgo * DAY_MS,
      resolutionNote: hist.resolvedIssue.resolutionNote,
      updatedAt: now() - hist.resolvedIssue.resolvedDaysAgo * DAY_MS,
    });

    for (const s of hist.signals) {
      const t = now() - s.daysBack * DAY_MS;
      const sigId = await ctx.db.insert("signals", {
        company: company._id,
        source: s.source,
        occurredAt: t,
        content: s.content,
        author: s.author,
        relevant: true,
        reason: "Historical record of the resolved incident.",
        topics: ["historical"],
        sentiment: "negative",
        urgency: 70,
        productArea: "core",
        affectedSegment: hist.resolvedIssue.affectedSegment,
        issue: histIssue,
        processedAt: t,
      });
      await ctx.db.insert("evidence", {
        issue: histIssue,
        source: s.source,
        excerpt: s.content.slice(0, 300),
        occurredAt: t,
        collectedAt: t,
        relevance: 80,
        kind: "historical",
        signalId: sigId,
      });
    }

    for (const b of hist.baselines) {
      const baseIssue = await ctx.db.insert("issues", {
        company: company._id,
        title: b.title,
        description: b.description,
        status: "watching",
        severity: b.severity,
        firstDetectedAt: now() - 24 * DAY_MS,
        lastDetectedAt: now() - 2 * DAY_MS,
        mentionCount: b.signals.length,
        mentionsThisWeek: b.thisWeek,
        mentionsPrevWeek: b.prevWeek,
        growthMultiplier: b.thisWeek === 0 ? undefined : Math.round((b.thisWeek / Math.max(b.prevWeek, 1)) * 10) / 10,
        confidence: 68,
        priorityScore: Math.round(18 + b.thisWeek * 3),
        affectedSegment: b.segment,
        recommendedAction: b.recommended,
        updatedAt: now() - 2 * DAY_MS,
      });
      for (const s of b.signals) {
        const t = now() - s.daysBack * DAY_MS;
        await ctx.db.insert("signals", {
          company: company._id,
          source: s.source,
          occurredAt: t,
          content: s.content,
          relevant: true,
          reason: "Baseline watch topic.",
          topics: ["baseline"],
          sentiment: "neutral",
          urgency: 32,
          affectedSegment: b.segment,
          issue: baseIssue,
          processedAt: t,
        });
      }
    }

    await ctx.db.insert("agentTasks", {
      company: company._id,
      type: "remember",
      status: "complete",
      label: `Historical context loaded: 1 resolved incident, ${hist.baselines.length} stable topics`,
      detail: `${hist.resolvedIssue.title} was resolved ${hist.resolvedIssue.resolvedDaysAgo} days ago — ${hist.resolvedIssue.resolutionNote.slice(0, 120)}`,
      startedAt: now(),
      completedAt: now(),
    });

    return "history seeded";
  },
});

/**
 * Step 1 of the live scenario: a real customer email arrives in the agent's
 * inbox (sent from the scenario customer's inbox — or from the presenter's
 * own email during the demo; the webhook treats both identically).
 */
export const sendCustomerComplaint = mutation({
  args: {},
  handler: async (ctx) => {
    const company = await demoCompanyDoc(ctx as any);
    if (!company?.agentInbox || !company.demoCustomerEmail)
      throw new Error("Run setup first");
    const { pack: p } = pack(company);
    await ctx.scheduler.runAfter(0, internal.email.sendEmail, {
      inboxId: company.demoCustomerEmail,
      to: company.agentInbox,
      subject: p.customerEmail.subject,
      text: p.customerEmail.text,
      labels: ["demo-customer"],
    });
    // webhook handles this in ~seconds; poll after 10s as a guaranteed fallback
    await ctx.scheduler.runAfter(10, internal.monitor.pollInbound, {});
    return "sent";
  },
});

/**
 * Step 2: the public discussion ramp. 20 scenario signals go through the REAL
 * clustering pipeline, staggered so the dashboard shows them arriving live.
 */
export const seedPublicSignals = mutation({
  args: {},
  handler: async (ctx) => {
    const company = await demoCompanyDoc(ctx as any);
    if (!company) throw new Error("Run setup first");
    const { key } = pack(company);
    const ramp = rampFor(key);

    let scheduled = 0;
    for (let i = 0; i < ramp.length; i++) {
      const [content, daysBack, hoursAgo, source, urgency, segment] = ramp[i];
      const signalId = await ctx.db.insert("signals", {
        company: company._id,
        source,
        occurredAt: now() - daysBack * DAY_MS - hoursAgo * 3600_000,
        content,
        relevant: true,
        reason: "Matched watch rule: product complaints.",
        topics: ["ramp"],
        sentiment: "negative",
        urgency,
        productArea: "core",
        affectedSegment: segment,
        processedAt: now(),
      });
      // stagger so the dashboard shows them arriving live
      await ctx.scheduler.runAfter(i * 0.8, internal.agent.processSignal, { signalId });
      scheduled++;
    }
    return { scheduled };
  },
});

/**
 * Re-aim the whole watch at an arbitrary product (judge tests, chat requests):
 * company identity, keywords and monitored sources are derived from the
 * product name; story data is expected to be reset by the caller.
 */
export const reconfigureProductInternal = internalMutation({
  args: { product: v.string(), company: v.optional(v.id("companies")) },
  handler: async (ctx, args) => {
    const product = args.product.trim().slice(0, 60);
    if (product.length < 2) throw new Error("Product name too short");
    const company = args.company
      ? await ctx.db.get(args.company)
      : await demoCompanyDoc(ctx as any);
    if (!company) throw new Error("Run setup first");
    await ctx.runMutation(internal.state.configureScenarioInternal, {
      scenario: "custom",
      name: product,
      product,
      productKeywords: [product.toLowerCase()],
      realProduct: true,
      company: company._id,
      sources: [
        { name: "Hacker News mentions", kind: "hn", config: { query: product } },
        { name: "Reddit discussions", kind: "reddit_search", config: { query: product } },
        {
          name: "General web mentions",
          kind: "web_search",
          config: { query: `${product} review OR complaint OR feedback` },
        },
      ],
    });
    return `watching: ${product}`;
  },
});

/**
 * Employee follow-up: Maria replies (on the real report thread in her inbox)
 * with a question for the agent.
 */
export const employeeAsk = mutation({
  args: { question: v.string() },
  handler: async (ctx, args) => {
    const company = await demoCompanyDoc(ctx as any);
    if (!company?.agentInbox || !company?.employeeEmail)
      throw new Error("Run setup first");

    // Maria replies on the agent's latest thread in her inbox (real reply)
    await ctx.scheduler.runAfter(0, internal.email.replyToAgentFrom, {
      inboxId: company.employeeEmail,
      agentInbox: company.agentInbox,
      text: args.question,
    });
    // webhook handles this in ~seconds; poll after 10s as a guaranteed fallback
    await ctx.scheduler.runAfter(10, internal.monitor.pollInbound, {});
    return "sent";
  },
});

/** Convenience: full setup action (idempotent). */
export const setup = action({
  args: {},
  handler: async (ctx): Promise<any> => {
    return await ctx.runAction(api.setup.ensureSetup, {});
  },
});
