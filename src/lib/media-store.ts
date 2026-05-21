import { MediaType } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import type { ExternalMediaItem } from "@/lib/media-sources";

function toMediaType(type: ExternalMediaItem["type"]) {
  if (type === "anime") return MediaType.ANIME;
  if (type === "movie") return MediaType.MOVIE;
  return MediaType.TV;
}

export async function upsertExternalMedia(item: ExternalMediaItem) {
  return prisma.media.upsert({
    where: {
      source_sourceId: {
        source: item.source,
        sourceId: item.id
      }
    },
    update: {
      title: item.title,
      overview: item.overview,
      posterUrl: item.image,
      rating: item.rating,
      year: item.year,
      genres: item.genres ?? [],
      episodesCount: item.episodesCount,
      seasonsCount: item.seasonsCount,
      runtimeMinutes: item.runtimeMinutes
    },
    create: {
      source: item.source,
      sourceId: item.id,
      type: toMediaType(item.type),
      title: item.title,
      overview: item.overview,
      posterUrl: item.image,
      rating: item.rating,
      year: item.year,
      genres: item.genres ?? [],
      episodesCount: item.episodesCount,
      seasonsCount: item.seasonsCount,
      runtimeMinutes: item.runtimeMinutes
    }
  });
}

export function progressPercentage(watchedCount: number, totalCount: number) {
  if (totalCount <= 0) return 0;
  return Math.min(100, Math.round((watchedCount / totalCount) * 100));
}
