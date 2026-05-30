import { AppShell } from "@/components/layout/app-shell";
import { ProgressCard } from "@/components/media/progress-card";
import { WatchlistManager } from "@/components/dashboard/watchlist-manager";
import { EmptyState } from "@/components/ui/empty-state";
import { StatCard } from "@/components/ui/stat-card";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { formatRuntimeHours, mediaTypeLabel, posterUrl, progressText, runtimeCoverageText, statusLabel, trackedRuntimeHours, watchedDurationText } from "@/lib/media-presenters";
import { prisma } from "@/lib/prisma";
import { calculateWatchStreak, dateValuesToDayKeys } from "@/lib/watch-streak";
import { CheckCircle2, Clock3, Library, ListPlus, PlayCircle, TrendingUp } from "lucide-react";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
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
  const watchActivities = session?.user?.id
    ? await prisma.watchActivity.findMany({
        where: { userId: session.user.id },
        select: { dayKey: true }
      })
    : [];
  const progressByMediaId = new Map(progress.map((item) => [item.mediaId, item]));
  const watchedHours = saved.reduce((sum, item) => sum + trackedRuntimeHours(item.media, progressByMediaId.get(item.media.id)), 0);
  const runtimeTitleCount = saved.filter((item) => {
    const itemProgress = progressByMediaId.get(item.media.id);
    return Boolean(item.media.runtimeMinutes && itemProgress && itemProgress.watchedCount > 0);
  }).length;
  const watchStreak = calculateWatchStreak([
    ...watchActivities.map((item) => item.dayKey),
    ...dateValuesToDayKeys(progress.map((item) => item.lastWatchedAt))
  ]);
  const completed = saved.filter((item) => item.status === "COMPLETED").length;
  const watching = saved.filter((item) => item.status === "WATCHING");
  const planned = saved.filter((item) => item.status === "PLAN_TO_WATCH").length;
  const completionRate = saved.length ? Math.round((completed / saved.length) * 100) : 0;
  const dashboardStats = [
    { label: "Saved titles", value: String(saved.length), detail: "From your watchlist", icon: Library, emphasis: "accent" as const },
    { label: "Watching", value: String(watching.length), detail: "Active titles", icon: PlayCircle },
    { label: "Watch streak", value: `${watchStreak}d`, detail: "Consecutive active days", icon: TrendingUp },
    {
      label: "Tracked time",
      value: formatRuntimeHours(watchedHours),
      detail: `${watchedDurationText(watchedHours)}. ${runtimeCoverageText(saved.length, runtimeTitleCount)}`,
      icon: Clock3,
      emphasis: "warm" as const
    },
    { label: "Completed", value: `${completionRate}%`, detail: `${completed}/${saved.length || 0} finished titles`, icon: CheckCircle2 },
    { label: "Planned", value: String(planned), detail: "Queued for later", icon: ListPlus }
  ];
  const continueItems = watching.map((item) => {
    const entry = progressByMediaId.get(item.media.id);
    return {
      id: item.media.id,
      title: item.media.title,
      type: mediaTypeLabel(item.media.type),
      progress: entry?.percentage ?? 0,
      meta: progressText(item.media, entry, item.status),
      image: posterUrl(item.media)
    };
  });
  const libraryItems = saved.map((item) => {
    const entry = progressByMediaId.get(item.media.id);
    return {
      mediaId: item.media.id,
      title: item.media.title,
      type: mediaTypeLabel(item.media.type),
      status: item.status,
      image: posterUrl(item.media),
      year: item.media.year,
      progressText: progressText(item.media, entry, item.status),
      progress: entry?.percentage ?? 0
    };
  });
  const statusCounts = ["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "PAUSED", "DROPPED"].map((status) => ({
    label: statusLabel(status as (typeof saved)[number]["status"]),
    count: saved.filter((item) => item.status === status).length
  }));
  const recentProgress = progress
    .filter((item) => item.lastWatchedAt)
    .sort((a, b) => Number(b.lastWatchedAt) - Number(a.lastWatchedAt))
    .slice(0, 5)
    .map((item) => {
      const media = saved.find((savedItem) => savedItem.media.id === item.mediaId)?.media;
      return media
        ? {
            id: media.id,
            title: media.title,
            detail: progressText(media, item)
          }
        : null;
    })
    .filter(Boolean);

  const allProgressItems = saved.map((item) => ({
    id: item.media.id,
    title: item.media.title,
    type: mediaTypeLabel(item.media.type),
    progress: progressByMediaId.get(item.media.id)?.percentage ?? 0,
    meta: progressText(item.media, progressByMediaId.get(item.media.id), item.status),
    image: posterUrl(item.media)
  }));

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <h1 className="font-display text-4xl font-semibold">Dashboard</h1>
        <p className="mt-2 text-sm text-zinc-400">Progress, statistics, weekly activity, and watch status.</p>

        <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
          {dashboardStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-display text-2xl font-semibold">Continue watching</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              {continueItems.length ? (
                continueItems.map((item) => <ProgressCard key={item.id} {...item} />)
              ) : (
                <EmptyState
                  title="Nothing active yet"
                  body="Open a title and save episode progress to start this list."
                  actionHref="/discover"
                  actionLabel="Find titles"
                  icon={PlayCircle}
                />
              )}
            </div>
          </section>
          <section className="rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-display text-2xl font-semibold">Library status</h2>
            <div className="mt-5 grid gap-3">
              {statusCounts.map((item) => (
                <div key={item.label} className="flex items-center justify-between rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm">
                  <span className="text-zinc-300">{item.label}</span>
                  <span className="font-semibold text-white">{item.count}</span>
                </div>
              ))}
            </div>
            <h3 className="mt-6 font-display text-xl font-semibold">Recent progress</h3>
            <div className="mt-3 grid gap-2">
              {recentProgress.length ? (
                recentProgress.map((item) => item ? (
                  <a key={item.id} href={`/media/${item.id}`} className="rounded-md border border-white/10 bg-black/20 px-3 py-2 text-sm text-zinc-300 hover:text-white">
                    <span className="block truncate font-medium">{item.title}</span>
                    <span className="text-xs text-zinc-500">{item.detail}</span>
                  </a>
                ) : null)
              ) : (
                <p className="rounded-md border border-white/10 bg-black/20 p-3 text-sm text-zinc-400">No progress saved yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="mt-6">
          <WatchlistManager initialItems={libraryItems} />
        </div>

        {allProgressItems.length > continueItems.length ? (
          <section className="mt-6 rounded-lg border border-white/10 bg-white/[0.04] p-5">
            <h2 className="font-display text-2xl font-semibold">All tracked progress</h2>
            <div className="mt-4 grid gap-4 lg:grid-cols-3">
              {allProgressItems.map((item) => <ProgressCard key={item.id} {...item} />)}
            </div>
          </section>
        ) : null}
      </main>
    </AppShell>
  );
}

