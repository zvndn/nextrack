import Link from "next/link";
import { ArrowRight, Sparkles } from "lucide-react";
import type { SmartQueueItem } from "@/lib/smart-queue";

export function SmartQueue({ items }: { items: SmartQueueItem[] }) {
  if (!items.length) return null;

  return (
    <section className="panel rounded-lg p-5" aria-labelledby="smart-queue-heading">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-200"><Sparkles className="h-4 w-4" /> Smart queue</p>
          <h2 id="smart-queue-heading" className="mt-1 font-display text-2xl font-semibold">Your best next picks</h2>
          <p className="mt-1 text-sm text-zinc-400">A private, explainable order based on progress, recency, and ratings.</p>
        </div>
        <Link href="/watchlist" className="text-sm font-medium text-cyan-200 hover:text-cyan-100">Manage library</Link>
      </div>
      <ol className="mt-5 grid gap-3 lg:grid-cols-3">
        {items.slice(0, 3).map((item, index) => (
          <li key={item.id}>
            <Link href={`/media/${item.id}`} className="interactive-card flex h-full gap-3 rounded-lg border border-white/10 bg-black/20 p-3">
              <span className="grid h-8 w-8 flex-none place-items-center rounded-md bg-cyan-300/15 text-sm font-bold text-cyan-100">{index + 1}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold text-white">{item.title}</span>
                <span className="mt-1 block text-sm text-zinc-400">{item.reason}</span>
                <span className="mt-2 block text-xs text-zinc-500">{Math.round(item.progress)}% complete</span>
              </span>
              <ArrowRight className="mt-2 h-4 w-4 flex-none text-zinc-500" />
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
