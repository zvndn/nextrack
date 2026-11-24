export type SmartQueueCandidate = {
  id: string;
  title: string;
  status: "WATCHING" | "PLAN_TO_WATCH" | "PAUSED" | "DROPPED" | "COMPLETED";
  progress: number;
  watchedCount: number;
  totalCount: number;
  rating?: number | null;
  updatedAt: Date;
};

export type SmartQueueItem = SmartQueueCandidate & {
  score: number;
  reason: string;
};

const DAY_MS = 86_400_000;

/**
 * Produces a deterministic, explainable next-up list. The same scoring contract
 * is mirrored by `crates/nextrack-ranking` for batch/import jobs where thousands
 * of titles need to be ranked without a Node runtime.
 */
export function buildSmartQueue(candidates: SmartQueueCandidate[], now = new Date()): SmartQueueItem[] {
  return candidates
    .filter((item) => item.status !== "COMPLETED" && item.status !== "DROPPED")
    .map((item) => {
      const daysSinceUpdate = Math.max(0, Math.floor((now.getTime() - item.updatedAt.getTime()) / DAY_MS));
      const boundedProgress = Math.max(0, Math.min(100, item.progress));
      const remaining = item.totalCount > 0 ? Math.max(0, item.totalCount - item.watchedCount) : null;

      if (item.status === "WATCHING") {
        const closeToFinish = remaining === null ? 0 : Math.max(0, 24 - Math.min(24, remaining)) * 3;
        return {
          ...item,
          score: 300 + boundedProgress * 1.5 + Math.min(daysSinceUpdate, 21) + closeToFinish,
          reason: remaining !== null && remaining <= 3
            ? `${remaining} ${remaining === 1 ? "episode" : "episodes"} left — almost there`
            : daysSinceUpdate >= 7
              ? `Pick up where you left off ${daysSinceUpdate} days ago`
              : "Keep your current momentum going"
        };
      }

      if (item.status === "PAUSED") {
        return { ...item, score: 120 + boundedProgress + Math.min(daysSinceUpdate, 30), reason: "Paused — resume when you are ready" };
      }

      const ratingBoost = Math.max(0, Math.min(10, item.rating ?? 0)) * 4;
      return { ...item, score: 80 + ratingBoost + Math.min(daysSinceUpdate, 30), reason: item.rating ? `Highly rated at ${item.rating.toFixed(1)}` : "Ready when you want something new" };
    })
    .sort((a, b) => b.score - a.score || b.updatedAt.getTime() - a.updatedAt.getTime() || a.title.localeCompare(b.title));
}
