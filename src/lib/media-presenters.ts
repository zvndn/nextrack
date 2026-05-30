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

export function trackedRuntimeHours(media: Media, progress?: Progress | null) {
  if (!progress || progress.watchedCount <= 0 || !media.runtimeMinutes || media.runtimeMinutes <= 0) return 0;

  const watchedUnits = media.type === "MOVIE" ? Math.min(progress.watchedCount, 1) : progress.watchedCount;
  return (watchedUnits * media.runtimeMinutes) / 60;
}

export function formatRuntimeHours(hours: number) {
  const safeHours = Math.max(0, hours);
  if (safeHours > 0 && safeHours < 1) return `${Math.round(safeHours * 60)}m`;
  return `${Math.round(safeHours)}h`;
}

export function watchedDurationText(hours: number) {
  const totalHours = Math.max(0, Math.round(hours));
  const days = Math.floor(totalHours / 24);
  const remainingHours = totalHours % 24;

  if (!days) return `${remainingHours} tracked hour${remainingHours === 1 ? "" : "s"}`;
  if (!remainingHours) return `${days} tracked day${days === 1 ? "" : "s"}`;
  return `${days} tracked day${days === 1 ? "" : "s"} and ${remainingHours}h`;
}

export function runtimeCoverageText(totalTitles: number, titlesWithRuntime: number) {
  if (totalTitles === 0) return "No saved titles yet";
  return `${titlesWithRuntime}/${totalTitles} saved titles include runtime data`;
}
