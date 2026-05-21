"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useRef, useState, useTransition } from "react";
import { BookmarkPlus, Calendar, Clock, Search, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { mediaResultKey, uniqueMediaResults, type ExternalMediaItem, type MediaSearchType } from "@/lib/media-sources";

export const searchFilters: { label: string; value: MediaSearchType }[] = [
  { label: "All", value: "all" },
  { label: "Anime", value: "anime" },
  { label: "Movies", value: "movie" },
  { label: "TV Series", value: "tv" }
];

export function SearchClient({ initialType = "all", initialQuery = "" }: { initialType?: MediaSearchType; initialQuery?: string }) {
  const [query, setQuery] = useState(initialQuery);
  const [type, setType] = useState<MediaSearchType>(initialType);
  const [results, setResults] = useState<ExternalMediaItem[]>([]);
  const [message, setMessage] = useState("");
  const [isPending, startTransition] = useTransition();
  const initialSearchRan = useRef(false);

  const [trending, setTrending] = useState<{ anime: ExternalMediaItem[]; movie: ExternalMediaItem[]; tv: ExternalMediaItem[] } | null>(null);
  const [loadingTrending, setLoadingTrending] = useState(false);
  const [selectedMedia, setSelectedMedia] = useState<ExternalMediaItem | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setSelectedMedia(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const closeModal = () => setSelectedMedia(null);
  const onOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      setSelectedMedia(null);
    }
  };

  useEffect(() => {
    if (query.trim()) return;
    setLoadingTrending(true);
    fetch("/api/trending")
      .then((res) => {
        if (!res.ok) throw new Error();
        return res.json();
      })
      .then((data) => {
        setTrending(data);
        setLoadingTrending(false);
      })
      .catch(() => {
        setLoadingTrending(false);
      });
  }, [query]);

  const runSearch = useCallback((nextQuery = query, nextType = type) => {
    setMessage("");
    if (nextQuery.trim().length < 2) {
      setResults([]);
      if (nextQuery.trim().length > 0) {
        setMessage("Type at least 2 characters to search.");
      }
      return;
    }

    startTransition(async () => {
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(nextQuery)}&type=${nextType}`);
        const payload = await response.json();

        if (!response.ok) {
          setResults([]);
          setMessage(payload.error ?? "Search failed. Try again.");
          return;
        }

        const nextResults = uniqueMediaResults(payload.results ?? []).filter((item) => item.image);
        setResults(nextResults);
        if (nextResults.length === 0) {
          setMessage("No image-backed anime, movie, or TV series results found. Try a more specific title.");
        }
      } catch {
        setResults([]);
        setMessage("Search is unavailable right now. Try again in a moment.");
      }
    });
  }, [query, type]);

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    runSearch();
  }

  useEffect(() => {
    if (initialSearchRan.current || initialQuery.trim().length < 2) return;
    initialSearchRan.current = true;
    runSearch(initialQuery, initialType);
  }, [initialQuery, initialType, runSearch]);

  async function addToWatchlist(media: ExternalMediaItem) {
    const response = await fetch("/api/watchlist", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ media, status: "PLAN_TO_WATCH" })
    });

    setMessage(response.ok ? `${media.title} added to your watchlist.` : "Sign in first to save this title.");
  }

  return (
    <section>
      <form onSubmit={onSubmit} className="flex flex-col gap-3 md:flex-row">
        <div className="flex h-11 flex-1 items-center gap-3 rounded-md border border-white/10 bg-white/[0.04] px-3">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search any anime, movie, or TV series"
            className="h-full flex-1 bg-transparent text-sm text-white outline-none placeholder:text-zinc-500"
          />
        </div>
        <Button type="submit" disabled={isPending}>{isPending ? "Searching..." : "Search"}</Button>
      </form>

      <div className="mt-4 flex flex-wrap gap-2">
        {searchFilters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => {
              setType(filter.value);
              runSearch(query, filter.value);
            }}
            className={`rounded-md border px-3 py-2 text-sm transition ${
              type === filter.value
                ? "border-cyan-300 bg-cyan-300 text-black"
                : "border-white/10 bg-white/[0.04] text-zinc-300 hover:bg-white/10"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {message ? <p className="mt-4 rounded-md border border-white/10 bg-white/[0.04] p-3 text-sm text-zinc-300">{message}</p> : null}

      {/* Loading Skeleton for Trending Items */}
      {!query && loadingTrending ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {["Trending Anime", "Trending Movies", "Trending TV Series"].map((title) => (
            <div key={title} className="space-y-4">
              <div>
                <h2 className="font-display text-xl font-semibold text-white">{title}</h2>
                <div className="mt-1 h-3 w-32 rounded bg-white/10 animate-pulse" />
              </div>
              <div className="space-y-3">
                {[1, 2, 3, 4, 5].map((row) => (
                  <div
                    key={row}
                    className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 animate-pulse"
                  >
                    <div className="h-16 w-11 rounded bg-white/10 flex-shrink-0" />
                    <div className="flex-1 flex flex-col justify-center gap-2">
                      <div className="h-4 w-3/4 rounded bg-white/10" />
                      <div className="h-3 w-1/2 rounded bg-white/10" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : null}

      {/* Trending Lists UI */}
      {!query && !loadingTrending && trending ? (
        <div className="mt-8 grid gap-6 md:grid-cols-3">
          {/* Column 1: Anime */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 text-white">Trending Anime</h2>
            <div className="space-y-3">
              {trending.anime.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 hover:border-cyan-300/40 transition cursor-pointer"
                >
                  <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-zinc-900">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] text-zinc-600">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h4 className="truncate text-sm font-semibold text-white" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {[item.year, item.genres?.[0]].filter(Boolean).join(" / ")}
                    </p>
                    {item.rating ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-200">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        {item.rating.toFixed(1)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWatchlist(item);
                    }}
                    className="self-center p-2 rounded-full hover:bg-white/10 text-cyan-200 transition"
                    title="Add to library"
                  >
                    <BookmarkPlus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 2: Movies */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 text-white">Trending Movies</h2>
            <div className="space-y-3">
              {trending.movie.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 hover:border-cyan-300/40 transition cursor-pointer"
                >
                  <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-zinc-900">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] text-zinc-600">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h4 className="truncate text-sm font-semibold text-white" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {[item.year, item.genres?.[0]].filter(Boolean).join(" / ")}
                    </p>
                    {item.rating ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-200">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        {item.rating.toFixed(1)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWatchlist(item);
                    }}
                    className="self-center p-2 rounded-full hover:bg-white/10 text-cyan-200 transition"
                    title="Add to library"
                  >
                    <BookmarkPlus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Column 3: TV Series */}
          <div>
            <h2 className="font-display text-xl font-semibold mb-4 text-white">Trending TV Series</h2>
            <div className="space-y-3">
              {trending.tv.map((item) => (
                <div
                  key={item.id}
                  onClick={() => setSelectedMedia(item)}
                  className="flex gap-3 rounded-lg border border-white/10 bg-white/[0.04] p-3 hover:border-cyan-300/40 transition cursor-pointer"
                >
                  <div className="relative h-16 w-11 flex-shrink-0 overflow-hidden rounded bg-zinc-900">
                    {item.image ? (
                      <Image src={item.image} alt={item.title} fill sizes="44px" className="object-cover" />
                    ) : (
                      <div className="grid h-full place-items-center text-[10px] text-zinc-600">No image</div>
                    )}
                  </div>
                  <div className="min-w-0 flex-1 flex flex-col justify-center">
                    <h4 className="truncate text-sm font-semibold text-white" title={item.title}>
                      {item.title}
                    </h4>
                    <p className="mt-1 text-xs text-zinc-400">
                      {[item.year, item.genres?.[0]].filter(Boolean).join(" / ")}
                    </p>
                    {item.rating ? (
                      <p className="mt-1 flex items-center gap-1 text-xs text-amber-200">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        {item.rating.toFixed(1)}
                      </p>
                    ) : null}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      addToWatchlist(item);
                    }}
                    className="self-center p-2 rounded-full hover:bg-white/10 text-cyan-200 transition"
                    title="Add to library"
                  >
                    <BookmarkPlus className="h-5 w-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}

      {results.length > 0 ? (
        <div className="mt-8">
          <div className="mb-4 flex items-end justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold text-white">Search results</h2>
              <p className="mt-1 text-sm text-zinc-500">Save titles to build your personal tracker.</p>
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {results.map((item, index) => (
              <article
                key={`${mediaResultKey(item)}-${index}`}
                onClick={() => setSelectedMedia(item)}
                className="grid grid-cols-[92px_1fr] gap-4 rounded-lg border border-white/10 bg-white/[0.04] p-3 hover:border-cyan-300/40 transition cursor-pointer"
              >
            <div className="relative h-32 overflow-hidden rounded-md bg-zinc-900">
              {item.image ? (
                <Image src={item.image} alt={item.title} fill sizes="92px" className="object-cover" />
              ) : (
                <div className="grid h-full place-items-center text-xs text-zinc-600">No image</div>
              )}
            </div>
            <div className="min-w-0">
              <div className="flex items-center justify-between gap-3">
                <span className="rounded bg-white/10 px-2 py-1 text-xs uppercase text-cyan-100">
                  {item.type === "tv" ? "TV Series" : item.type}
                </span>
                {item.rating ? (
                  <span className="flex items-center gap-1 text-xs text-amber-200">
                    <Star className="h-3 w-3 fill-amber-300" />
                    {item.rating.toFixed(1)}
                  </span>
                ) : null}
              </div>
              <h3 className="mt-3 line-clamp-2 font-semibold text-white">{item.title}</h3>
              <p className="mt-1 text-xs text-zinc-500">
                {[item.year ?? item.source.toUpperCase(), item.episodesCount ? `${item.episodesCount} episodes` : null]
                  .filter(Boolean)
                  .join(" / ")}
              </p>
              <p className="mt-2 line-clamp-2 text-sm text-zinc-400">{item.overview ?? "No overview available."}</p>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  addToWatchlist(item);
                }}
                className="mt-3 inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm text-white transition hover:bg-white/10"
              >
                <BookmarkPlus className="h-4 w-4" />
                Watchlist
              </button>
            </div>
              </article>
            ))}
          </div>
        </div>
      ) : null}

      {/* Media Detail Modal */}
      {selectedMedia ? (
        <div
          onClick={onOverlayClick}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-3 md:p-4 backdrop-blur-md animate-in fade-in duration-200"
        >
          <div className="relative w-full max-w-2xl max-h-[92vh] overflow-y-auto rounded-xl border border-white/10 bg-[#0b0f19] p-5 shadow-2xl backdrop-blur-2xl md:p-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={closeModal}
              className="absolute right-4 top-4 rounded-full p-2 text-zinc-400 hover:bg-white/10 hover:text-white transition z-10"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Modal Body */}
            <div className="grid gap-6 md:grid-cols-[180px_1fr]">
              {/* Poster Image */}
              <div className="relative mx-auto aspect-[3/4] w-full max-w-[140px] md:max-w-none overflow-hidden rounded-lg border border-white/10 bg-zinc-900 shadow-md">
                {selectedMedia.image ? (
                  <Image
                    src={selectedMedia.image}
                    alt={selectedMedia.title}
                    fill
                    sizes="(max-width: 768px) 140px, 180px"
                    className="object-cover"
                  />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-zinc-600">No image</div>
                )}
              </div>

              {/* Info Column */}
              <div className="flex flex-col min-w-0 justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase text-cyan-200">
                    <span className="rounded bg-cyan-300/10 px-2 py-0.5 border border-cyan-300/20">
                      {selectedMedia.type === "tv" ? "TV Series" : selectedMedia.type === "movie" ? "Movie" : "Anime"}
                    </span>
                    {selectedMedia.year ? (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Calendar className="h-3 w-3" />
                        {selectedMedia.year}
                      </span>
                    ) : null}
                    {selectedMedia.rating ? (
                      <span className="flex items-center gap-1 text-amber-200 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/20">
                        <Star className="h-3 w-3 fill-amber-300 text-amber-300" />
                        {selectedMedia.rating.toFixed(1)}
                      </span>
                    ) : null}
                    {selectedMedia.runtimeMinutes ? (
                      <span className="flex items-center gap-1 text-zinc-400">
                        <Clock className="h-3 w-3" />
                        {selectedMedia.runtimeMinutes} min
                      </span>
                    ) : null}
                    {selectedMedia.episodesCount ? (
                      <span className="text-zinc-400">
                        {selectedMedia.episodesCount} ep
                      </span>
                    ) : null}
                  </div>

                  <h3 className="mt-3 text-xl font-bold text-white leading-tight md:text-2xl">
                    {selectedMedia.title}
                  </h3>

                  {selectedMedia.genres && selectedMedia.genres.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {selectedMedia.genres.map((genre) => (
                        <span
                          key={genre}
                          className="rounded-full bg-white/5 border border-white/10 px-2 py-0.5 text-xs text-zinc-300"
                        >
                          {genre}
                        </span>
                      ))}
                    </div>
                  ) : null}

                  <div className="mt-4 max-h-36 md:max-h-48 overflow-y-auto pr-2 text-sm leading-relaxed text-zinc-300 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
                    {selectedMedia.overview ?? "No description available for this title."}
                  </div>
                </div>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      addToWatchlist(selectedMedia);
                      closeModal();
                    }}
                    className="flex h-11 flex-1 items-center justify-center gap-2 rounded-md bg-cyan-300 text-sm font-semibold text-black transition hover:bg-cyan-200 active:scale-95"
                  >
                    <BookmarkPlus className="h-5 w-5" />
                    Add to Watchlist
                  </button>
                  <button
                    onClick={closeModal}
                    className="flex h-11 items-center justify-center rounded-md border border-white/10 bg-white/5 px-6 text-sm font-semibold text-white transition hover:bg-white/10 active:scale-95"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
