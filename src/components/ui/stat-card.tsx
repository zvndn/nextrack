import type { LucideIcon } from "lucide-react";

type StatCardProps = {
  label: string;
  value: string;
  detail?: string;
  icon?: LucideIcon;
  emphasis?: "default" | "accent" | "warm";
};

const emphasisStyles = {
  default: "text-zinc-300 bg-white/5",
  accent: "text-cyan-200 bg-cyan-300/10",
  warm: "text-amber-200 bg-amber-300/10"
};

export function StatCard({ label, value, detail, icon: Icon, emphasis = "default" }: StatCardProps) {
  return (
    <article className="min-h-32 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-4 shadow-[0_18px_60px_rgba(0,0,0,0.16)]">
      <div className="flex items-start justify-between gap-3">
        <p className="text-xs font-semibold uppercase text-zinc-500">{label}</p>
        {Icon ? (
          <span className={`grid h-8 w-8 shrink-0 place-items-center rounded-md ${emphasisStyles[emphasis]}`}>
            <Icon className="h-4 w-4" />
          </span>
        ) : null}
      </div>
      <div className="mt-3 font-display text-3xl font-semibold leading-none text-white">{value}</div>
      {detail ? <p className="mt-3 text-sm leading-5 text-zinc-400">{detail}</p> : null}
    </article>
  );
}
