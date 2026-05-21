import type { Media, Progress, WatchStatus } from "@prisma/client";

export function mediaTypeLabel(type: Media["type"]) {
  if (type === "ANIME") return "Anime";
  if (type === "MOVIE") return "Movie";
  return "TV Series";
}

export function posterUrl(media: Pick<Media, "posterUrl">) {
  return media.posterUrl;
}

export function statusLabel(status: WatchStatus) {
  return status.replaceAll("_", " ").toLowerCase().replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function progressText(media: Media, progress?: Progress | null, status?: WatchStatus) {
  const label = status ? statusLabel(status) : "Tracked";

  if (!progress) return label;
  if (media.type === "MOVIE") return progress.watchedCount > 0 ? "Watched movie" : label;
  if (progress.totalCount > 0) return `${progress.watchedCount}/${progress.totalCount} episodes - ${label}`;
  return `${progress.watchedCount} episodes - ${label}`;
}

export function estimatedHours(media: Media, progress?: Progress | null) {
  if (!progress) return 0;
  const runtime = media.runtimeMinutes ?? (media.type === "MOVIE" ? 110 : 24);
  return (progress.watchedCount * runtime) / 60;
}
