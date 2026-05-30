import { redirect } from "next/navigation";
import { WatchlistManager } from "@/components/dashboard/watchlist-manager";
import { AppShell } from "@/components/layout/app-shell";
import { auth } from "@/lib/auth";
import { mediaTypeLabel, posterUrl, progressText } from "@/lib/media-presenters";
import { prisma } from "@/lib/prisma";

export default async function WatchlistPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [saved, progress, currentUser] = await Promise.all([
    prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: { media: true },
      orderBy: { updatedAt: "desc" }
    }),
    prisma.progress.findMany({ where: { userId: session.user.id } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        watchlistPublic: true,
        watchlistShareId: true
      }
    })
  ]);

  const progressByMediaId = new Map(progress.map((item) => [item.mediaId, item]));
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

  return (
    <AppShell>
      <main className="px-4 py-6 md:px-8">
        <h1 className="page-title font-display text-4xl font-semibold">Watchlist</h1>
        <p className="mt-2 text-sm text-zinc-400">Search, sort, manage, and share your saved titles.</p>

        <div className="mt-6">
          <WatchlistManager
            initialItems={libraryItems}
            initialSharing={{
              enabled: currentUser?.watchlistPublic ?? false,
              shareUrl: currentUser?.watchlistShareId ? `/watchlist/${currentUser.watchlistShareId}` : null
            }}
          />
        </div>
      </main>
    </AppShell>
  );
}
