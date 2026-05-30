import { notFound } from "next/navigation";
import { AppShell } from "@/components/layout/app-shell";
import { Button } from "@/components/ui/button";
import { SharedWatchlistList } from "@/components/watchlist/shared-watchlist-list";
import { mediaTypeLabel, posterUrl, progressText, statusLabel } from "@/lib/media-presenters";
import { prisma } from "@/lib/prisma";

export default async function SharedWatchlistPage({
  params
}: {
  params: Promise<{ shareId: string }>;
}) {
  const { shareId } = await params;
  const owner = await prisma.user.findFirst({
    where: {
      watchlistShareId: shareId,
      watchlistPublic: true
    },
    select: {
      name: true,
      username: true,
      watchlists: {
        include: { media: true },
        orderBy: { updatedAt: "desc" }
      },
      progress: true
    }
  });

  if (!owner) notFound();

  const progressByMediaId = new Map(owner.progress.map((item) => [item.mediaId, item]));
  const displayName = owner.name || owner.username || "NexTrack user";
  const statusCounts = ["WATCHING", "PLAN_TO_WATCH", "COMPLETED", "PAUSED", "DROPPED"].map((status) => ({
    label: statusLabel(status as (typeof owner.watchlists)[number]["status"]),
    count: owner.watchlists.filter((item) => item.status === status).length
  }));
  const items = owner.watchlists.map((item) => {
    const entry = progressByMediaId.get(item.media.id);
    return {
      id: item.id,
      mediaId: item.media.id,
      title: item.media.title,
      type: mediaTypeLabel(item.media.type),
      status: item.status,
      statusLabel: statusLabel(item.status),
      image: posterUrl(item.media),
      year: item.media.year,
      progressText: progressText(item.media, entry, item.status),
      progress: entry?.percentage ?? 0
    };
  });

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-cyan-200">Shared watchlist</p>
            <h1 className="page-title mt-2 font-display text-4xl font-semibold">{displayName}&apos;s watchlist</h1>
            <p className="mt-2 text-sm text-zinc-400">{owner.watchlists.length} public titles from their current library.</p>
          </div>
          <Button href="/discover" variant="ghost">Discover titles</Button>
        </div>

        <section className="panel mt-6 rounded-lg p-5">
          <h2 className="font-display text-2xl font-semibold">Status summary</h2>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statusCounts.map((item) => (
              <div key={item.label} className="rounded-md border border-white/10 bg-black/20 px-3 py-3">
                <p className="text-xs text-zinc-500">{item.label}</p>
                <p className="mt-1 text-2xl font-semibold text-white">{item.count}</p>
              </div>
            ))}
          </div>
        </section>

        <SharedWatchlistList items={items} />
      </main>
    </AppShell>
  );
}
