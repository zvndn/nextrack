import { AppShell } from "@/components/layout/app-shell";
import { TrackingControls } from "@/components/media/tracking-controls";
import { StreamingSync } from "@/components/media/streaming-sync";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { mediaTypeLabel, posterUrl } from "@/lib/media-presenters";
import { fetchJikanEpisodesCount, fetchTvMazeEpisodesCount } from "@/lib/media-sources";
import { prisma } from "@/lib/prisma";
import { Calendar, Clock, Database, Film, Info, Search, Star, Tag, Tv } from "lucide-react";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function MediaDetailPage({ params }: Props) {
  const { id } = await params;
  const [session, stored] = await Promise.all([
    auth(),
    prisma.media.findUnique({ where: { id } }).catch(() => null)
  ]);

  if (!stored) {
    return (
      <AppShell>
        <main className="px-4 py-6 md:px-8">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-6">
            <p className="text-sm text-cyan-200">Title not found</p>
            <h1 className="font-display mt-3 text-4xl font-semibold">This title is not in your library.</h1>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
              Search for the anime, movie, or TV series again and add it to your library before tracking progress.
            </p>
            <Button href="/discover" className="mt-5">
              <Search className="h-4 w-4" />
              Search titles
            </Button>
          </section>
        </main>
      </AppShell>
    );
  }

  const userMediaStatePromise = session?.user?.id
    ? Promise.all([
        prisma.progress.findUnique({
          where: { userId_mediaId: { userId: session.user.id, mediaId: stored.id } }
        }),
        prisma.watchlist.findUnique({
          where: { userId_mediaId: { userId: session.user.id, mediaId: stored.id } }
        }),
        prisma.favorite.findUnique({
          where: { userId_mediaId: { userId: session.user.id, mediaId: stored.id } }
        })
      ])
    : Promise.resolve([null, null, null] as const);

  const hasOutdatedEpisodeCount =
    stored.type !== "MOVIE" &&
    (!stored.episodesCount || stored.updatedAt.getTime() < Date.now() - 24 * 60 * 60 * 1000);
  const freshEpisodeCountPromise = hasOutdatedEpisodeCount
    ? stored.source === "jikan"
      ? fetchJikanEpisodesCount(stored.sourceId)
      : stored.source === "tvmaze"
        ? fetchTvMazeEpisodesCount(stored.sourceId)
        : Promise.resolve(undefined)
    : Promise.resolve(undefined);

  const [[progress, watchlist, favorite], fetchedEpisodesCount] = await Promise.all([
    userMediaStatePromise,
    freshEpisodeCountPromise
  ]);

  let episodesCount = stored.episodesCount ?? undefined;
  let updatedProgress = progress;

  if (fetchedEpisodesCount !== undefined && fetchedEpisodesCount !== stored.episodesCount) {
    episodesCount = fetchedEpisodesCount;
    try {
      await prisma.media.update({
        where: { id: stored.id },
        data: { episodesCount: fetchedEpisodesCount }
      });
      if (progress) {
        const nextProgress = await prisma.progress.update({
          where: { id: progress.id },
          data: {
            totalCount: fetchedEpisodesCount,
            percentage: fetchedEpisodesCount > 0 ? Math.min(100, Math.round((progress.watchedCount / fetchedEpisodesCount) * 100)) : 0
          }
        });
        updatedProgress = nextProgress;
      }
    } catch {
      // Ignore metadata refresh failures; the page can still render with cached data.
    }
  }

  const title = stored.title;
  const image = posterUrl(stored);
  const type = mediaTypeLabel(stored.type);
  const totalCount = stored.type === "MOVIE"
    ? 1
    : (updatedProgress?.totalCount && updatedProgress.totalCount > 0 ? updatedProgress.totalCount : (episodesCount ?? 0));

  const genres = Array.isArray(stored.genres) ? (stored.genres as string[]) : [];

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8 max-w-7xl mx-auto space-y-6">
        <section
          className="overflow-hidden rounded-xl border border-white/10 bg-cover bg-center shadow-2xl"
          style={{ backgroundImage: `url(${image})` }}
        >
          <div className="bg-gradient-to-t from-black/90 via-black/75 to-black/60 p-6 backdrop-blur-sm md:p-10">
            <div className="max-w-2xl">
              <p className="text-sm text-cyan-200 font-semibold tracking-wide uppercase">
                {type}{stored.year ? ` / ${stored.year}` : ""}
              </p>
              <h1 className="font-display mt-3 text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
                {title}
              </h1>
              <p className="mt-4 text-sm leading-6 text-zinc-300">
                {stored.overview ?? "Track progress, add to favorites, and keep this title organized in your library."}
              </p>
              <div className="mt-6">
                <TrackingControls
                  mediaId={stored.id}
                  mediaType={stored.type}
                  initialWatchedCount={progress?.watchedCount ?? 0}
                  totalCount={totalCount}
                  initialStatus={watchlist?.status ?? "PLAN_TO_WATCH"}
                  initialFavorite={Boolean(favorite)}
                />
              </div>
            </div>
          </div>
        </section>

        <div className="space-y-6">
          {/* Detailed Metadata/Info panel */}
          <div className="space-y-6">
            <div className="rounded-xl border border-white/10 bg-white/[var(--surface-alpha)] p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="font-display text-xl font-bold text-white mb-5 flex items-center gap-2">
                <Info className="h-5 w-5 text-cyan-300" />
                Media Details
              </h2>
              
              <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                    <Film className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Type</span>
                    <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">{type}</span>
                  </div>
                </div>

                {stored.rating ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                      <Star className="h-4 w-4 text-amber-400 fill-amber-400/20" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Score</span>
                      <span className="text-sm font-semibold text-cyan-300 mt-0.5 block">
                        {stored.rating.toFixed(1)} / 10
                      </span>
                    </div>
                  </div>
                ) : null}

                {stored.runtimeMinutes ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Runtime</span>
                      <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">{stored.runtimeMinutes} min</span>
                    </div>
                  </div>
                ) : null}

                {stored.type !== "MOVIE" && (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                      <Tv className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Episodes</span>
                      <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">
                        {totalCount > 0 ? totalCount : "Unknown"}
                      </span>
                    </div>
                  </div>
                )}

                {stored.year ? (
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                      <Calendar className="h-4 w-4" />
                    </div>
                    <div>
                      <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Release Year</span>
                      <span className="text-sm font-semibold text-zinc-200 mt-0.5 block">{stored.year}</span>
                    </div>
                  </div>
                ) : null}

                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded bg-white/5 p-1.5 text-zinc-400">
                    <Database className="h-4 w-4" />
                  </div>
                  <div>
                    <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold">Metadata Source</span>
                    <span className="text-xs font-semibold text-zinc-300 mt-0.5 block capitalize">
                      {stored.source} (ID: {stored.sourceId})
                    </span>
                  </div>
                </div>
              </div>

              {genres.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <span className="block text-xs uppercase tracking-wider text-zinc-500 font-semibold mb-3 flex items-center gap-1.5">
                    <Tag className="h-3.5 w-3.5 text-cyan-300" />
                    Genres
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {genres.map((genre) => (
                      <span
                        key={genre}
                        className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-zinc-300 hover:bg-white/10 transition cursor-default"
                      >
                        {genre}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Watch Zone and streaming sync controls */}
          <div className="space-y-6">
            <StreamingSync
              mediaId={stored.id}
              mediaTitle={stored.title}
              mediaType={stored.type}
              currentWatchedCount={progress?.watchedCount ?? 0}
              totalCount={totalCount}
              runtimeMinutes={stored.runtimeMinutes}
            />
          </div>
        </div>
      </main>
    </AppShell>
  );
}
