import type { WatchStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { upsertExternalMedia } from "@/lib/media-store";
import type { ExternalMediaItem } from "@/lib/media-sources";
import { WATCH_STATUSES, WatchStatusValues } from "@/lib/watch-status";

const validStatuses = new Set(WATCH_STATUSES);

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ items: [] });

  const items = await prisma.watchlist.findMany({
    where: { userId: session.user.id },
    include: {
      media: true
    },
    orderBy: { updatedAt: "desc" }
  });

  return Response.json({ items });
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  if (!body) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  const mediaInput = body.media as ExternalMediaItem | undefined;
  const status: WatchStatus = validStatuses.has(body.status) ? body.status as WatchStatus : WatchStatusValues.PLAN_TO_WATCH;

  if (!mediaInput?.id || !mediaInput.title || !mediaInput.source || !mediaInput.type) {
    return Response.json({ error: "Valid media payload is required." }, { status: 400 });
  }

  const media = await upsertExternalMedia(mediaInput);
  const watchlist = await prisma.watchlist.upsert({
    where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
    update: { status },
    create: { userId: session.user.id, mediaId: media.id, status },
    include: { media: true }
  });

  await prisma.progress.upsert({
    where: { userId_mediaId: { userId: session.user.id, mediaId: media.id } },
    update: {},
    create: {
      userId: session.user.id,
      mediaId: media.id,
      totalCount: media.episodesCount ?? (media.type === "MOVIE" ? 1 : 0)
    }
  });

  return Response.json({ watchlist }, { status: 201 });
}

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body;
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  if (!body) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  const mediaId = String(body.mediaId ?? "");
  const status: WatchStatus | null = validStatuses.has(body.status) ? body.status as WatchStatus : null;

  if (!mediaId || !status) {
    return Response.json({ error: "Valid mediaId and status are required." }, { status: 400 });
  }

  const watchlist = await prisma.watchlist.update({
    where: { userId_mediaId: { userId: session.user.id, mediaId } },
    data: { status },
    include: { media: true }
  });

  if (status === WatchStatusValues.COMPLETED) {
    const media = watchlist.media;
    const totalCount = media.episodesCount ?? (media.type === "MOVIE" ? 1 : 0);
    await prisma.progress.upsert({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
      update: {
        watchedCount: totalCount,
        totalCount,
        percentage: totalCount > 0 ? 100 : 0,
        lastWatchedAt: new Date()
      },
      create: {
        userId: session.user.id,
        mediaId,
        watchedCount: totalCount,
        totalCount,
        percentage: totalCount > 0 ? 100 : 0,
        lastWatchedAt: new Date()
      }
    });
  }

  return Response.json({ watchlist });
}

export async function DELETE(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const mediaId = searchParams.get("mediaId");
  if (!mediaId) return Response.json({ error: "mediaId is required." }, { status: 400 });

  await prisma.watchlist.deleteMany({ where: { userId: session.user.id, mediaId } });
  return Response.json({ ok: true });
}
