import Image from "next/image";
import { AppShell } from "@/components/layout/app-shell";
import { MediaCard } from "@/components/media/media-card";
import { ProgressCard } from "@/components/media/progress-card";
import { Button } from "@/components/ui/button";
import { auth } from "@/lib/auth";
import { estimatedHours, mediaTypeLabel, posterUrl, progressText } from "@/lib/media-presenters";
import { prisma } from "@/lib/prisma";
import { BookmarkPlus, Heart, Plus, TrendingUp } from "lucide-react";

export default async function HomePage() {
  const session = await auth();
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          favorites: {
            include: { media: true },
            orderBy: { createdAt: "desc" }
          }
        }
      })
    : null;

  const saved = session?.user?.id
    ? await prisma.watchlist.findMany({
        where: { userId: session.user.id },
        include: { media: true },
        orderBy: { updatedAt: "desc" }
      })
    : [];

  const progress = session?.user?.id
    ? await prisma.progress.findMany({ where: { userId: session.user.id } })
    : [];

  const progressByMediaId = new Map(progress.map((item) => [item.mediaId, item]));

  const continueItems = saved
    .filter((item) => item.status === "WATCHING")
    .slice(0, 3)
    .map((item) => ({
      id: item.media.id,
      title: item.media.title,
      type: mediaTypeLabel(item.media.type),
      progress: progressByMediaId.get(item.media.id)?.percentage ?? 0,
      meta: progressText(item.media, progressByMediaId.get(item.media.id), item.status),
      image: posterUrl(item.media)
    }));

  const recentSaved = saved
    .slice(0, 4)
    .map((item) => ({
      id: item.media.id,
      title: item.media.title,
      type: mediaTypeLabel(item.media.type),
      rating: item.media.rating?.toFixed(1),
      genre: item.status.replaceAll("_", " "),
      image: posterUrl(item.media)
    }));

  const favoriteItems = user?.favorites.slice(0, 4).map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: mediaTypeLabel(item.media.type),
    rating: item.media.rating?.toFixed(1),
    genre: item.media.year ? String(item.media.year) : "Favorite",
    image: posterUrl(item.media)
  })) ?? [];

  const savedCount = saved.length;
  const completedCount = saved.filter((item) => item.status === "COMPLETED").length;
  const watchingCount = saved.filter((item) => item.status === "WATCHING").length;
  const watchedHours = saved.reduce((sum, item) => sum + estimatedHours(item.media, progressByMediaId.get(item.media.id)), 0);

  const stats = [
    { label: "Saved titles", value: String(savedCount), detail: "in your library" },
    { label: "Watching", value: String(watchingCount), detail: "active titles" },
    { label: "Completed", value: String(completedCount), detail: "finished titles" },
    { label: "Watched hours", value: `${Math.round(watchedHours)}h`, detail: "estimated from progress" }
  ];

  const heroMedia = saved[0]?.media;
  const heroStyle = heroMedia?.posterUrl
    ? {
        backgroundImage: `linear-gradient(120deg, rgba(0,0,0,0.2), rgba(0,0,0,0.6)), url(${heroMedia.posterUrl})`
      }
    : undefined;

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <section className="grid gap-6 xl:grid-cols-[1fr_340px]">
          <div className="space-y-6">
            <div
              className="overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] bg-cover bg-center"
              style={heroStyle}
            >
              <div className="bg-black/55 p-6 backdrop-blur-[1px] md:p-8">
                <div className="max-w-2xl">
                  <p className="text-sm font-medium text-cyan-200">
                    {heroMedia ? `Latest saved: ${heroMedia.title}` : user ? `Welcome back${user.name ? `, ${user.name}` : ""}` : "Build your media library"}
                  </p>
                  <h1 className="font-display mt-3 max-w-2xl text-4xl font-semibold leading-tight text-white md:text-6xl">
                    Track what you watch and pick up exactly where you stopped.
                  </h1>
                  <p className="mt-4 max-w-xl text-sm leading-6 text-zinc-200 md:text-base">
                    Save anime, movies, and TV series, update episode progress, and keep your watch status organized from one dashboard.
                  </p>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <Button href="/discover">
                      <Plus className="h-4 w-4" />
                      Add to library
                    </Button>
                    <Button href="/dashboard" variant="ghost">
                      <TrendingUp className="h-4 w-4" />
                      View dashboard
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
              {stats.map((stat) => (
                <article key={stat.label} className="rounded-lg border border-white/10 bg-white/[0.04] p-4">
                  <p className="text-xs uppercase text-zinc-500">{stat.label}</p>
                  <div className="mt-2 font-display text-3xl font-semibold text-white">{stat.value}</div>
                  <p className="mt-1 text-sm text-zinc-400">{stat.detail}</p>
                </article>
              ))}
            </div>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Continue watching</h2>
                  <p className="mt-1 text-sm text-zinc-500">Titles currently marked as watching.</p>
                </div>
                <Button href="/dashboard" variant="ghost">Manage</Button>
              </div>
              {continueItems.length ? (
                <div className="grid gap-4 lg:grid-cols-3">
                  {continueItems.map((item) => (
                    <ProgressCard key={item.id} {...item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
                  <p className="text-sm text-zinc-400">No active titles yet. Add something from Discover, then mark it as watching or save episode progress.</p>
                  <Button href="/discover" className="mt-4">
                    <BookmarkPlus className="h-4 w-4" />
                    Find something to watch
                  </Button>
                </div>
              )}
            </section>

            <section>
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h2 className="font-display text-2xl font-semibold">Recently saved</h2>
                  <p className="mt-1 text-sm text-zinc-500">The newest titles in your library.</p>
                </div>
                <Button href="/discover" variant="ghost">Search</Button>
              </div>
              {recentSaved.length ? (
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {recentSaved.map((item) => (
                    <MediaCard key={item.id} {...item} />
                  ))}
                </div>
              ) : (
                <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 text-sm text-zinc-400">
                  Your saved library will appear here after you add titles.
                </div>
              )}
            </section>
          </div>

          <aside className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-xl font-semibold">Profile</h2>
                <Heart className="h-5 w-5 text-rose-300" />
              </div>
              <div className="mt-5 flex items-center gap-4">
                <div className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-cyan-300 to-rose-300 text-xl font-black text-black">
                  {user?.image ? (
                    <Image src={user.image} alt={user.name ?? "Profile"} fill sizes="64px" className="object-cover" />
                  ) : (
                    (user?.name ?? "NT").slice(0, 2).toUpperCase()
                  )}
                </div>
                <div>
                  <div className="font-semibold text-white">{user?.username ?? user?.name ?? "Guest"}</div>
                  <div className="text-sm text-zinc-500">{savedCount} saved titles</div>
                  <div className="mt-2 flex gap-2 text-xs text-zinc-300">
                    <span className="rounded bg-white/10 px-2 py-1">{completedCount} completed</span>
                    <span className="rounded bg-white/10 px-2 py-1">{user?.favorites.length ?? 0} favorites</span>
                  </div>
                </div>
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
              <h2 className="font-display text-xl font-semibold">Favorites</h2>
              <div className="mt-4 grid gap-3">
                {favoriteItems.length ? (
                  favoriteItems.map((item) => (
                    <a key={item.id} href={`/media/${item.id}`} className="flex items-center gap-3 rounded-md border border-white/10 bg-black/20 p-2 text-sm text-zinc-300 hover:text-white">
                      {item.image ? (
                        <Image src={item.image} alt="" width={36} height={48} className="h-12 w-9 rounded object-cover" />
                      ) : (
                        <span className="grid h-12 w-9 place-items-center rounded bg-zinc-900 text-[10px] text-zinc-600">No image</span>
                      )}
                      <span className="line-clamp-2">{item.title}</span>
                    </a>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400">Favorite titles will show up here.</p>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>
    </AppShell>
  );
}
