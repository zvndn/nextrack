export type MediaSearchType = "anime" | "movie" | "tv" | "all";

export type ExternalMediaItem = {
  id: string;
  source: "jikan" | "tvmaze" | "wikipedia";
  type: "anime" | "movie" | "tv";
  title: string;
  overview?: string;
  image?: string;
  rating?: number;
  year?: number;
  genres?: string[];
  episodesCount?: number;
  seasonsCount?: number;
  runtimeMinutes?: number;
};

type JikanAnime = {
  mal_id: number;
  type?: string;
  title?: string;
  title_english?: string;
  synopsis?: string;
  images?: { jpg?: { image_url?: string; large_image_url?: string } };
  score?: number;
  year?: number;
  genres?: { name?: string }[];
  episodes?: number;
  duration?: string;
};

type TvMazeSearchResult = {
  show: {
    id: number;
    name: string;
    summary?: string;
    image?: { medium?: string; original?: string };
    rating?: { average?: number };
    premiered?: string;
    genres?: string[];
    runtime?: number;
    averageRuntime?: number;
  };
};

type WikipediaPage = {
  pageid: number;
  index?: number;
  title?: string;
  extract?: string;
  thumbnail?: { source?: string };
};

export function mediaResultKey(item: Pick<ExternalMediaItem, "source" | "type" | "id">) {
  return `${item.source}-${item.type}-${item.id}`;
}

