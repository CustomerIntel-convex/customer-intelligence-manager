import { query, mutation } from "./_generated/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { now } from "./lib/util";
import { myCompanyDoc, currentUserId, DEMO_EMAIL } from "./lib/tenant";

// ─────────────────────────────────────────────────────────────────────────────
// Workspace lifecycle: sign-up creates a company, membership row, a starter
// watch configuration, and an opening research burst so the workspace isn't
// empty. The demo account is linked to the seeded demo workspace instead.
// ─────────────────────────────────────────────────────────────────────────────

const DEFAULT_RULES = [
  {
    label: "Product complaints",
    description: "Anything describing the product breaking, being slow, or frustrating.",
    keywords: ["broken", "bug", "issue", "crash", "slow", "error", "fails", "refund"],
  },
  {
    label: "Pricing complaints",
    description: "Complaints or confusion about price, plans, and value.",
    keywords: ["price", "pricing", "expensive", "cost", "plan", "billing", "refund"],
  },
  {
    label: "Feature requests",
    description: "Things customers wish the product did.",
    keywords: ["wish", "would love", "missing", "feature", "alternative", "instead"],
  },
  {
    label: "Reliability",
    description: "Outages, downtime, and availability.",
    keywords: ["outage", "down", "downtime", "status", "unavailable", "incident"],
  },
];

function sourcesFor(product: string) {
  return [
    { name: "Hacker News mentions", kind: "hn", config: { query: product } },
    { name: "Reddit discussions", kind: "reddit_search", config: { query: product } },
    {
      name: "General web mentions",
      kind: "web_search",
      config: { query: `${product} review OR complaint OR feedback` },
    },
  ];
}

/** Which workspace does the current session belong to? */
export const myWorkspace = query({
  args: {},
  handler: async (ctx) => {
    const company = await myCompanyDoc(ctx as any);
    if (!company) return { companyId: null, needsSetup: true, isDemo: false };
    return {
      companyId: company._id,
      needsSetup: false,
      isDemo: !!company.isDemo,
      name: company.name,
      product: company.product,
    };
  },
});

/** Sign-up: create the caller's company + membership + starter watch. */
export const createWorkspace = mutation({
  args: { product: v.string() },
  handler: async (ctx, args) => {
    const userId = await currentUserId(ctx as any);
    if (!userId) throw new Error("Sign in first");

    const existing = await ctx.db
      .query("members")
      .withIndex("by_userId", (q: any) => q.eq("userId", userId))
      .first();
    if (existing) return existing.companyId;

    const product = args.product.trim().slice(0, 60);
    if (product.length < 2) throw new Error("Product name too short");

    const authUser = await ctx.db.get(userId as any);
    const companyId = await ctx.db.insert("companies", {
      name: product,
      product,
      productKeywords: [product.toLowerCase()],
      isDemo: false,
      listening: true,
      realProduct: true,
      webResearchEnabled: true,
      createdAt: now(),
    });
    await ctx.db.insert("members", {
      userId,
      companyId,
      email: (authUser as any)?.email,
      createdAt: now(),
    });
    for (const r of DEFAULT_RULES) {
      await ctx.db.insert("watchRules", { company: companyId, enabled: true, ...r });
    }
    for (const s of sourcesFor(product)) {
      await ctx.db.insert("sources", { company: companyId, enabled: true, ...s });
    }

    // opening burst: listen to the web right away so the first screen lives
    await ctx.scheduler.runAfter(0, api.research.startResearch, {
      durationSec: 120,
      company: companyId,
    });
    return companyId;
  },
});

/**
 * One-time migration for deployments that predate multi-tenancy: tag the
 * seeded workspace as the demo, adopt its legacy chat/activity rows, and link
 * the demo login. Idempotent.
 */
export const backfillLegacy = mutation({
  args: {},
  handler: async (ctx) => {
    let demo = await ctx.db
      .query("companies")
      .filter((q: any) => q.eq(q.field("isDemo"), true))
      .first();
    if (!demo) {
      demo = await ctx.db.query("companies").first();
      if (demo) await ctx.db.patch(demo._id, { isDemo: true, listening: true });
    }
    if (!demo) return { ok: false, chatPatched: 0, tasksPatched: 0, linked: false };

    let chatPatched = 0;
    const chat = await ctx.db.query("chatMessages").collect();
    for (const m of chat) {
      if (m.company === undefined) {
        await ctx.db.patch(m._id, { company: demo._id });
        chatPatched++;
      }
    }

    let tasksPatched = 0;
    const tasks = await ctx.db.query("agentTasks").collect();
    for (const t of tasks) {
      if (t.company === undefined) {
        await ctx.db.patch(t._id, { company: demo._id });
        tasksPatched++;
      }
    }

    let linked = false;
    const demoUser = await ctx.db
      .query("users")
      .filter((q: any) => q.eq(q.field("email"), DEMO_EMAIL))
      .first();
    if (demoUser) {
      const member = await ctx.db
        .query("members")
        .withIndex("by_userId", (q: any) => q.eq("userId", demoUser._id))
        .first();
      if (!member) {
        await ctx.db.insert("members", {
          userId: demoUser._id,
          companyId: demo._id,
          email: DEMO_EMAIL,
          createdAt: now(),
        });
        linked = true;
      }
    }

    return { ok: true, chatPatched, tasksPatched, linked };
  },
});
