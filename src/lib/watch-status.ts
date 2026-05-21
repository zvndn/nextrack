export const WATCH_STATUSES = [
  "WATCHING",
  "COMPLETED",
  "PAUSED",
  "DROPPED",
  "PLAN_TO_WATCH"
] as const;

export type WatchStatus = (typeof WATCH_STATUSES)[number];

export const WatchStatusValues = {
  WATCHING: "WATCHING",
  COMPLETED: "COMPLETED",
  PAUSED: "PAUSED",
  DROPPED: "DROPPED",
  PLAN_TO_WATCH: "PLAN_TO_WATCH"
} as const satisfies Record<WatchStatus, WatchStatus>;
