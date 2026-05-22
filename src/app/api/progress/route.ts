import type { WatchStatus } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { progressPercentage } from "@/lib/media-store";
import { recordWatchActivity } from "@/lib/watch-streak";
import { WATCH_STATUSES, WatchStatusValues } from "@/lib/watch-status";

const validStatuses = new Set<string>(WATCH_STATUSES);

export async function PATCH(request: Request) {
  const session = await auth();
  if (!session?.user?.id) return Response.json({ error: "Authentication required." }, { status: 401 });

  let body: unknown = null;
  const rawText = await request.text();
  if (!rawText) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }
  try {
    body = JSON.parse(rawText);
  } catch {
    return Response.json({ error: "Invalid JSON input." }, { status: 400 });
  }

  if (!body) {
    return Response.json({ error: "Request body is required." }, { status: 400 });
  }

  interface ProgressRequest {
    mediaId?: string;
    watchedCount?: number;
    totalCount?: number;
    status?: string;
  }

  const isProgressRequest = (val: unknown): val is ProgressRequest =>
    typeof val === "object" && val !== null;

  if (!isProgressRequest(body)) {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const mediaId = String(body.mediaId ?? "");
  const watchedInput = Number(body.watchedCount ?? 0);
  const totalInput = Number(body.totalCount ?? 0);

  if (!mediaId || !Number.isFinite(watchedInput) || !Number.isFinite(totalInput) || watchedInput < 0 || totalInput < 0) {
    return Response.json({ error: "Valid mediaId, watchedCount, and totalCount are required." }, { status: 400 });
  }

  const media = await prisma.media.findUnique({ where: { id: mediaId } });
  if (!media) return Response.json({ error: "Media was not found." }, { status: 404 });
  const existingProgress = await prisma.progress.findUnique({
    where: { userId_mediaId: { userId: session.user.id, mediaId } },
    select: { watchedCount: true }
  });
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { autoFavoriteOnComplete: true }
  });

  const totalCount = Math.floor(totalInput);
  const watchedCount = totalCount > 0 ? Math.min(Math.floor(watchedInput), totalCount) : Math.floor(watchedInput);
  const percentage = progressPercentage(watchedCount, totalCount);
  const requestedStatus: WatchStatus | null = body.status && validStatuses.has(body.status) ? body.status as WatchStatus : null;
  const status: WatchStatus =
    requestedStatus ??
    (totalCount > 0 && watchedCount >= totalCount
      ? WatchStatusValues.COMPLETED
      : watchedCount > 0
        ? WatchStatusValues.WATCHING
        : WatchStatusValues.PLAN_TO_WATCH);
  const lastWatchedAt = watchedCount > 0 ? new Date() : null;
  const shouldAutoFavorite = user?.autoFavoriteOnComplete && status === WatchStatusValues.COMPLETED;
  const shouldRecordActivity = watchedCount > (existingProgress?.watchedCount ?? 0);

  const transactionResults = await prisma.$transaction([
    prisma.media.update({
      where: { id: mediaId },
      data: media.type === "MOVIE" ? {} : { episodesCount: totalCount > 0 ? totalCount : null }
    }),
    prisma.progress.upsert({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
      update: {
        watchedCount,
        totalCount,
        percentage,
        lastWatchedAt
      },
      create: {
        userId: session.user.id,
        mediaId,
        watchedCount,
        totalCount,
        percentage,
        lastWatchedAt
      }
    }),
    prisma.watchlist.upsert({
      where: { userId_mediaId: { userId: session.user.id, mediaId } },
      update: { status },
      create: { userId: session.user.id, mediaId, status }
    }),
    ...(shouldAutoFavorite
      ? [
          prisma.favorite.upsert({
            where: { userId_mediaId: { userId: session.user.id, mediaId } },
            update: {},
            create: { userId: session.user.id, mediaId }
          })
        ]
      : [])
  ]);

  const progress = transactionResults[1];
  const watchlist = transactionResults[2];

  if (shouldRecordActivity) {
    await recordWatchActivity(session.user.id, mediaId, lastWatchedAt ?? new Date());
  }

  return Response.json({ progress, watchlist, favoriteAdded: shouldAutoFavorite });
}
