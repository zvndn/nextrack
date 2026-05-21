"use client";

import { useEffect, useState, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import {
  Cast,
  CheckCircle2,
  ExternalLink,
  Loader2,
  Play,
  Tv,
  Zap
} from "lucide-react";

type StreamingSyncProps = {
  mediaId: string;
  mediaTitle: string;
  mediaType: "ANIME" | "MOVIE" | "TV";
  currentWatchedCount: number;
  totalCount: number;
};

type ConnectedAccount = {
  username: string;
  autoSync: boolean;
};

const providers = [
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    color: "from-orange-500 to-amber-600",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/10",
    iconColor: "text-orange-400",
    searchUrl: (title: string) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(title)}`,
    types: ["ANIME"]
  },
  {
    id: "netflix",
    name: "Netflix",
    color: "from-red-600 to-red-800",
    border: "border-red-600/30",
    glow: "shadow-red-600/10",
    iconColor: "text-red-500",
    searchUrl: (title: string) => `https://www.netflix.com/search?q=${encodeURIComponent(title)}`,
    types: ["ANIME", "MOVIE", "TV"]
  },
  {
    id: "disney",
    name: "Disney+",
    color: "from-blue-600 to-indigo-800",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    iconColor: "text-blue-400",
    searchUrl: (title: string) => `https://www.disneyplus.com/search?q=${encodeURIComponent(title)}`,
    types: ["MOVIE", "TV"]
  },
  {
    id: "prime",
    name: "Prime Video",
    color: "from-cyan-600 to-blue-500",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    iconColor: "text-cyan-400",
    searchUrl: (title: string) => `https://www.amazon.com/s?k=${encodeURIComponent(title)}&i=instant-video`,
    types: ["MOVIE", "TV"]
  }
];

