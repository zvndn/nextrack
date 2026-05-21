"use client";

import { useEffect, useState, useTransition } from "react";
import { Check, Heart, Minus, Plus, Save } from "lucide-react";
import { Button } from "@/components/ui/button";

type WatchStatus = "WATCHING" | "COMPLETED" | "PAUSED" | "DROPPED" | "PLAN_TO_WATCH";

type TrackingControlsProps = {
  mediaId: string;
  mediaType: "ANIME" | "MOVIE" | "TV";
  initialWatchedCount: number;
  totalCount: number;
  initialStatus: WatchStatus;
  initialFavorite: boolean;
};

const statusOptions: { value: WatchStatus; label: string }[] = [
  { value: "PLAN_TO_WATCH", label: "Plan to watch" },
  { value: "WATCHING", label: "Watching" },
  { value: "COMPLETED", label: "Completed" },
  { value: "PAUSED", label: "Paused" },
  { value: "DROPPED", label: "Dropped" }
];

export function TrackingControls({
  mediaId,
  mediaType,
  initialWatchedCount,
  totalCount,
  initialStatus,
  initialFavorite
}: TrackingControlsProps) {
  const isEpisodeBased = mediaType !== "MOVIE";
  const [watchedCount, setWatchedCount] = useState(initialWatchedCount);
  const [episodeTotal, setEpisodeTotal] = useState(totalCount);
  const [status, setStatus] = useState<WatchStatus>(initialStatus);
  const [isFavorite, setIsFavorite] = useState(initialFavorite);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const percentage = episodeTotal > 0 ? Math.min(100, Math.round((watchedCount / episodeTotal) * 100)) : 0;

  // Sync state with props when they change (e.g. from Watch Sync auto-updating database)
  useEffect(() => {
    setWatchedCount(initialWatchedCount);
  }, [initialWatchedCount]);

  useEffect(() => {
    setEpisodeTotal(totalCount);
  }, [totalCount]);

  useEffect(() => {
    setStatus(initialStatus);
  }, [initialStatus]);

  useEffect(() => {
    setIsFavorite(initialFavorite);
  }, [initialFavorite]);

  function saveProgress(nextWatchedCount = watchedCount, nextStatus = status) {
    const normalizedTotal = isEpisodeBased ? Math.max(0, Math.floor(episodeTotal)) : 1;
    const normalizedWatched = Math.max(
      0,
      normalizedTotal > 0 ? Math.min(Math.floor(nextWatchedCount), normalizedTotal) : Math.floor(nextWatchedCount)
    );
    setMessage("");
    startTransition(async () => {
      const response = await fetch("/api/progress", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mediaId,
          watchedCount: normalizedWatched,
          totalCount: normalizedTotal,
          status: nextStatus
        })
      });

      if (response.ok) {
        const payload = await response.json();
        setWatchedCount(payload.progress?.watchedCount ?? normalizedWatched);
        setEpisodeTotal(payload.progress?.totalCount ?? normalizedTotal);
        setStatus(payload.watchlist?.status ?? nextStatus);
        setMessage(
          payload.favoriteAdded
            ? "Progress saved and added to favorites."
            : isEpisodeBased
              ? "Episode progress saved."
              : "Movie progress saved."
        );
        return;
      }

      const payload = await response.json().catch(() => null);
      setMessage(payload?.error ?? "Sign in first to update progress.");
    });
  }

  function toggleFavorite() {
    setMessage("");
    const nextFavorite = !isFavorite;
    setIsFavorite(nextFavorite);
    startTransition(async () => {
      const response = await fetch(nextFavorite ? "/api/favorites" : `/api/favorites?mediaId=${encodeURIComponent(mediaId)}`, {
        method: nextFavorite ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: nextFavorite ? JSON.stringify({ mediaId }) : undefined
      });

      if (!response.ok) {
        setIsFavorite(!nextFavorite);
        setMessage("Sign in first to update favorites.");
        return;
      }

      setMessage(nextFavorite ? "Added to favorites." : "Removed from favorites.");
    });
  }

  return (
    <div className="mt-6 max-w-xl rounded-lg border border-white/10 bg-black/30 p-4">
      <div className="grid gap-3 sm:grid-cols-[1fr_1fr_170px]">
        <label className="grid gap-2 text-sm text-zinc-300">
          {isEpisodeBased ? "Watched episodes" : "Progress"}
          <input
            type="number"
            min={0}
            max={episodeTotal || undefined}
            value={watchedCount}
            onChange={(event) => setWatchedCount(Number(event.target.value))}
            className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-cyan-300"
          />
        </label>
        {isEpisodeBased ? (
          <label className="grid gap-2 text-sm text-zinc-300">
            Total episodes
            <input
              type="number"
              min={0}
              value={episodeTotal}
              onChange={(event) => setEpisodeTotal(Number(event.target.value))}
              className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-cyan-300"
            />
          </label>
        ) : (
          <div className="grid gap-2 text-sm text-zinc-300">
            Total
            <div className="flex h-10 items-center rounded-md border border-white/10 bg-black/40 px-3 text-zinc-400">
              1 movie
            </div>
          </div>
        )}
        <label className="grid gap-2 text-sm text-zinc-300">
          Status
          <select
            value={status}
            onChange={(event) => setStatus(event.target.value as WatchStatus)}
            className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-white outline-none focus:border-cyan-300"
          >
            {statusOptions.map((option) => (
              <option key={option.value} value={option.value} className="bg-zinc-950">
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full rounded-full bg-cyan-300" style={{ width: `${percentage}%` }} />
      </div>
      <p className="mt-2 text-xs text-zinc-500">
        {isEpisodeBased
          ? `${watchedCount} of ${episodeTotal || "unknown"} episodes watched`
          : watchedCount > 0
            ? "Movie marked as watched"
            : "Movie not watched yet"}{" "}
        {episodeTotal > 0 ? `- ${percentage}% complete` : ""}
      </p>

      <div className="mt-4 flex flex-wrap gap-3">
        {isEpisodeBased ? (
          <>
            <Button
              onClick={() => setWatchedCount((current) => Math.max(0, current - 1))}
              variant="ghost"
              disabled={isPending}
              aria-label="Decrease watched episodes"
            >
              <Minus className="h-4 w-4" />
            </Button>
            <Button
              onClick={() => {
                const nextCount = episodeTotal > 0 ? Math.min(watchedCount + 1, episodeTotal) : watchedCount + 1;
                setWatchedCount(nextCount);
                saveProgress(nextCount, nextCount > 0 && status === "PLAN_TO_WATCH" ? "WATCHING" : status);
              }}
              disabled={isPending}
            >
              <Plus className="h-4 w-4" />
              Episode
            </Button>
          </>
        ) : null}
        <Button onClick={() => saveProgress()} disabled={isPending}>
          <Save className="h-4 w-4" />
          Save progress
        </Button>
        <Button
          onClick={() => {
            const nextTotal = isEpisodeBased ? episodeTotal : 1;
            setWatchedCount(nextTotal);
            setStatus("COMPLETED");
            saveProgress(nextTotal, "COMPLETED");
          }}
          variant="ghost"
          disabled={isPending || (isEpisodeBased && episodeTotal <= 0)}
        >
          <Check className="h-4 w-4" />
          Complete
        </Button>
        <Button onClick={toggleFavorite} variant="ghost" disabled={isPending}>
          <Heart className={`h-4 w-4 ${isFavorite ? "fill-rose-300 text-rose-300" : ""}`} />
          {isFavorite ? "Favorited" : "Favorite"}
        </Button>
      </div>
      {message ? <p className="mt-3 text-sm text-zinc-300">{message}</p> : null}
    </div>
  );
}
