import type { MediaType, WatchStatus } from "@prisma/client";
import { prisma } from "@/lib/prisma";

const JIKAN_BASE = process.env.JIKAN_API_BASE ?? "https://api.jikan.moe/v4";
const TVMAZE_BASE = "https://api.tvmaze.com";

export type ReleaseCalendarItem = {
  mediaId: string;
  title: string;
  type: "Anime" | "Movie" | "TV Series";
  image?: string | null;
  href: string;
  badge: string;
  when: string;
  detail: string;
  sortTimestamp: number;
};

type TvMazeEpisodePayload = {
  name?: string;
  season?: number;
  number?: number;
  airdate?: string;
  airtime?: string;
  airstamp?: string;
};

type TvMazeShowPayload = {
  _embedded?: {
    nextepisode?: TvMazeEpisodePayload;
  };
};

type JikanAnimePayload = {
  data?: {
    airing?: boolean;
    status?: string;
    broadcast?: {
      day?: string | null;
      time?: string | null;
      timezone?: string | null;
      string?: string | null;
    };
  };
};

function formatAbsoluteDate(date: Date) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  }).format(date);
}

function parseTvMazeDate(episode: TvMazeEpisodePayload) {
  if (episode.airstamp) return new Date(episode.airstamp);
  if (episode.airdate) {
    const fallback = episode.airtime ? `${episode.airdate}T${episode.airtime}:00` : `${episode.airdate}T12:00:00`;
    const parsed = new Date(fallback);
    if (!Number.isNaN(parsed.getTime())) return parsed;
  }
  return null;
}

function weekdayIndex(day: string) {
  const values = ["sundays", "mondays", "tuesdays", "wednesdays", "thursdays", "fridays", "saturdays"];
  return values.indexOf(day.toLowerCase());
}

function nextWeekdayTimestamp(day: string) {
  const target = weekdayIndex(day);
  if (target < 0) return null;

  const now = new Date();
  const result = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 12, 0, 0));
  const current = result.getUTCDay();
  let delta = target - current;
  if (delta < 0) delta += 7;
  result.setUTCDate(result.getUTCDate() + delta);
  return result.getTime();
}

async function getTvMazeRelease(mediaId: string, sourceId: string, title: string, image?: string | null): Promise<ReleaseCalendarItem | null> {
  try {
    const response = await fetch(`${TVMAZE_BASE}/shows/${sourceId}?embed=nextepisode`, {
      next: { revalidate: 60 * 60 }
    });
    if (!response.ok) return null;
    const payload = await response.json() as TvMazeShowPayload;
    const episode = payload._embedded?.nextepisode;
    if (!episode) return null;

    const releaseDate = parseTvMazeDate(episode);
    if (!releaseDate) return null;

    const episodeCode = episode.season && episode.number
      ? `S${String(episode.season).padStart(2, "0")}E${String(episode.number).padStart(2, "0")}`
      : episode.number
        ? `Episode ${episode.number}`
        : "Next episode";

    return {
      mediaId,
      title,
      type: "TV Series",
      image,
      href: `/media/${mediaId}`,
      badge: "Next episode",
      when: formatAbsoluteDate(releaseDate),
      detail: `${episodeCode}${episode.name ? ` • ${episode.name}` : ""}`,
      sortTimestamp: releaseDate.getTime()
    };
  } catch {
    return null;
  }
}

async function getJikanRelease(mediaId: string, sourceId: string, title: string, image?: string | null): Promise<ReleaseCalendarItem | null> {
  try {
    const response = await fetch(`${JIKAN_BASE}/anime/${sourceId}/full`, {
      next: { revalidate: 60 * 60 * 6 }
    });
    if (!response.ok) return null;
    const payload = await response.json() as JikanAnimePayload;
    const anime = payload.data;
    const day = anime?.broadcast?.day?.trim();

    if (!anime?.airing || !day || day.toLowerCase() === "unknown") return null;

    const broadcastText = anime.broadcast?.string?.trim()
      || [day, anime.broadcast?.time, anime.broadcast?.timezone].filter(Boolean).join(" ");
    const sortTimestamp = nextWeekdayTimestamp(day);
    if (!sortTimestamp) return null;

    return {
      mediaId,
      title,
      type: "Anime",
      image,
      href: `/media/${mediaId}`,
      badge: "Weekly drop",
      when: broadcastText || `Every ${day}`,
      detail: anime.status || "Currently airing",
      sortTimestamp
    };
  } catch {
    return null;
  }
}

async function getReleaseForMedia(item: {
  mediaId: string;
  sourceId: string;
  source: string;
  type: MediaType;
  title: string;
  image?: string | null;
}) {
  if (item.source === "tvmaze" && item.type === "TV") {
    return getTvMazeRelease(item.mediaId, item.sourceId, item.title, item.image);
  }

  if (item.source === "jikan" && item.type === "ANIME") {
    return getJikanRelease(item.mediaId, item.sourceId, item.title, item.image);
  }

  return null;
}

export async function getReleaseCalendarForUser(userId: string, statuses: WatchStatus[] = ["WATCHING", "PLAN_TO_WATCH", "PAUSED"]) {
  const watchlist = await prisma.watchlist.findMany({
    where: {
      userId,
      status: { in: statuses }
    },
    include: { media: true },
    orderBy: { updatedAt: "desc" },
    take: 16
  });

  const items = await Promise.all(
    watchlist.map((entry) =>
      getReleaseForMedia({
        mediaId: entry.media.id,
        sourceId: entry.media.sourceId,
        source: entry.media.source,
        type: entry.media.type,
        title: entry.media.title,
        image: entry.media.posterUrl
      })
    )
  );

  return items
    .filter((item): item is ReleaseCalendarItem => Boolean(item))
    .sort((a, b) => a.sortTimestamp - b.sortTimestamp || a.title.localeCompare(b.title))
    .slice(0, 10);
}

export async function getReleaseCalendarFullForUser(userId: string, statuses: WatchStatus[] = ["WATCHING", "PLAN_TO_WATCH", "PAUSED"]) {
  const watchlist = await prisma.watchlist.findMany({
    where: {
      userId,
      status: { in: statuses }
    },
    include: { media: true },
    orderBy: { updatedAt: "desc" },
    take: 50
  });

  const items = await Promise.all(
    watchlist.map((entry) =>
      getReleaseForMedia({
        mediaId: entry.media.id,
        sourceId: entry.media.sourceId,
        source: entry.media.source,
        type: entry.media.type,
        title: entry.media.title,
        image: entry.media.posterUrl
      })
    )
  );

  return items
    .filter((item): item is ReleaseCalendarItem => Boolean(item))
    .sort((a, b) => a.sortTimestamp - b.sortTimestamp || a.title.localeCompare(b.title));
}
