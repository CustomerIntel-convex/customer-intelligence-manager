import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "../lib/convex";
import { Button, Kicker } from "../components/ui";

export const PENDING_PRODUCT_KEY = "pendingProduct";

/**
 * First-run screen for a brand-new account: name your product and the agent
 * immediately configures sources, watch rules, and an opening research burst.
 * Shown only when the signed-in user has no workspace yet.
 */
export default function Onboarding() {
  const ws = useQuery(api.tenant.myWorkspace, {});
  const create = useMutation(api.tenant.createWorkspace);
  const pending = localStorage.getItem(PENDING_PRODUCT_KEY);
  const [product, setProduct] = useState(pending ?? "");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const autoRan = useRef(false);

  const submit = async (name?: string) => {
    const p = (name ?? product).trim();
    if (p.length < 2 || busy) return;
    setBusy(true);
    setError(null);
    try {
      await create({ product: p });
      localStorage.removeItem(PENDING_PRODUCT_KEY);
      window.location.reload();
    } catch (e: any) {
      setError(e.message?.slice(0, 120) ?? "could not create workspace");
      setBusy(false);
    }
  };

  // signup on the landing page already told us the product — finish setup
  useEffect(() => {
    if (pending && !autoRan.current && ws?.needsSetup) {
      autoRan.current = true;
      void submit(pending);
    }
  }, [pending, ws?.needsSetup]);

  return (
    <div className="flex h-full items-center justify-center px-6">
      <div className="w-full max-w-lg">
        <Kicker className="text-[#f0a428]">Set up your workspace</Kicker>
        <h1
          className="mt-3 text-[34px] font-medium leading-[1.15] tracking-tight text-[#ece5d5]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          What should the agent listen to?
        </h1>
        <p className="mt-4 text-[13.5px] leading-relaxed text-[#a89f8c]">
          Name your product — the app, the hotel, the clinic, the store. The agent will
          configure its sources and watch rules, then start a live research burst so you
          can watch it work.
        </p>
        <div className="mt-7 border-y border-[#ece5d5]/15 py-5">
          <Kicker>Your product</Kicker>
          <input
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="e.g. Riverside Dental, Notion, Blue Bottle Coffee"
            disabled={busy}
            autoFocus
            className="mt-2 w-full border-b border-[#ece5d5]/25 bg-transparent pb-2 text-[18px] text-[#ece5d5] outline-none placeholder:text-[#4d483e] focus:border-[#f0a428]"
            style={{ fontFamily: "var(--font-display)" }}
          />
        </div>
        <div className="mt-6 flex items-center gap-4">
          <Button variant="primary" onClick={() => submit()} disabled={busy || product.trim().length < 2} className="px-6 py-2.5">
            {busy ? "Configuring the watch…" : "Start listening →"}
          </Button>
          <span className="font-mono text-[10px] leading-relaxed text-[#8a8271]">
            sources + watch rules are derived
            <br />
            from the product name
          </span>
        </div>
        {error && <p className="mt-3 font-mono text-[10px] text-[#e5484d]">{error}</p>}
      </div>
    </div>
  );
}