export function StreamingSync({
  mediaId,
  mediaTitle,
  mediaType,
  currentWatchedCount,
  totalCount
}: StreamingSyncProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sync" | "accounts">("sync");
  const [connections, setConnections] = useState<Record<string, ConnectedAccount>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formAutoSync, setFormAutoSync] = useState(true);

  // Playback companion states
  const [activeSession, setActiveSession] = useState<boolean>(false);
  // Track latest watched count from server to ensure correct auto-increment
  const [watchedServer, setWatchedServer] = useState<number>(currentWatchedCount);
  const [sessionPlatform, setSessionPlatform] = useState<(typeof providers)[number] | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  const [durationSec, setDurationSec] = useState(30);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [, startTransition] = useTransition();
  const [message, setMessage] = useState("");

  const activeProviders = providers.filter((p) => p.types.includes(mediaType));

  // Load account connections on mount
  useEffect(() => {
    const loaded: Record<string, ConnectedAccount> = {};
    providers.forEach((p) => {
      const stored = window.localStorage.getItem(`nextrack_sync_${p.id}`);
      if (stored) {
        try {
          loaded[p.id] = JSON.parse(stored);
        } catch {
          // Ignore
        }
      }
    });
    setConnections(loaded);
  }, []);

  // Keep watchedServer in sync with prop changes
  useEffect(() => {
    setWatchedServer(currentWatchedCount);
  }, [currentWatchedCount]);

  // Sync back to database
  const triggerAutoSync = useCallback(() => {
    const isLinked = sessionPlatform ? connections[sessionPlatform.id] : null;
    const shouldSync = !isLinked || isLinked.autoSync;

    if (!shouldSync) {
      setMessage("Watch session ended. Turn on Auto-Sync to automate episode updates.");
      return;
    }

    const nextWatchedCount = mediaType === "MOVIE"
        ? 1
        : Math.min(watchedServer + 1, totalCount > 0 ? totalCount : watchedServer + 1);

    startTransition(async () => {
      try {
        const response = await fetch("/api/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId,
            watchedCount: nextWatchedCount,
            totalCount: totalCount > 0 ? totalCount : 12, // fallback episodes default
            status: nextWatchedCount >= totalCount && totalCount > 0 ? "COMPLETED" : "WATCHING"
          })
        });

        if (response.ok) {
          // Update server-watched state from response
          const payload = await response.json();
          setWatchedServer(payload.progress?.watchedCount ?? nextWatchedCount);
          setMessage(
            payload.favoriteAdded
              ? `Sync success. Watched count updated to ${nextWatchedCount} and saved to favorites.`
              : `Sync success. Watched count updated to ${nextWatchedCount}.`
          );
          router.refresh();
        } else {
          setMessage("Completed watch session. Sign in to sync watchlist automatically.");
        }
      } catch {
        setMessage("Could not sync with local database. Try updating progress manually.");
      }
    });
  }, [sessionPlatform, connections, mediaType, totalCount, mediaId, router, watchedServer]);

  // Timer loop for watch session
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (activeSession && isPlaying && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsPlaying(false);
            setSessionCompleted(true);
            // Do not call triggerAutoSync here to avoid startTransition during render.
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [activeSession, isPlaying, timeLeft]);

  // Effect to sync after session completes
  useEffect(() => {
    if (sessionCompleted) {
      // Call triggerAutoSync after render phase
      triggerAutoSync();
    }
    // Reset sessionCompleted after handling to avoid repeated calls
    if (sessionCompleted) {
      setSessionCompleted(false);
    }
  }, [sessionCompleted, triggerAutoSync]);

  // Connect platform helper
  function connectPlatform(platformId: string) {
    if (!formUsername.trim()) return;
    const data: ConnectedAccount = { username: formUsername.trim(), autoSync: formAutoSync };
    window.localStorage.setItem(`nextrack_sync_${platformId}`, JSON.stringify(data));
    setConnections((prev) => ({ ...prev, [platformId]: data }));
    setEditingPlatform(null);
    setFormUsername("");
  }

  // Disconnect platform helper
  function disconnectPlatform(platformId: string) {
    window.localStorage.removeItem(`nextrack_sync_${platformId}`);
    setConnections((prev) => {
      const next = { ...prev };
      delete next[platformId];
      return next;
    });
  }

  // Launch simulated stream
  async function startWatchSession(platform: typeof providers[number]) {
    setSessionPlatform(platform);
    // Fetch duration based on media type
    try {
      const res = await fetch(`/api/media/${mediaId}/duration`);
      if (res.ok) {
        const data = await res.json();
        const dur = data.duration ?? 30;
        setDurationSec(dur);
        setTimeLeft(dur);
      } else {
        setDurationSec(30);
        setTimeLeft(30);
      }
    } catch {
      setDurationSec(30);
      setTimeLeft(30);
    }
    setIsPlaying(true);
    setSessionCompleted(false);
    setActiveSession(true);
    setMessage("");

    // Open target streaming query list in a new window/tab
    window.open(platform.searchUrl(mediaTitle), "_blank", "noopener,noreferrer");
  }

  return (
    <section className="rounded-xl border border-white/10 bg-white/[var(--surface-alpha)] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex-1 text-center text-sm font-semibold pb-2 border-b-2 transition ${
            activeTab === "sync" ? "border-cyan-300 text-cyan-200" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Watch Sync
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 text-center text-sm font-semibold pb-2 border-b-2 transition ${
            activeTab === "accounts" ? "border-cyan-300 text-cyan-200" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sync Settings
        </button>
      </div>

      {activeTab === "sync" ? (
        <div className="mt-4 space-y-4">
          {!activeSession ? (
            <>
              <div>
                <h3 className="font-display font-semibold text-white flex items-center gap-2">
                  <Cast className="h-4 w-4 text-cyan-300" />
                  Streaming Providers
                </h3>
                <p className="mt-1 text-xs text-zinc-400">
                  Select a platform to stream this title. NexTrack will auto-update your watchlist when complete.
                </p>
              </div>

              <div className="grid gap-3">
                {activeProviders.map((p) => {
                  const isLinked = connections[p.id];
                  return (
                    <button
                      key={p.id}
                      onClick={() => startWatchSession(p)}
                      className={`group flex items-center justify-between rounded-lg border bg-gradient-to-r p-3.5 transition text-left active:scale-98 ${p.border} ${p.glow} bg-black/40 hover:bg-white/5`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`text-sm font-bold text-white group-hover:underline`}>
                          Watch on {p.name}
                        </span>
                        {isLinked ? (
                          <span className="flex items-center gap-1 rounded bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 text-[10px] text-emerald-300 font-semibold tracking-wide">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Sync Active
                          </span>
                        ) : null}
                      </div>
                      <ExternalLink className="h-4 w-4 text-zinc-500 group-hover:text-white transition" />
                    </button>
                  );
                })}
              </div>
            </>
          ) : (
            /* Watch Visualizer HUD */
            <div className="space-y-4 animate-in fade-in duration-200">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
                  Simulated watch session
                </span>
                <button
                  onClick={() => setActiveSession(false)}
                  className="text-xs text-zinc-500 hover:text-white transition"
                >
                  Cancel
                </button>
              </div>

              {/* Dynamic canvas simulating video player */}
              <div className="relative aspect-video rounded-lg overflow-hidden border border-white/10 bg-slate-950 flex flex-col items-center justify-center p-4">
                <div className="absolute inset-0 bg-gradient-to-tr from-cyan-950/20 via-black to-purple-950/15 opacity-60 pointer-events-none" />

                {isPlaying ? (
                  <>
                    {/* Animated frequencies */}
                    <div className="flex items-end justify-center gap-1.5 h-10 mb-3">
                      <span className="w-1 bg-cyan-300 rounded animate-[pulse_0.9s_infinite] h-8" />
                      <span className="w-1 bg-cyan-300 rounded animate-[pulse_0.7s_infinite] h-4" />
                      <span className="w-1 bg-cyan-300 rounded animate-[pulse_1.1s_infinite] h-10" />
                      <span className="w-1 bg-cyan-300 rounded animate-[pulse_0.6s_infinite] h-6" />
                      <span className="w-1 bg-cyan-300 rounded animate-[pulse_0.8s_infinite] h-7" />
                    </div>
                    <p className="text-sm font-semibold text-white animate-pulse">
                      Streaming from {sessionPlatform?.name}...
                    </p>
                    <p className="mt-1 text-[11px] text-zinc-400">
                      Auto-tracking Episode {mediaType === "MOVIE" ? "Movie" : watchedServer + 1}
                    </p>
                  </>
                ) : sessionCompleted ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 text-emerald-400 mb-2 animate-bounce" />
                    <p className="text-sm font-bold text-white">Stream Completed</p>
                    <p className="mt-1 text-xs text-zinc-400">Progress update triggered successfully</p>
                  </>
                ) : (
                  <>
                    <Tv className="h-10 w-10 text-zinc-600 mb-2" />
                    <p className="text-sm font-semibold text-zinc-400">Stream Paused</p>
                  </>
                )}

                {/* Progress bar overlay */}
                <div className="absolute bottom-0 inset-x-0 h-1 bg-white/10">
                  <div
                    className="h-full bg-cyan-300 transition-all duration-1000 ease-linear"
                    style={{ width: `${((durationSec - timeLeft) / durationSec) * 100}%` }}
                  />
                </div>
              </div>

              {/* Countdown controls */}
              <div className="flex items-center justify-between rounded-lg border border-white/5 bg-black/35 px-4 py-3">
                <div>
                  <span className="block font-mono text-xl font-bold text-white">
                    00:{timeLeft < 10 ? `0${timeLeft}` : timeLeft}
                  </span>
                  <span className="block text-[10px] text-zinc-500 uppercase tracking-wider">Sync timer</span>
                </div>
                <div className="flex gap-2">
                  {timeLeft > 0 ? (
                    <>
                      <button
                        onClick={() => setIsPlaying(!isPlaying)}
                        className="flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 hover:bg-white/10 transition"
                      >
                        {isPlaying ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
                      </button>
                      <button
                        onClick={() => {
                          setTimeLeft(0);
                          setIsPlaying(false);
                          setSessionCompleted(true);
                          triggerAutoSync();
                        }}
                        className="flex h-9 items-center justify-center rounded-md bg-cyan-300 px-3 text-xs font-semibold text-black hover:bg-cyan-200 transition"
                      >
                        Skip & Sync
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        setTimeLeft(durationSec);
                        setSessionCompleted(false);
                        setIsPlaying(true);
                      }}
                      className="flex h-9 items-center justify-center rounded-md border border-cyan-300/30 bg-cyan-400/10 px-3 text-xs font-semibold text-cyan-200 hover:bg-cyan-400/20 transition"
                    >
                      Restart Stream
                    </button>
                  )}
                </div>
              </div>

              {message ? (
                <div className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-xs text-zinc-300 text-center animate-pulse">
                  {message}
                </div>
              ) : null}
            </div>
          )}
        </div>
      ) : (
        /* Connected Credentials Accounts tab */
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="font-display font-semibold text-white flex items-center gap-2">
              <Zap className="h-4 w-4 text-cyan-300" />
              Connected Profiles
            </h3>
            <p className="mt-1 text-xs text-zinc-400">
              Synchronize NexTrack with your streaming provider credentials to automate library updates.
            </p>
          </div>

          <div className="space-y-2">
            {activeProviders.map((p) => {
              const account = connections[p.id];
              const isEditing = editingPlatform === p.id;

              return (
                <div
                  key={p.id}
                  className="rounded-lg border border-white/10 bg-black/35 p-3.5"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="block text-sm font-semibold text-white">{p.name}</span>
                      {account ? (
                        <span className="block text-[11px] text-zinc-400 mt-0.5">
                          Synced with: <strong className="text-zinc-200">{account.username}</strong>{" "}
                          {account.autoSync ? "(Auto)" : "(Manual)"}
                        </span>
                      ) : (
                        <span className="block text-[11px] text-zinc-500 mt-0.5">
                          Not synchronized
                        </span>
                      )}
                    </div>
                    {isEditing ? null : account ? (
                      <button
                        onClick={() => disconnectPlatform(p.id)}
                        className="text-xs font-semibold text-red-400 hover:text-red-300 transition"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPlatform(p.id);
                          setFormUsername("");
                          setFormAutoSync(true);
                        }}
                        className="text-xs font-semibold text-cyan-300 hover:text-cyan-200 transition"
                      >
                        Connect
                      </button>
                    )}
                  </div>

                  {/* Connect Form Toggle */}
                  {isEditing ? (
                    <div className="mt-3 border-t border-white/5 pt-3 space-y-3 animate-in slide-in-from-top-2 duration-150">
                      <label className="grid gap-1.5 text-xs text-zinc-300">
                        Profile username/email
                        <input
                          value={formUsername}
                          onChange={(e) => setFormUsername(e.target.value)}
                          placeholder="e.g. crunchy_watcher"
                          className="h-9 rounded border border-white/10 bg-black/40 px-2.5 text-xs text-white outline-none focus:border-cyan-300"
                        />
                      </label>
                      <label className="flex items-center gap-2 text-xs text-zinc-300 cursor-pointer select-none">
                        <input
                          type="checkbox"
                          checked={formAutoSync}
                          onChange={(e) => setFormAutoSync(e.target.checked)}
                          className="h-4 w-4 rounded border-white/10 bg-blackaccent-400 accent-cyan-300 focus:ring-0"
                        />
                        Enable Auto-Sync watched count
                      </label>
                      <div className="flex gap-2 pt-1 justify-end">
                        <button
                          onClick={() => setEditingPlatform(null)}
                          className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 hover:bg-white/10 hover:text-white transition"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => connectPlatform(p.id)}
                          className="rounded bg-cyan-300 px-2.5 py-1.5 text-xs font-semibold text-black hover:bg-cyan-200 transition"
                        >
                          Save Connection
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}
