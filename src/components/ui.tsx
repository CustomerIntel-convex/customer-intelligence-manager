import { clsx } from "../lib/clsx";

// ─────────────────────────────────────────────────────────────────────────────
// "The Daily Brief" design language: hairlines instead of boxes, small-caps
// mono kickers, display numerals, typographic status markers.
// ─────────────────────────────────────────────────────────────────────────────

/** Ruled section — hairline top, generous air, no box. */
export function Section({
  children,
  className = "",
  strong = false,
}: {
  children: React.ReactNode;
  className?: string;
  strong?: boolean;
}) {
  return (
    <section className={clsx(strong ? "ruled-strong" : "ruled", "pt-4", className)}>
      {children}
    </section>
  );
}

/** Small-caps mono label. */
export function Kicker({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={clsx("kicker", className)}>{children}</div>;
}

/** Display numeral with optional unit. */
export function Numeral({
  children,
  unit,
  className = "",
  tone = "paper",
}: {
  children: React.ReactNode;
  unit?: string;
  className?: string;
  tone?: "paper" | "signal" | "live" | "down" | "dim";
}) {
  const tones: Record<string, string> = {
    paper: "text-[#ece5d5]",
    signal: "text-[#f0a428]",
    live: "text-[#86d99a]",
    down: "text-[#e5484d]",
    dim: "text-[#a89f8c]",
  };
  return (
    <span className={clsx("numeral", tones[tone], className)}>
      {children}
      {unit && <span className="ml-1 font-mono text-[11px] tracking-normal text-[#a89f8c]">{unit}</span>}
    </span>
  );
}

// ── status markers ──────────────────────────────────────────────────────────

const MARK_TONES: Record<string, string> = {
  critical: "text-[#e5484d]",
  confirmed: "text-[#f0a428]",
  emerging: "text-[#f0a428]",
  watching: "text-[#8fb7d9]",
  resolved: "text-[#86d99a]",
  running: "text-[#f0a428]",
  pending: "text-[#a89f8c]",
  complete: "text-[#86d99a]",
  failed: "text-[#e5484d]",
};

/** Typographic status marker: ▪ LABEL */
export function Mark({ status, className = "" }: { status: string; className?: string }) {
  return (
    <span className={clsx("mark", MARK_TONES[status] ?? "text-[#a89f8c]", className)}>
      {status}
    </span>
  );
}

/** Status color for large titles. */
export function statusText(status: string): string {
  return MARK_TONES[status] ?? "text-[#a89f8c]";
}

/** Activity type glyph (mono, no emoji). */
const TYPE_GLYPH: Record<string, { g: string; tone: string }> = {
  observe: { g: "◍", tone: "text-[#8fb7d9]" },
  detect: { g: "◎", tone: "text-[#f0a428]" },
  investigate: { g: "⌕", tone: "text-[#f0a428]" },
  remember: { g: "❖", tone: "text-[#c3b6e0]" },
  report: { g: "✉", tone: "text-[#86d99a]" },
  reply: { g: "↩", tone: "text-[#86d99a]" },
  chat: { g: "❝", tone: "text-[#86d99a]" },
};

export function TypeGlyph({ type, running }: { type: string; running?: boolean }) {
  const cfg = TYPE_GLYPH[type] ?? { g: "·", tone: "text-[#a89f8c]" };
  return (
    <span className={clsx("w-5 shrink-0 font-mono text-[13px]", cfg.tone, running && "animate-pulse-dot")}>
      {cfg.g}
    </span>
  );
}

// ── trend / confidence ─────────────────────────────────────────────────────

export function Trend({ growth, className = "" }: { growth?: number | null; className?: string }) {
  if (growth == null)
    return <span className={clsx("font-mono text-[11px] text-[#6f695c]", className)}>—</span>;
  const up = growth > 1;
  const flat = Math.abs(growth - 1) < 0.05;
  return (
    <span
      className={clsx(
        "font-mono text-[11px] font-semibold tabular-nums",
        flat ? "text-[#6f695c]" : up ? "text-[#e5484d]" : "text-[#86d99a]",
        className
      )}
    >
      {flat ? "→ 0%" : up ? `▲ ${growth.toFixed(1)}×` : `▼ −${Math.round((1 - growth) * 100)}%`}
    </span>
  );
}

export function LiveDot({ className = "" }: { className?: string }) {
  return (
    <span className={clsx("relative inline-flex h-1.5 w-1.5", className)}>
      <span className="absolute h-full w-full animate-ping rounded-full bg-[#86d99a] opacity-50" />
      <span className="relative h-1.5 w-1.5 rounded-full bg-[#86d99a]" />
    </span>
  );
}

export function Favicon({ url, className = "" }: { url?: string; className?: string }) {
  if (!url) return null;
  try {
    const host = new URL(url).hostname;
    return (
      <img
        src={`https://www.google.com/s2/favicons?domain=${host}&sz=32`}
        alt=""
        className={clsx("h-3 w-3 rounded-[2px] opacity-70", className)}
        onError={(e) => ((e.target as HTMLImageElement).style.display = "none")}
      />
    );
  } catch {
    return null;
  }
}

export function EmptyState({
  title,
  hint,
  glyph = "◌",
}: {
  title: string;
  hint?: string;
  glyph?: string;
}) {
  return (
    <div className="flex flex-col items-center justify-center px-6 py-14 text-center">
      <span className="font-mono text-2xl text-[#4d483e]">{glyph}</span>
      <p className="mt-3 font-mono text-[11px] uppercase tracking-[0.18em] text-[#a89f8c]">{title}</p>
      {hint && <p className="mt-2 max-w-xs text-xs leading-relaxed text-[#6f695c]">{hint}</p>}
    </div>
  );
}

export function SkeletonBlock({ className = "" }: { className?: string }) {
  return <div className={clsx("skeleton h-4 w-full", className)} />;
}

/** Squared button — hairline border, ink fill for primary. */
export function Button({
  children,
  onClick,
  variant = "default",
  disabled,
  className = "",
  type,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost";
  disabled?: boolean;
  className?: string;
  type?: "button" | "submit";
}) {
  return (
    <button
      type={type ?? "button"}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        "inline-flex items-center justify-center gap-2 px-4 py-2 font-mono text-[11px] uppercase tracking-[0.16em] transition-all duration-150 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-35",
        variant === "primary" &&
          "bg-[#f0a428] text-[#1a1408] hover:bg-[#f5b34a]",
        variant === "default" &&
          "border border-[#3d392f] text-[#cfc6b2] hover:border-[#ece5d5]/40 hover:text-[#ece5d5]",
        variant === "ghost" && "text-[#8a8271] hover:text-[#ece5d5]",
        className
      )}
    >
      {children}
    </button>
  );
}

// ── time formatting ─────────────────────────────────────────────────────────

export function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.round(diff / 60000);
  if (m < 1) return "now";
  if (m < 60) return `${m}m`;
  const h = Math.round(m / 60);
  if (h < 24) return `${h}h`;
  return `${Math.round(h / 24)}d`;
}

export function fmtDate(ts: number): string {
  return new Date(ts).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

export function fmtDateTime(ts: number): string {
  return new Date(ts).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function fmtClock(ts: number): string {
  return new Date(ts).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });
}

export function todayLine(): string {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}
