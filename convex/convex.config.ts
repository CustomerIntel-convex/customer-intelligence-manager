import { defineApp } from "convex/server";
import agentmail from "@agentmail/convex/convex.config";
import staticHosting from "@convex-dev/static-hosting/convex.config";

const app = defineApp();
app.use(agentmail);
app.use(staticHosting);
export default app;
