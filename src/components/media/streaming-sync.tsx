"use client";

import { useCallback, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import {
  Cast,
  CheckCircle2,
  Clock,
  ExternalLink,
  Film,
  Globe2,
  Link2,
  Maximize2,
  MonitorPlay,
  Minimize2,
  Pause,
  Play,
  RotateCcw,
  Search,
  Settings2,
  Tv,
  Zap
} from "lucide-react";

type StreamingSyncProps = {
  mediaId: string;
  mediaTitle: string;
  mediaType: "ANIME" | "MOVIE" | "TV";
  currentWatchedCount: number;
  totalCount: number;
  runtimeMinutes?: number | null;
};

type ConnectedAccount = {
  username: string;
  autoSync: boolean;
};

type SyncPlatform = {
  id: string;
  name: string;
  border: string;
  glow: string;
  iconColor: string;
};

type Provider = SyncPlatform & {
  searchUrl: (title: string, targetLabel: string) => string;
  types: Array<StreamingSyncProps["mediaType"]>;
  connectable?: boolean;
};

type Handoff = {
  platform: SyncPlatform;
  targetCount: number;
  targetLabel: string;
  durationSeconds: number;
  startedAt: string;
  sourceUrl?: string;
  embedded?: boolean;
};

const providers: Provider[] = [
  {
    id: "crunchyroll",
    name: "Crunchyroll",
    border: "border-orange-500/30",
    glow: "shadow-orange-500/10",
    iconColor: "text-orange-400",
    searchUrl: (title, targetLabel) => `https://www.crunchyroll.com/search?q=${encodeURIComponent(`${title} ${targetLabel}`)}`,
    types: ["ANIME"]
  },
  {
    id: "netflix",
    name: "Netflix",
    border: "border-red-600/30",
    glow: "shadow-red-600/10",
    iconColor: "text-red-500",
    searchUrl: (title, targetLabel) => `https://www.netflix.com/search?q=${encodeURIComponent(`${title} ${targetLabel}`)}`,
    types: ["ANIME", "MOVIE", "TV"]
  },
  {
    id: "disney",
    name: "Disney+",
    border: "border-blue-500/30",
    glow: "shadow-blue-500/10",
    iconColor: "text-blue-400",
    searchUrl: (title, targetLabel) => `https://www.disneyplus.com/search?q=${encodeURIComponent(`${title} ${targetLabel}`)}`,
    types: ["MOVIE", "TV"]
  },
  {
    id: "prime",
    name: "Prime Video",
    border: "border-cyan-500/30",
    glow: "shadow-cyan-500/10",
    iconColor: "text-cyan-400",
    searchUrl: (title, targetLabel) => `https://www.amazon.com/s?k=${encodeURIComponent(`${title} ${targetLabel}`)}&i=instant-video`,
    types: ["MOVIE", "TV"]
  },
  {
    id: "google",
    name: "Google",
    border: "border-zinc-400/25",
    glow: "shadow-zinc-500/10",
    iconColor: "text-zinc-200",
    searchUrl: (title, targetLabel) => `https://www.google.com/search?q=${encodeURIComponent(`${title} ${targetLabel} watch legal streaming`)}`,
    types: ["ANIME", "MOVIE", "TV"],
    connectable: false
  }
];

const urlPlatformMatchers: Array<{ match: string; platform: SyncPlatform }> = [
  { match: "crunchyroll.", platform: providers[0] },
  { match: "netflix.", platform: providers[1] },
  { match: "disneyplus.", platform: providers[2] },
  { match: "amazon.", platform: providers[3] },
  { match: "primevideo.", platform: providers[3] },
  { match: "google.", platform: providers[4] }
];

const genericPlatform: SyncPlatform = {
  id: "custom",
  name: "Custom URL",
  border: "border-cyan-300/25",
  glow: "shadow-cyan-300/10",
  iconColor: "text-cyan-200"
};

function clampTarget(value: number, totalCount: number) {
  const normalized = Math.max(1, Math.floor(value));
  return totalCount > 0 ? Math.min(normalized, totalCount) : normalized;
}

function targetLabel(mediaType: StreamingSyncProps["mediaType"], targetCount: number) {
  return mediaType === "MOVIE" ? "movie" : `episode ${targetCount}`;
}

function fallbackRuntimeMinutes(mediaType: StreamingSyncProps["mediaType"]) {
  if (mediaType === "ANIME") return 24;
  if (mediaType === "TV") return 45;
  return 120;
}

function formatCountdown(seconds: number) {
  const safeSeconds = Math.max(0, Math.floor(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainingSeconds = safeSeconds % 60;
  const paddedMinutes = String(minutes).padStart(2, "0");
  const paddedSeconds = String(remainingSeconds).padStart(2, "0");

  return hours > 0 ? `${hours}:${paddedMinutes}:${paddedSeconds}` : `${paddedMinutes}:${paddedSeconds}`;
}

function clampNumber(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, Math.floor(value)));
}

function parseHttpUrl(value: string) {
  const trimmed = value.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(/^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`);
    return parsed.protocol === "http:" || parsed.protocol === "https:" ? parsed : null;
  } catch {
    return null;
  }
}

function platformFromUrl(url: URL): SyncPlatform {
  const host = url.hostname.toLowerCase();
  return urlPlatformMatchers.find((item) => host.includes(item.match))?.platform ?? genericPlatform;
}

function youtubeEmbedUrl(url: URL) {
  const host = url.hostname.toLowerCase();
  const videoId = host.includes("youtu.be")
    ? url.pathname.split("/").filter(Boolean)[0]
    : url.searchParams.get("v");

  if (!videoId || (!host.includes("youtube.") && !host.includes("youtu.be"))) return null;

  const embedUrl = new URL(`https://www.youtube.com/embed/${videoId}`);
  const list = url.searchParams.get("list");
  const start = url.searchParams.get("start") ?? url.searchParams.get("t");
  if (list) embedUrl.searchParams.set("list", list);
  if (start) embedUrl.searchParams.set("start", start.replace(/\D/g, ""));
  return embedUrl.toString();
}

function embeddableUrl(url: URL) {
  const youtube = youtubeEmbedUrl(url);
  if (youtube) return youtube;
  return url.toString();
}

function episodeFromUrl(url: URL, totalCount: number) {
  const candidates = [
    url.searchParams.get("episode"),
    url.searchParams.get("ep"),
    url.searchParams.get("e")
  ];
  const decodedUrl = decodeURIComponent(url.toString()).replace(/[-_]+/g, " ");
  const matches = [
    decodedUrl.match(/\bs\d{1,2}\s*e(\d{1,4})\b/i)?.[1],
    decodedUrl.match(/\bepisode\s*(\d{1,4})\b/i)?.[1],
    decodedUrl.match(/\bep\s*(\d{1,4})\b/i)?.[1],
    ...candidates
  ];

  for (const match of matches) {
    const parsed = Number(match);
    if (!Number.isInteger(parsed) || parsed < 1) continue;
    if (totalCount > 0 && parsed > totalCount) continue;
    return parsed;
  }

  return undefined;
}

export function StreamingSync({
  mediaId,
  mediaTitle,
  mediaType,
  currentWatchedCount,
  totalCount,
  runtimeMinutes
}: StreamingSyncProps) {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"sync" | "accounts">("sync");
  const [connections, setConnections] = useState<Record<string, ConnectedAccount>>({});
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formAutoSync, setFormAutoSync] = useState(true);
  const [watchedServer, setWatchedServer] = useState(currentWatchedCount);
  const [targetCount, setTargetCount] = useState(() =>
    mediaType === "MOVIE" ? 1 : clampTarget(currentWatchedCount + 1, totalCount)
  );
  const [handoff, setHandoff] = useState<Handoff | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [autoSyncRequested, setAutoSyncRequested] = useState(false);
  const [watchUrl, setWatchUrl] = useState("");
  const [embeddedUrl, setEmbeddedUrl] = useState("");
  const [activeWatchUrl, setActiveWatchUrl] = useState("");
  const [iframeWidth, setIframeWidth] = useState(100);
  const [iframeHeight, setIframeHeight] = useState(520);
  const [urlEpisodeHint, setUrlEpisodeHint] = useState<number | undefined>();
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();

  const activeProviders = useMemo(
    () => providers.filter((provider) => provider.types.includes(mediaType)),
    [mediaType]
  );
  const accountProviders = useMemo(
    () => activeProviders.filter((provider) => provider.connectable !== false),
    [activeProviders]
  );
  const isMovie = mediaType === "MOVIE";
  const selectedTargetLabel = targetLabel(mediaType, targetCount);
  const sessionRuntimeMinutes = runtimeMinutes && runtimeMinutes > 0
    ? Math.floor(runtimeMinutes)
    : fallbackRuntimeMinutes(mediaType);
  const sessionDurationSeconds = sessionRuntimeMinutes * 60;

  useEffect(() => {
    const loaded: Record<string, ConnectedAccount> = {};
    providers.forEach((provider) => {
      const stored = window.localStorage.getItem(`nextrack_sync_${provider.id}`);
      if (!stored) return;
      try {
        loaded[provider.id] = JSON.parse(stored) as ConnectedAccount;
      } catch {
        // Ignore malformed local account metadata.
      }
    });
    setConnections(loaded);
  }, []);

  useEffect(() => {
    setWatchedServer(currentWatchedCount);
    setTargetCount(mediaType === "MOVIE" ? 1 : clampTarget(currentWatchedCount + 1, totalCount));
  }, [currentWatchedCount, mediaType, totalCount]);

  useEffect(() => {
    if (!handoff || !isPlaying || timeLeft <= 0) return;

    const interval = window.setInterval(() => {
      setTimeLeft((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          setIsPlaying(false);
          setAutoSyncRequested(true);
          return 0;
        }
        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [handoff, isPlaying, timeLeft]);

  function connectPlatform(platformId: string) {
    if (!formUsername.trim()) return;
    const data: ConnectedAccount = { username: formUsername.trim(), autoSync: formAutoSync };
    window.localStorage.setItem(`nextrack_sync_${platformId}`, JSON.stringify(data));
    setConnections((current) => ({ ...current, [platformId]: data }));
    setEditingPlatform(null);
    setFormUsername("");
  }

  function disconnectPlatform(platformId: string) {
    window.localStorage.removeItem(`nextrack_sync_${platformId}`);
    setConnections((current) => {
      const next = { ...current };
      delete next[platformId];
      return next;
    });
  }

  function startStreamingHandoff(platform: Provider) {
    const normalizedTarget = isMovie ? 1 : clampTarget(targetCount, totalCount);
    const normalizedLabel = targetLabel(mediaType, normalizedTarget);

    setHandoff({
      platform,
      targetCount: normalizedTarget,
      targetLabel: normalizedLabel,
      durationSeconds: sessionDurationSeconds,
      startedAt: new Date().toISOString()
    });
    setTimeLeft(sessionDurationSeconds);
    setIsPlaying(true);
    setAutoSyncRequested(false);
    setMessage(`Opened ${platform.name} for ${normalizedLabel}. Auto-Sync starts after ${sessionRuntimeMinutes} min.`);
    window.open(platform.searchUrl(mediaTitle, normalizedLabel), "_blank", "noopener,noreferrer");
  }

  function startUrlHandoff(openInsideSite: boolean) {
    const parsedUrl = parseHttpUrl(watchUrl);
    if (!parsedUrl) {
      setMessage("Enter a valid http or https URL.");
      return;
    }

    const platform = platformFromUrl(parsedUrl);
    const detectedEpisode = isMovie ? 1 : episodeFromUrl(parsedUrl, totalCount);
    const normalizedTarget = isMovie ? 1 : clampTarget(detectedEpisode ?? targetCount, totalCount);
    const normalizedLabel = targetLabel(mediaType, normalizedTarget);
    const frameUrl = embeddableUrl(parsedUrl);

    if (detectedEpisode && !isMovie) {
      setTargetCount(normalizedTarget);
    }

    setHandoff({
      platform,
      targetCount: normalizedTarget,
      targetLabel: normalizedLabel,
      durationSeconds: sessionDurationSeconds,
      startedAt: new Date().toISOString(),
      sourceUrl: parsedUrl.toString(),
      embedded: openInsideSite
    });
    setTimeLeft(sessionDurationSeconds);
    setIsPlaying(true);
    setAutoSyncRequested(false);
    setActiveWatchUrl(parsedUrl.toString());
    setUrlEpisodeHint(detectedEpisode);

    if (openInsideSite) {
      setEmbeddedUrl(frameUrl);
      setMessage(
        detectedEpisode && !isMovie
          ? `${platform.name} iframe added to the watch zone. Episode ${detectedEpisode} was detected from the URL.`
          : `${platform.name} iframe added to the watch zone for ${normalizedLabel}.`
      );
      return;
    }

    setEmbeddedUrl("");
    window.open(parsedUrl.toString(), "_blank", "noopener,noreferrer");
    setMessage(`${platform.name} opened in a new tab. Runtime Auto-Sync is running for ${normalizedLabel}.`);
  }

  const syncWatchedTarget = useCallback((target: Handoff, fromCountdown = false) => {
    const linkedAccount = connections[target.platform.id];
    if (linkedAccount && !linkedAccount.autoSync) {
      setMessage(`Manual sync is enabled for ${target.platform.name}. Turn on Auto-Sync or save progress manually.`);
      return;
    }

    const nextWatchedCount = isMovie ? 1 : Math.max(watchedServer, target.targetCount);
    const nextTotal = isMovie ? 1 : totalCount > 0 ? totalCount : nextWatchedCount;

    setMessage("");
    startTransition(async () => {
      try {
        const response = await fetch("/api/progress", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            mediaId,
            watchedCount: nextWatchedCount,
            totalCount: nextTotal,
            status: nextWatchedCount >= nextTotal ? "COMPLETED" : "WATCHING"
          })
        });

        if (!response.ok) {
          setMessage("Sign in first to sync watched progress.");
          return;
        }

        const payload = await response.json();
        const syncedCount = payload.progress?.watchedCount ?? nextWatchedCount;
        setWatchedServer(syncedCount);
        setTargetCount(isMovie ? 1 : clampTarget(syncedCount + 1, nextTotal));
        setHandoff(null);
        setTimeLeft(0);
        setIsPlaying(false);
        setMessage(
          payload.favoriteAdded
            ? `${target.targetLabel} auto-synced after runtime countdown and title added to favorites.`
            : fromCountdown
              ? `${target.targetLabel} auto-synced after runtime countdown.`
              : `${target.targetLabel} synced to your progress.`
        );
        router.refresh();
      } catch {
        setMessage("Could not sync progress. Try again from this panel.");
      }
    });
  }, [connections, isMovie, mediaId, router, totalCount, watchedServer]);

  useEffect(() => {
    if (!autoSyncRequested || !handoff) return;
    setAutoSyncRequested(false);
    syncWatchedTarget(handoff, true);
  }, [autoSyncRequested, handoff, syncWatchedTarget]);

  return (
    <section className="rounded-xl border border-white/10 bg-white/[var(--surface-alpha)] p-5 shadow-2xl backdrop-blur-xl">
      <div className="flex border-b border-white/10 pb-3">
        <button
          onClick={() => setActiveTab("sync")}
          className={`flex-1 border-b-2 pb-2 text-center text-sm font-semibold transition ${
            activeTab === "sync" ? "border-cyan-300 text-cyan-200" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Watch Sync
        </button>
        <button
          onClick={() => setActiveTab("accounts")}
          className={`flex-1 border-b-2 pb-2 text-center text-sm font-semibold transition ${
            activeTab === "accounts" ? "border-cyan-300 text-cyan-200" : "border-transparent text-zinc-400 hover:text-zinc-200"
          }`}
        >
          Sync Settings
        </button>
      </div>

      {activeTab === "sync" ? (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="flex items-center gap-2 font-display font-semibold text-white">
              <Cast className="h-4 w-4 text-cyan-300" />
              Runtime Auto-Sync
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Choose the exact {isMovie ? "movie" : "episode"} to watch. NexTrack starts a runtime countdown and syncs automatically when it ends.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/35 p-3.5">
            <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Sync target
              {isMovie ? (
                <div className="flex h-10 items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-zinc-200">
                  <Film className="h-4 w-4 text-cyan-300" />
                  Full movie
                </div>
              ) : (
                <input
                  type="number"
                  min={1}
                  max={totalCount || undefined}
                  value={targetCount}
                  onChange={(event) => setTargetCount(clampTarget(Number(event.target.value), totalCount))}
                  className="h-10 rounded-md border border-white/10 bg-black/40 px-3 text-sm normal-case tracking-normal text-white outline-none focus:border-cyan-300"
                />
              )}
            </label>
            <p className="mt-2 text-xs text-zinc-500">
              Current NexTrack progress: {isMovie ? (watchedServer > 0 ? "watched" : "not watched") : `${watchedServer} of ${totalCount || "unknown"} episodes`}.
              {" "}Runtime countdown: {sessionRuntimeMinutes} min.
            </p>
          </div>

          <div className="rounded-lg border border-white/10 bg-black/35 p-3.5">
            <div className="flex items-start gap-3">
              <MonitorPlay className="mt-0.5 h-4 w-4 shrink-0 text-cyan-300" />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-white">Watch Zone</h4>
                <p className="mt-1 text-xs leading-5 text-zinc-400">
                  Paste a legal watch or search URL. NexTrack will add it to the iframe and keep a tab link available if the provider blocks the frame.
                </p>
              </div>
            </div>

            <div className="mt-3 grid gap-2">
              <label className="grid gap-2 text-xs font-semibold uppercase tracking-wider text-zinc-500">
                URL
                <div className="flex min-w-0 items-center gap-2 rounded-md border border-white/10 bg-black/40 px-3 focus-within:border-cyan-300">
                  <Link2 className="h-4 w-4 shrink-0 text-zinc-500" />
                  <input
                    type="url"
                    value={watchUrl}
                    onChange={(event) => setWatchUrl(event.target.value)}
                    placeholder="https://www.crunchyroll.com/... or google.com/search?q=..."
                    className="h-10 min-w-0 flex-1 bg-transparent text-sm normal-case tracking-normal text-white outline-none placeholder:text-zinc-600"
                  />
                </div>
              </label>
              <div className="grid gap-2 sm:grid-cols-2">
                <button
                  onClick={() => startUrlHandoff(true)}
                  disabled={isPending}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md bg-cyan-300 px-3 text-xs font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <MonitorPlay className="h-3.5 w-3.5" />
                  Open zone
                </button>
                <button
                  onClick={() => startUrlHandoff(false)}
                  disabled={isPending}
                  className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Open tab
                </button>
              </div>
            </div>

            {embeddedUrl ? (
              <div className="mt-3 rounded-lg border border-white/10 bg-black">
                <div className="grid gap-3 border-b border-white/10 bg-black/70 p-3 lg:grid-cols-[1fr_1fr_auto]">
                  <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Width {iframeWidth}%
                    <input
                      type="range"
                      min={45}
                      max={100}
                      step={5}
                      value={iframeWidth}
                      onChange={(event) => setIframeWidth(clampNumber(Number(event.target.value), 45, 100))}
                      className="h-2 w-full accent-cyan-300"
                    />
                  </label>
                  <label className="grid gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-zinc-500">
                    Height {iframeHeight}px
                    <input
                      type="range"
                      min={260}
                      max={900}
                      step={20}
                      value={iframeHeight}
                      onChange={(event) => setIframeHeight(clampNumber(Number(event.target.value), 260, 900))}
                      className="h-2 w-full accent-cyan-300"
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <button
                      onClick={() => {
                        setIframeWidth(70);
                        setIframeHeight(420);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      aria-label="Make watch zone smaller"
                    >
                      <Minimize2 className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => {
                        setIframeWidth(100);
                        setIframeHeight(720);
                      }}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-300 transition hover:bg-white/10 hover:text-white"
                      aria-label="Make watch zone larger"
                    >
                      <Maximize2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
                <div className="overflow-auto bg-black p-2">
                  <div
                    className="mx-auto max-w-full resize overflow-hidden rounded-md border border-white/10 bg-black"
                    style={{
                      width: `${iframeWidth}%`,
                      height: iframeHeight,
                      minHeight: 260,
                      maxHeight: 900
                    }}
                  >
                    <iframe
                      src={embeddedUrl}
                      title={`${mediaTitle} watch zone`}
                      className="h-full w-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                      referrerPolicy="no-referrer-when-downgrade"
                      sandbox="allow-forms allow-popups allow-presentation allow-same-origin allow-scripts"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between gap-3 border-t border-white/10 bg-black/70 px-3 py-2">
                  <span className="min-w-0 truncate text-[11px] text-zinc-500">{activeWatchUrl}</span>
                  <a
                    href={activeWatchUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex shrink-0 items-center gap-1.5 text-[11px] font-semibold text-cyan-300 transition hover:text-cyan-200"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    Tab
                  </a>
                </div>
              </div>
            ) : null}

            {urlEpisodeHint && !isMovie ? (
              <p className="mt-2 flex items-center gap-1.5 text-xs text-emerald-300">
                <CheckCircle2 className="h-3.5 w-3.5" />
                URL episode detected: {urlEpisodeHint}
              </p>
            ) : null}
          </div>

          <div className="grid gap-3">
            {activeProviders.map((provider) => {
              const account = connections[provider.id];
              return (
                <button
                  key={provider.id}
                  onClick={() => startStreamingHandoff(provider)}
                  className={`group flex items-center justify-between rounded-lg border bg-black/40 p-3.5 text-left shadow-lg transition active:scale-98 ${provider.border} ${provider.glow} hover:bg-white/5`}
                >
                  <div className="flex min-w-0 items-center gap-3">
                    {provider.id === "google" ? (
                      <Globe2 className={`h-4 w-4 shrink-0 ${provider.iconColor}`} />
                    ) : provider.id === "crunchyroll" ? (
                      <Search className={`h-4 w-4 shrink-0 ${provider.iconColor}`} />
                    ) : (
                      <Tv className={`h-4 w-4 shrink-0 ${provider.iconColor}`} />
                    )}
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-bold text-white group-hover:underline">
                        {provider.id === "google" ? "Search" : "Open"} {selectedTargetLabel} on {provider.name}
                      </span>
                      {account ? (
                        <span className="mt-0.5 block text-[11px] text-emerald-300">
                          {account.autoSync ? "Auto-Sync ready" : "Manual sync profile"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 shrink-0 text-zinc-500 transition group-hover:text-white" />
                </button>
              );
            })}
          </div>

          {handoff ? (
            <div className="rounded-lg border border-cyan-300/25 bg-cyan-300/10 p-3.5">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-cyan-200" />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-white">
                    {handoff.platform.name} opened for {handoff.targetLabel}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-zinc-300">
                    NexTrack will auto-sync {handoff.targetLabel} when this runtime countdown reaches zero.
                  </p>
                </div>
              </div>
              <div className="mt-3 rounded-md border border-white/10 bg-black/30 p-3">
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <span className="flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                      <Clock className="h-3.5 w-3.5 text-cyan-200" />
                      Runtime countdown
                    </span>
                    <span className="mt-1 block font-mono text-2xl font-bold text-white">
                      {formatCountdown(timeLeft)}
                    </span>
                  </div>
                  <button
                    onClick={() => setIsPlaying((current) => !current)}
                    disabled={isPending || timeLeft <= 0}
                    className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-white/10 bg-white/5 text-zinc-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={isPlaying ? "Pause runtime countdown" : "Resume runtime countdown"}
                  >
                    {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                  </button>
                </div>
                <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-white/10">
                  <div
                    className="h-full rounded-full bg-cyan-300 transition-all duration-1000 ease-linear"
                    style={{ width: `${Math.min(100, ((handoff.durationSeconds - timeLeft) / handoff.durationSeconds) * 100)}%` }}
                  />
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  onClick={() => syncWatchedTarget(handoff)}
                  disabled={isPending}
                  className="rounded-md bg-cyan-300 px-3 py-2 text-xs font-semibold text-black transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  Sync now
                </button>
                <button
                  onClick={() => {
                    setHandoff(null);
                    setTimeLeft(0);
                    setIsPlaying(false);
                    setAutoSyncRequested(false);
                    setEmbeddedUrl("");
                    setActiveWatchUrl("");
                    setUrlEpisodeHint(undefined);
                  }}
                  disabled={isPending}
                  className="inline-flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-60"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              </div>
            </div>
          ) : null}

          {message ? (
            <div className="rounded-md border border-white/5 bg-white/[0.03] p-3 text-center text-xs text-zinc-300">
              {message}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-4 space-y-4">
          <div>
            <h3 className="flex items-center gap-2 font-display font-semibold text-white">
              <Zap className="h-4 w-4 text-cyan-300" />
              Sync Profiles
            </h3>
            <p className="mt-1 text-xs leading-5 text-zinc-400">
              Store provider profile labels locally and choose whether confirmations update NexTrack automatically.
            </p>
          </div>

          <div className="space-y-2">
            {accountProviders.map((provider) => {
              const account = connections[provider.id];
              const isEditing = editingPlatform === provider.id;

              return (
                <div key={provider.id} className="rounded-lg border border-white/10 bg-black/35 p-3.5">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-white">{provider.name}</span>
                      {account ? (
                        <span className="mt-0.5 block text-[11px] text-zinc-400">
                          Profile: <strong className="text-zinc-200">{account.username}</strong>{" "}
                          {account.autoSync ? "(Auto)" : "(Manual)"}
                        </span>
                      ) : (
                        <span className="mt-0.5 block text-[11px] text-zinc-500">No local profile label</span>
                      )}
                    </div>
                    {isEditing ? null : account ? (
                      <button
                        onClick={() => disconnectPlatform(provider.id)}
                        className="text-xs font-semibold text-red-400 transition hover:text-red-300"
                      >
                        Disconnect
                      </button>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingPlatform(provider.id);
                          setFormUsername("");
                          setFormAutoSync(true);
                        }}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-300 transition hover:text-cyan-200"
                      >
                        <Settings2 className="h-3.5 w-3.5" />
                        Configure
                      </button>
                    )}
                  </div>

                  {isEditing ? (
                    <div className="mt-3 space-y-3 border-t border-white/5 pt-3">
                      <label className="grid gap-1.5 text-xs text-zinc-300">
                        Profile username/email
                        <input
                          value={formUsername}
                          onChange={(event) => setFormUsername(event.target.value)}
                          placeholder="e.g. main profile"
                          className="h-9 rounded border border-white/10 bg-black/40 px-2.5 text-xs text-white outline-none focus:border-cyan-300"
                        />
                      </label>
                      <label className="flex cursor-pointer select-none items-center gap-2 text-xs text-zinc-300">
                        <input
                          type="checkbox"
                          checked={formAutoSync}
                          onChange={(event) => setFormAutoSync(event.target.checked)}
                          className="h-4 w-4 rounded border-white/10 bg-black/40 accent-cyan-300 focus:ring-0"
                        />
                        Auto-Sync confirmed watch targets
                      </label>
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setEditingPlatform(null)}
                          className="rounded border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs font-semibold text-zinc-400 transition hover:bg-white/10 hover:text-white"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => connectPlatform(provider.id)}
                          className="rounded bg-cyan-300 px-2.5 py-1.5 text-xs font-semibold text-black transition hover:bg-cyan-200"
                        >
                          Save Profile
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
