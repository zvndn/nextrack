import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Award, CheckCircle2, Clock3, ExternalLink, Flame, Heart, LogOut, MapPin, Target, Trophy, UserRoundCheck, Zap } from "lucide-react";
import { AppShell } from "@/components/layout/app-shell";
import { MediaCard } from "@/components/media/media-card";
import { ProgressCard } from "@/components/media/progress-card";
import { Button } from "@/components/ui/button";
import { auth, signOut } from "@/lib/auth";
import { estimatedHours, mediaTypeLabel, posterUrl, progressText } from "@/lib/media-presenters";
import { prisma } from "@/lib/prisma";

function genreList(value: unknown) {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string" && item.length > 0) : [];
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const user = session?.user?.id
    ? await prisma.user.findUnique({
        where: { id: session.user.id },
        include: {
          favorites: { include: { media: true }, orderBy: { createdAt: "desc" } },
          watchlists: { include: { media: true }, orderBy: { updatedAt: "desc" } },
          progress: { include: { media: true }, orderBy: { updatedAt: "desc" } },
          reviews: true
        }
      })
    : null;

  const saved = user?.watchlists ?? [];
  const progress = user?.progress ?? [];
  const favorites = user?.favorites ?? [];
  const progressByMediaId = new Map(progress.map((item) => [item.mediaId, item]));
  const completedCount = saved.filter((item) => item.status === "COMPLETED").length;
  const watching = saved.filter((item) => item.status === "WATCHING");
  const watchedHours = saved.reduce((sum, item) => sum + estimatedHours(item.media, progressByMediaId.get(item.media.id)), 0);
  const averageProgress = saved.length
    ? Math.round(saved.reduce((sum, item) => sum + (progressByMediaId.get(item.media.id)?.percentage ?? 0), 0) / saved.length)
    : 0;
  const profileComplete = Boolean(user?.name && user.username && user.bio && user.image);
  const typeCounts = [
    { label: "Anime", count: saved.filter((item) => item.media.type === "ANIME").length },
    { label: "Movies", count: saved.filter((item) => item.media.type === "MOVIE").length },
    { label: "TV Series", count: saved.filter((item) => item.media.type === "TV").length }
  ];
  const topGenres = Object.entries(
    saved.reduce<Record<string, number>>((counts, item) => {
      for (const genre of genreList(item.media.genres)) counts[genre] = (counts[genre] ?? 0) + 1;
      return counts;
    }, {})
  )
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5);

  const achievements = [
    {
      label: "First save",
      detail: "Added a title to the library.",
      earned: saved.length > 0,
      icon: Award
    },
    {
      label: "Collector",
      detail: "Build a library of 10 saved titles.",
      earned: saved.length >= 10,
      progress: Math.min(saved.length, 10),
      total: 10,
      icon: Trophy
    },
    {
      label: "Favorites shelf",
      detail: "Mark 3 titles as favorites.",
      earned: favorites.length >= 3,
      progress: Math.min(favorites.length, 3),
      total: 3,
      icon: Heart
    },
    {
      label: "Profile ready",
      detail: "Add name, username, bio, and avatar.",
      earned: profileComplete,
      icon: UserRoundCheck
    },
    // Completed Scaled Achievements
    {
      label: "Finisher",
      detail: "Complete your first title.",
      earned: completedCount > 0,
      icon: CheckCircle2
    },
    {
      label: "Completionist",
      detail: "Complete 5 titles in your library.",
      earned: completedCount >= 5,
      progress: Math.min(completedCount, 5),
      total: 5,
      icon: Award
    },
    {
      label: "Master Tracker",
      detail: "Complete 20 titles in your library.",
      earned: completedCount >= 20,
      progress: Math.min(completedCount, 20),
      total: 20,
      icon: Trophy
    },
    // Hours Watch Scaled Achievements
    {
      label: "Cinephile",
      detail: "Watch 10 hours of content.",
      earned: watchedHours >= 10,
      progress: Math.min(Math.round(watchedHours), 10),
      total: 10,
      icon: Clock3
    },
    {
      label: "Marathoner",
      detail: "Watch 50 hours of content.",
      earned: watchedHours >= 50,
      progress: Math.min(Math.round(watchedHours), 50),
      total: 50,
      icon: Zap
    },
    {
      label: "True Fan",
      detail: "Watch 200 hours of content.",
      earned: watchedHours >= 200,
      progress: Math.min(Math.round(watchedHours), 200),
      total: 200,
      icon: Flame
    }
  ];
  const earnedAchievements = achievements.filter((item) => item.earned).length;

  const objectives = [
    !saved.length
      ? { label: "Add your first title", detail: "Start your tracker by saving an anime, movie, or TV series.", href: "/discover" }
      : null,
    watching[0]
      ? {
          label: `Continue ${watching[0].media.title}`,
          detail: progressText(watching[0].media, progressByMediaId.get(watching[0].media.id), watching[0].status),
          href: `/media/${watching[0].media.id}`
        }
      : null,
    saved.length && !completedCount
      ? { label: "Complete one title", detail: "Finish a saved title to unlock your first completion achievement.", href: "/dashboard" }
      : null,
    saved.length && !favorites.length
      ? { label: "Pick a favorite", detail: "Favorite a title so your profile reflects your taste.", href: `/media/${saved[0].media.id}` }
      : null,
    !profileComplete
      ? { label: "Complete profile details", detail: "Add a bio and avatar so your profile feels finished.", href: "/settings" }
      : null
  ].filter((item): item is { label: string; detail: string; href: string } => Boolean(item));

  const favoriteCards = favorites.slice(0, 4).map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: mediaTypeLabel(item.media.type),
    rating: item.media.rating?.toFixed(1),
    genre: item.media.year ? String(item.media.year) : "Favorite",
    image: posterUrl(item.media)
  }));
  const recentCards = saved.slice(0, 4).map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: mediaTypeLabel(item.media.type),
    rating: item.media.rating?.toFixed(1),
    genre: progressText(item.media, progressByMediaId.get(item.media.id), item.status),
    image: posterUrl(item.media)
  }));
  const activeProgress = watching.slice(0, 3).map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: mediaTypeLabel(item.media.type),
    progress: progressByMediaId.get(item.media.id)?.percentage ?? 0,
    meta: progressText(item.media, progressByMediaId.get(item.media.id), item.status),
    image: posterUrl(item.media)
  }));
  const recentActivity = progress
    .filter((item) => item.lastWatchedAt)
    .slice(0, 5)
    .map((item) => ({
      id: item.media.id,
      title: item.media.title,
      detail: progressText(item.media, item),
      date: item.lastWatchedAt?.toLocaleDateString("en", { month: "short", day: "numeric" })
    }));

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <section className="overflow-hidden rounded-lg border border-white/10 bg-white/[var(--surface-alpha)]">
          <div className="grid gap-6 p-6 lg:grid-cols-[1fr_320px]">
            <div className="flex flex-col gap-5 md:flex-row md:items-center">
              <div className="relative flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-cyan-300 to-rose-300 text-3xl font-black text-black">
                {user?.image ? (
                  <Image src={user.image} alt={user.name ?? "Profile"} fill sizes="112px" className="object-cover" />
                ) : (
                  (user?.name ?? "NT").slice(0, 2).toUpperCase()
                )}
              </div>
              <div className="min-w-0">
                <p className="text-sm text-cyan-200">{user?.username ? `@${user.username}` : "Guest profile"}</p>
                <h1 className="font-display mt-1 text-4xl font-semibold text-white">{user?.name ?? user?.username ?? "Guest profile"}</h1>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  {user?.bio ?? "Your profile becomes more useful as you save titles, track progress, and mark favorites."}
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-sm text-zinc-300">
                  {user?.location ? (
                    <span className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2">
                      <MapPin className="h-4 w-4 text-cyan-200" />
                      {user.location}
                    </span>
                  ) : null}
                  {user?.website ? (
                    <a href={user.website} className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-black/20 px-3 py-2 hover:text-white">
                      <ExternalLink className="h-4 w-4 text-cyan-200" />
                      Website
                    </a>
                  ) : null}
                  <Button href="/settings" variant="ghost">Edit profile</Button>
                  <form
                    action={async () => {
                      "use server";
                      await signOut({ redirectTo: "/login" });
                    }}
                    className="inline-block"
                  >
                    <button
                      type="submit"
                      className="inline-flex h-9 items-center gap-2 rounded-md border border-white/10 bg-white/5 px-3 text-sm font-medium text-zinc-300 transition hover:border-red-500/30 hover:bg-red-500/10 hover:text-red-200"
                    >
                      <LogOut className="h-4 w-4" />
                      Disconnect / Change account
                    </button>
                  </form>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Saved", value: saved.length },
                { label: "Completed", value: completedCount },
                { label: "Favorites", value: favorites.length },
                { label: "Hours", value: Math.round(watchedHours) }
              ].map((stat) => (
                <div key={stat.label} className="rounded-lg border border-white/10 bg-black/20 p-4">
                  <p className="text-xs uppercase text-zinc-500">{stat.label}</p>
                  <p className="font-display mt-2 text-3xl font-semibold text-white">{stat.value}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h2 className="font-display text-2xl font-semibold">Achievements</h2>
                <p className="mt-1 text-sm text-zinc-500">{earnedAchievements} of {achievements.length} unlocked</p>
              </div>
              <Trophy className="h-6 w-6 text-cyan-200" />
            </div>
            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {achievements.map((achievement) => (
                <article key={achievement.label} className={`rounded-lg border p-4 ${achievement.earned ? "border-cyan-300/50 bg-cyan-300/10" : "border-white/10 bg-black/20"}`}>
                  <div className="flex items-start gap-3">
                    <span className={`grid h-10 w-10 place-items-center rounded-md ${achievement.earned ? "bg-cyan-300 text-slate-950" : "bg-white/10 text-zinc-400"}`}>
                      <achievement.icon className="h-5 w-5" />
                    </span>
                    <div className="min-w-0">
                      <h3 className="font-semibold text-white">{achievement.label}</h3>
                      <p className="mt-1 text-sm text-zinc-400">{achievement.detail}</p>
                      {achievement.total ? (
                        <p className="mt-2 text-xs text-zinc-500">{achievement.progress}/{achievement.total}</p>
                      ) : null}
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
              <div className="flex items-center justify-between">
                <h2 className="font-display text-2xl font-semibold">Objectives</h2>
                <Target className="h-5 w-5 text-cyan-200" />
              </div>
              <div className="mt-4 grid gap-3">
                {objectives.length ? (
                  objectives.slice(0, 4).map((objective) => (
                    <Link key={objective.label} href={objective.href} className="rounded-lg border border-white/10 bg-black/20 p-3 transition hover:border-cyan-300/40">
                      <span className="font-semibold text-white">{objective.label}</span>
                      <span className="mt-1 block text-sm text-zinc-400">{objective.detail}</span>
                    </Link>
                  ))
                ) : (
                  <p className="rounded-lg border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">
                    No urgent objectives. Keep tracking titles as you watch.
                  </p>
                )}
              </div>
            </section>

            <section className="rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
              <h2 className="font-display text-2xl font-semibold">Library mix</h2>
              <div className="mt-4 grid gap-3">
                {typeCounts.map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-sm">
                      <span className="text-zinc-300">{item.label}</span>
                      <span className="text-white">{item.count}</span>
                    </div>
                    <div className="mt-2 h-2 rounded-full bg-white/10">
                      <div className="h-2 rounded-full bg-cyan-300" style={{ width: saved.length ? `${(item.count / saved.length) * 100}%` : "0%" }} />
                    </div>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm text-zinc-400">Average library progress: {averageProgress}%</p>
            </section>
          </aside>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_360px]">
          <section className="rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-display text-2xl font-semibold">Continue watching</h2>
              <Clock3 className="h-5 w-5 text-cyan-200" />
            </div>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {activeProgress.length ? (
                activeProgress.map((item) => <ProgressCard key={item.id} {...item} />)
              ) : (
                <div className="rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-zinc-400 lg:col-span-3">
                  Nothing is marked as watching right now.
                </div>
              )}
            </div>
          </section>

          <section className="rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
            <h2 className="font-display text-2xl font-semibold">Recent activity</h2>
            <div className="mt-4 grid gap-2">
              {recentActivity.length ? (
                recentActivity.map((item) => (
                  <Link key={item.id} href={`/media/${item.id}`} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm hover:border-cyan-300/40">
                    <span className="block truncate font-medium text-white">{item.title}</span>
                    <span className="text-xs text-zinc-500">{item.detail}{item.date ? ` / ${item.date}` : ""}</span>
                  </Link>
                ))
              ) : (
                <p className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No recent progress yet.</p>
              )}
            </div>
          </section>
        </div>

        <section className="mt-6 rounded-lg border border-white/10 bg-white/[var(--surface-alpha)] p-5">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <h2 className="font-display text-2xl font-semibold">Taste profile</h2>
              <p className="mt-1 text-sm text-zinc-500">
                Top genres and favorite titles based on your library.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {topGenres.length ? topGenres.map(([genre, count]) => (
                <span key={genre} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300">
                  {genre} ({count})
                </span>
              )) : <span className="text-sm text-zinc-500">Add titles with genres to build this section.</span>}
            </div>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4">
            {(favoriteCards.length ? favoriteCards : recentCards).length ? (
              (favoriteCards.length ? favoriteCards : recentCards).map((item) => <MediaCard key={item.id} {...item} />)
            ) : (
              <div className="col-span-full rounded-lg border border-white/10 bg-black/20 p-5 text-sm text-zinc-400">
                Save titles and mark favorites to build your taste profile.
              </div>
            )}
          </div>
        </section>
      </main>
    </AppShell>
  );
}
