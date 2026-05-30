"use client";

import Image from "next/image";
import Link from "next/link";
import { ArrowDownAZ, Copy, Link2, Search, Share2, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState, useTransition } from "react";
import { Button } from "@/components/ui/button";

type WatchStatus = "WATCHING" | "COMPLETED" | "PAUSED" | "DROPPED" | "PLAN_TO_WATCH";

type WatchlistItem = {
  mediaId: string;
  title: string;
  type: string;
  status: WatchStatus;
  image?: string | null;
  year?: number | null;
  progressText: string;
  progress: number;
};

type SharingState = {
  enabled: boolean;
  shareUrl: string | null;
};

const statusOptions: { value: WatchStatus; label: string }[] = [
  { value: "WATCHING", label: "Watching" },
  { value: "PLAN_TO_WATCH", label: "Plan to watch" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAUSED", label: "Paused" },
  { value: "DROPPED", label: "Dropped" }
];

const statusFilters: { value: "ALL" | WatchStatus; label: string }[] = [
  { value: "ALL", label: "All" },
  ...statusOptions
];

const sortOptions = [
  { value: "recent", label: "Recently updated" },
  { value: "title", label: "Title A-Z" },
  { value: "progress", label: "Progress" },
  { value: "year", label: "Year" }
] as const;

type SortOption = (typeof sortOptions)[number]["value"];

export function WatchlistManager({
  initialItems,
  initialSharing,
  showSharing = true
}: {
  initialItems: WatchlistItem[];
  initialSharing: SharingState;
  showSharing?: boolean;
}) {
  const [items, setItems] = useState(initialItems);
  const [message, setMessage] = useState("");
  const [sharing, setSharing] = useState(initialSharing);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | WatchStatus>("ALL");
  const [sortBy, setSortBy] = useState<SortOption>("recent");
  const [origin, setOrigin] = useState("");
  const [isPending, startTransition] = useTransition();
  const shareHref = useMemo(() => {
    if (!sharing.shareUrl) return null;
    if (!origin) return sharing.shareUrl;
    return new URL(sharing.shareUrl, origin).toString();
  }, [origin, sharing.shareUrl]);

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    const nextItems = items.filter((item) => {
      const matchesStatus = statusFilter === "ALL" || item.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        item.title.toLowerCase().includes(normalizedQuery) ||
        item.type.toLowerCase().includes(normalizedQuery) ||
        item.progressText.toLowerCase().includes(normalizedQuery) ||
        String(item.year ?? "").includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });

    return [...nextItems].sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "progress") return b.progress - a.progress;
      if (sortBy === "year") return (b.year ?? 0) - (a.year ?? 0);
      return items.indexOf(a) - items.indexOf(b);
    });
  }, [items, query, sortBy, statusFilter]);

  function updateStatus(mediaId: string, status: WatchStatus) {
    setMessage("");
    const previousItems = items;
    setItems((current) => current.map((item) => (item.mediaId === mediaId ? { ...item, status } : item)));

    startTransition(async () => {
      const response = await fetch("/api/watchlist", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mediaId, status })
      });

      if (!response.ok) {
        setItems(previousItems);
        setMessage("Could not update this title.");
        return;
      }

      setMessage("Library updated.");
    });
  }

  function removeItem(mediaId: string) {
    setMessage("");
    const previousItems = items;
    setItems((current) => current.filter((item) => item.mediaId !== mediaId));

    startTransition(async () => {
      const response = await fetch(`/api/watchlist?mediaId=${encodeURIComponent(mediaId)}`, {
        method: "DELETE"
      });

      if (!response.ok) {
        setItems(previousItems);
        setMessage("Could not remove this title.");
        return;
      }

      setMessage("Removed from your library.");
    });
  }

  function updateSharing(enabled: boolean) {
    setMessage("");
    const previousSharing = sharing;
    setSharing((current) => ({ ...current, enabled }));

    startTransition(async () => {
      const response = await fetch("/api/watchlist/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled })
      });

      if (!response.ok) {
        setSharing(previousSharing);
        setMessage("Could not update sharing.");
        return;
      }

      const data = await response.json();
      setSharing({
        enabled: data.enabled,
        shareUrl: data.shareUrl
      });
      setMessage(enabled ? "Public share link enabled." : "Public share link disabled.");
    });
  }

  async function copyShareLink() {
    if (!shareHref) return;

    try {
      await navigator.clipboard.writeText(shareHref);
      setMessage("Share link copied.");
    } catch {
      setMessage("Could not copy the link.");
    }
  }

  if (items.length === 0) {
    return (
      <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
        <h2 className="font-display text-2xl font-semibold">Your library</h2>
        <p className="mt-2 text-sm text-zinc-400">Search for anime, movies, or TV series and add them to start tracking.</p>
        <Button href="/discover" className="mt-4">Find titles</Button>
      </section>
    );
  }

  return (
    <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold">Your library</h2>
          <p className="mt-1 text-sm text-zinc-500">Search, sort, update status, or open a title to track episodes.</p>
        </div>
        {message ? <p className="text-sm text-zinc-300">{message}</p> : null}
      </div>

      {showSharing ? <div className="mt-5 rounded-lg border border-cyan-300/20 bg-cyan-300/5 p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-white">
              <Share2 className="h-4 w-4 text-cyan-200" />
              Public share link
            </h3>
            <p className="mt-1 text-sm text-zinc-400">
              {sharing.enabled ? "Anyone with this link can view your current watchlist." : "Enable sharing to create a public watchlist link."}
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            {shareHref ? (
              <Link
                href={shareHref}
                className="inline-flex h-10 min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 text-sm text-zinc-300 transition hover:text-white"
              >
                <Link2 className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{shareHref}</span>
              </Link>
            ) : null}
            {sharing.enabled && shareHref ? (
              <button
                type="button"
                onClick={copyShareLink}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-semibold text-white transition hover:bg-white/10"
              >
                <Copy className="h-4 w-4" />
                Copy
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => updateSharing(!sharing.enabled)}
              disabled={isPending}
              className="inline-flex h-10 items-center justify-center rounded-md bg-cyan-300 px-4 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:opacity-50"
            >
              {sharing.enabled ? "Disable sharing" : "Enable sharing"}
            </button>
          </div>
        </div>
      </div> : null}

      <div className="mt-5 grid gap-3 lg:grid-cols-[1fr_180px_180px]">
        <label className="library-search flex h-10 items-center gap-3 rounded-md px-3">
          <Search className="library-control-icon h-4 w-4" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search title, type, year, or progress"
            className="library-search-input h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          />
        </label>
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
        <label className="library-select-shell flex h-10 items-center gap-2 rounded-md px-3">
          <ArrowDownAZ className="library-control-icon h-4 w-4" />
          <select
            value={sortBy}
            onChange={(event) => setSortBy(event.target.value as SortOption)}
            className="library-select-inner h-full min-w-0 flex-1 bg-transparent text-sm outline-none"
          >
            {sortOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-950">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <p className="mt-3 text-xs text-zinc-500">
        Showing {filteredItems.length} of {items.length} titles
      </p>

      <div className="mt-5 grid gap-3">
        {filteredItems.length ? filteredItems.map((item) => (
          <article key={item.mediaId} className="grid grid-cols-[70px_1fr] gap-3 rounded-lg border border-white/10 bg-black/20 p-3 md:grid-cols-[64px_1fr_170px_44px] md:items-center">
            <Link href={`/media/${item.mediaId}`} className="relative aspect-[2/3] w-full overflow-hidden rounded-md bg-zinc-900 md:aspect-auto md:h-20 md:w-16">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 768px) 70px, 64px" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center px-2 text-center text-xs text-zinc-600">No image</div>
              )}
            </Link>
            <div className="min-w-0 md:col-span-1">
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
            <div className="col-span-2 flex gap-2 md:contents">
              <select
                value={item.status}
                onChange={(event) => updateStatus(item.mediaId, event.target.value as WatchStatus)}
                disabled={isPending}
                className="library-select h-10 flex-1 rounded-md px-3 text-sm outline-none md:flex-initial md:w-full"
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value} className="bg-zinc-950">
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                onClick={() => removeItem(item.mediaId)}
                disabled={isPending}
                className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-red-500/15 hover:text-red-200 disabled:opacity-50 md:w-full"
                aria-label={`Remove ${item.title}`}
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          </article>
        )) : (
          <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
            No titles match the current library filters.
          </div>
        )}
      </div>
    </section>
  );
}
