import { httpRouter } from "convex/server";
import { httpAction } from "./_generated/server";
import { agentmail } from "./email";
import { auth } from "./auth";
import { registerStaticRoutes } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

const http = httpRouter();

// Convex Auth routes (sign in / sign up / token refresh).
auth.addHttpRoutes(http);

// AgentMail webhook ingest — Svix-verified and deduped by the component.
http.route({
  path: "/agentmail/webhook",
  method: "POST",
  handler: httpAction(async (ctx, req) => agentmail.handleWebhook(ctx as any, req)),
});

http.route({
  path: "/health",
  method: "GET",
  handler: httpAction(async () => new Response("ok", { status: 200 })),
});

// SPA static hosting — serves the built dashboard; specific routes above win.
registerStaticRoutes(http, components.staticHosting);

export default http;
