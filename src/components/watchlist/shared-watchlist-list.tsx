"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";

type WatchStatus = "WATCHING" | "COMPLETED" | "PAUSED" | "DROPPED" | "PLAN_TO_WATCH";

type SharedWatchlistItem = {
  id: string;
  mediaId: string;
  title: string;
  type: string;
  status: WatchStatus;
  statusLabel: string;
  image?: string | null;
  year?: number | null;
  progressText: string;
  progress: number;
};

const statusFilters: { value: "ALL" | WatchStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  { value: "WATCHING", label: "Watching" },
  { value: "PLAN_TO_WATCH", label: "Plan to watch" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAUSED", label: "Paused" },
  { value: "DROPPED", label: "Dropped" }
];

export function SharedWatchlistList({ items }: { items: SharedWatchlistItem[] }) {
  const [statusFilter, setStatusFilter] = useState<"ALL" | WatchStatus>("ALL");
  const filteredItems = useMemo(
    () => items.filter((item) => statusFilter === "ALL" || item.status === statusFilter),
    [items, statusFilter]
  );

  if (!items.length) {
    return (
      <div className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-400">
        This public watchlist is empty.
      </div>
    );
  }

  return (
    <section className="mt-6">
      <div className="flex flex-col gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-zinc-400">
          Showing {filteredItems.length} of {items.length} titles
        </p>
        <select
          value={statusFilter}
          onChange={(event) => setStatusFilter(event.target.value as "ALL" | WatchStatus)}
          className="library-select h-10 rounded-md px-3 text-sm outline-none"
        >
          {statusFilters.map((option) => (
            <option key={option.value} value={option.value} className="bg-zinc-950">
              {option.label}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-3 grid gap-3">
        {filteredItems.length ? filteredItems.map((item) => (
          <article key={item.id} className="grid grid-cols-[70px_1fr] gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 md:grid-cols-[80px_1fr_160px] md:items-center">
            <Link href={`/media/${item.mediaId}`} className="relative aspect-[2/3] overflow-hidden rounded-md bg-zinc-900 md:h-28">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="80px" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-600">No image</div>
              )}
            </Link>
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2 text-xs uppercase text-cyan-200">
                <span>{item.type}</span>
                {item.year ? <span className="text-zinc-500">{item.year}</span> : null}
              </div>
              <Link href={`/media/${item.mediaId}`} className="mt-1 block truncate font-semibold text-white hover:text-cyan-200">
                {item.title}
              </Link>
              <p className="mt-1 text-sm text-zinc-400">{item.progressText}</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-cyan-300" style={{ width: `${item.progress}%` }} />
              </div>
            </div>
            <div className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
              {item.statusLabel}
            </div>
          </article>
        )) : (
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-400">
            No titles match this status.
          </div>
        )}
      </div>
    </section>
  );
}