export function uniqueMediaResults(items: ExternalMediaItem[]) {
  const seen = new Set<string>();

  return items.filter((item) => {
    const key = mediaResultKey(item);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function hasImage(item: ExternalMediaItem) {
  return Boolean(item.image?.startsWith("https://"));
}

function stripHtml(value?: string) {
  return value?.replace(/<[^>]+>/g, "").trim() || undefined;
}

async function safeSearch(search: () => Promise<ExternalMediaItem[]>) {
  try {
    return await search();
  } catch {
    return [];
  }
}

const JIKAN_BASE = process.env.JIKAN_API_BASE ?? "https://api.jikan.moe/v4";
const TVMAZE_BASE = "https://api.tvmaze.com";
const WIKIPEDIA_API = "https://en.wikipedia.org/w/api.php";

export async function fetchJikanEpisodesCount(malId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`${JIKAN_BASE}/anime/${malId}/episodes`, {
      next: { revalidate: 60 * 60 * 12 }
    });
    if (!res.ok) return undefined;
    const payload = await res.json();
    const lastPage = payload.pagination?.last_visible_page || 1;
    if (lastPage > 1) {
      const lastPageRes = await fetch(`${JIKAN_BASE}/anime/${malId}/episodes?page=${lastPage}`, {
        next: { revalidate: 60 * 60 * 12 }
      });
      if (lastPageRes.ok) {
        const lastPagePayload = await lastPageRes.json();
        const data = lastPagePayload.data || [];
        if (data.length > 0) {
          const lastEp = data[data.length - 1];
          if (lastEp && typeof lastEp.mal_id === "number") {
            return lastEp.mal_id;
          }
        }
      }
    }
    const data = payload.data || [];
    if (data.length > 0) {
      return data[data.length - 1].mal_id;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function fetchTvMazeEpisodesCount(showId: string): Promise<number | undefined> {
  try {
    const res = await fetch(`${TVMAZE_BASE}/shows/${showId}/episodes`, {
      next: { revalidate: 60 * 60 * 24 }
    });
    if (!res.ok) return undefined;
    const payload = await res.json();
    if (Array.isArray(payload)) {
      return payload.length;
    }
    return undefined;
  } catch {
    return undefined;
  }
}

export async function searchAnime(query: string): Promise<ExternalMediaItem[]> {
  if (!query.trim()) return [];

  const response = await fetch(`${JIKAN_BASE}/anime?q=${encodeURIComponent(query)}&limit=12`, {
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as { data?: JikanAnime[] };

  const allowedAnimeKinds = new Set(["TV", "Movie", "OVA", "ONA", "Special"]);
  const rawItems = (payload.data ?? [])
    .filter((item) => item.type !== undefined && allowedAnimeKinds.has(item.type) && Boolean(item.title_english || item.title));

  const mappedItems = await Promise.all(
    rawItems.map(async (item): Promise<ExternalMediaItem> => {
      let episodesCount = Number(item.episodes) || undefined;
      if (!episodesCount && item.type !== "Movie") {
        episodesCount = await fetchJikanEpisodesCount(String(item.mal_id));
      }

      return {
        id: String(item.mal_id),
        source: "jikan" as const,
        type: "anime" as const,
        title: item.title_english || item.title || "Untitled anime",
        overview: item.synopsis,
        image: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url,
        rating: item.score,
        year: item.year,
        genres: item.genres?.map((genre) => genre.name).filter((name): name is string => Boolean(name)) ?? [],
        episodesCount,
        runtimeMinutes: Number(item.duration?.match(/\d+/)?.[0]) || undefined
      };
    })
  );

  return mappedItems.filter(hasImage).slice(0, 12);
}

export async function searchTvSeries(query: string): Promise<ExternalMediaItem[]> {
  if (!query.trim()) return [];

  const response = await fetch(`${TVMAZE_BASE}/search/shows?q=${encodeURIComponent(query)}`, {
    next: { revalidate: 60 * 60 }
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as TvMazeSearchResult[];

  const rawShows = payload.slice(0, 15);

  const mappedShows = await Promise.all(
    rawShows.map(async (result): Promise<ExternalMediaItem> => {
      const show = result.show;
      const episodesCount = await fetchTvMazeEpisodesCount(String(show.id));
      return {
        id: String(show.id),
        source: "tvmaze" as const,
        type: "tv" as const,
        title: show.name,
        overview: stripHtml(show.summary),
        image: show.image?.original ?? show.image?.medium,
        rating: show.rating?.average,
        year: Number(show.premiered?.slice(0, 4)) || undefined,
        genres: show.genres ?? [],
        runtimeMinutes: Number(show.averageRuntime ?? show.runtime) || undefined,
        episodesCount
      };
    })
  );

  return mappedShows.filter(hasImage).slice(0, 12);
}

function isMoviePage(item: WikipediaPage, query: string) {
  const title = String(item.title ?? "").toLowerCase();
  const extract = String(item.extract ?? "").toLowerCase();
  const firstSentence = extract.split(".")[0] ?? "";
  const normalizedQuery = query.toLowerCase().trim();
  const blocked = [
    "soundtrack",
    "franchise",
    "character",
    "filmmaker",
    "actor",
    "actress",
    "director",
    "producer",
    "cinematographer",
    "screenwriter",
    "album",
    "song",
    "novel",
    "video game",
    "television series",
    "visual effect",
    "religion",
    "inspired by",
    "production of",
    "making of"
  ];
  const looksLikeFilm =
    /\bis (a|an|the)?\s*(\d{4}\s*)?[\w\s-]*(film|movie)\b/.test(firstSentence) ||
    /\bare (a|an|the)?\s*(\d{4}\s*)?[\w\s-]*(film|movie)\b/.test(firstSentence) ||
    title.includes("(film)");

  if (!item.thumbnail?.source?.startsWith("https://")) return false;
  if (blocked.some((word) => title.includes(word) || firstSentence.includes(word))) return false;
  if (normalizedQuery && !title.includes(normalizedQuery) && !firstSentence.includes(normalizedQuery)) return false;

  return looksLikeFilm;
}

export async function searchMovies(query: string): Promise<ExternalMediaItem[]> {
  if (!query.trim()) return [];

  const params = new URLSearchParams({
    action: "query",
    generator: "search",
    gsrsearch: `${query} film`,
    gsrlimit: "30",
    prop: "pageimages|extracts",
    exintro: "1",
    explaintext: "1",
    pithumbsize: "600",
    pilicense: "any",
    format: "json",
    origin: "*"
  });
  const response = await fetch(`${WIKIPEDIA_API}?${params.toString()}`, {
    next: { revalidate: 60 * 60 * 12 }
  });

  if (!response.ok) return [];
  const payload = (await response.json()) as { query?: { pages?: Record<string, WikipediaPage> } };
  const pages = Object.values(payload.query?.pages ?? {});

  return pages
    .sort((a, b) => (a.index ?? 99) - (b.index ?? 99))
    .filter((item) => isMoviePage(item, query))
    .map((item): ExternalMediaItem => ({
      id: String(item.pageid),
      source: "wikipedia" as const,
      type: "movie" as const,
      title: item.title ?? "Untitled movie",
      overview: item.extract,
      image: item.thumbnail?.source,
      year: Number(item.extract?.match(/\b(19|20)\d{2}\b/)?.[0]) || undefined,
      genres: []
    }))
    .slice(0, 12);
}

export async function searchMedia(query: string, type: MediaSearchType = "all") {
  const tasks: Promise<ExternalMediaItem[]>[] = [];
  if (type === "all" || type === "anime") tasks.push(safeSearch(() => searchAnime(query)));
  if (type === "all" || type === "movie") tasks.push(safeSearch(() => searchMovies(query)));
  if (type === "all" || type === "tv") tasks.push(safeSearch(() => searchTvSeries(query)));

  return uniqueMediaResults((await Promise.all(tasks)).flat()).filter(hasImage);
}

export async function getTrendingMedia(): Promise<{
  anime: ExternalMediaItem[];
  movie: ExternalMediaItem[];
  tv: ExternalMediaItem[];
}> {
  // 1. Fetch Jikan top anime
  const fetchTopAnime = async () => {
    try {
      const res = await fetch(`${JIKAN_BASE}/top/anime?limit=5`, {
        next: { revalidate: 60 * 60 * 24 }
      });
      if (!res.ok) return [];
      const payload = await res.json();
      return (payload.data ?? []).slice(0, 5).map((item: JikanAnime): ExternalMediaItem => ({
        id: String(item.mal_id),
        source: "jikan" as const,
        type: "anime" as const,
        title: item.title_english || item.title || "Untitled anime",
        overview: item.synopsis,
        image: item.images?.jpg?.large_image_url ?? item.images?.jpg?.image_url,
        rating: item.score,
        year: item.year,
        genres: item.genres?.map((g) => g.name).filter((name): name is string => Boolean(name)) ?? [],
        episodesCount: item.episodes
      }));
    } catch {
      return [];
    }
  };

  // 2. Fetch TVMaze shows from today's schedule sorted by weight
  const fetchTopTv = async () => {
    try {
      const res = await fetch(`${TVMAZE_BASE}/schedule?country=US`, {
        next: { revalidate: 60 * 60 * 12 }
      });
      if (!res.ok) return [];
      const episodes = await res.json();
      if (!Array.isArray(episodes)) return [];

      const seen = new Set<number>();
      const shows: ExternalMediaItem[] = [];

      const sortedEpisodes = [...episodes].sort((a: { show?: { weight?: number } }, b: { show?: { weight?: number } }) => {
        const weightA = a.show?.weight ?? 0;
        const weightB = b.show?.weight ?? 0;
        return weightB - weightA;
      });

      for (const ep of sortedEpisodes) {
        const show = ep.show;
        if (!show || !show.id || !show.image) continue;
        if (seen.has(show.id)) continue;
        seen.add(show.id);

        shows.push({
          id: String(show.id),
          source: "tvmaze" as const,
          type: "tv" as const,
          title: show.name,
          overview: stripHtml(show.summary),
          image: show.image?.original ?? show.image?.medium,
          rating: show.rating?.average,
          year: Number(show.premiered?.slice(0, 4)) || undefined,
          genres: show.genres ?? [],
          runtimeMinutes: Number(show.averageRuntime ?? show.runtime) || undefined
        });

        if (shows.length >= 5) break;
      }
      return shows;
    } catch {
      return [];
    }
  };

  // 3. Search Wikipedia for movies from the current and previous year
  const fetchTopMovies = async () => {
    try {
      const currentYear = new Date().getFullYear();
      const resultsCurrent = await searchMovies(String(currentYear));
      const resultsPrev = await searchMovies(String(currentYear - 1));
      const combined = uniqueMediaResults([...resultsCurrent, ...resultsPrev]);
      return combined.slice(0, 5);
    } catch {
      return [];
    }
  };

  const [anime, tv, movie] = await Promise.all([
    fetchTopAnime(),
    fetchTopTv(),
    fetchTopMovies()
  ]);

  return { anime, tv, movie };
}

