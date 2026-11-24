import assert from "node:assert/strict";
import test from "node:test";
import { buildSmartQueue } from "./smart-queue.ts";

const now = new Date("2026-11-24T12:00:00Z");

test("prioritizes an active title over a highly rated plan", () => {
  const queue = buildSmartQueue([
    { id: "plan", title: "A plan", status: "PLAN_TO_WATCH", progress: 0, watchedCount: 0, totalCount: 0, rating: 10, updatedAt: now },
    { id: "active", title: "An active title", status: "WATCHING", progress: 30, watchedCount: 3, totalCount: 12, updatedAt: now }
  ], now);

  assert.equal(queue[0]?.id, "active");
});

test("excludes completed and dropped titles", () => {
  const queue = buildSmartQueue([
    { id: "done", title: "Done", status: "COMPLETED", progress: 100, watchedCount: 1, totalCount: 1, updatedAt: now },
    { id: "dropped", title: "Dropped", status: "DROPPED", progress: 10, watchedCount: 1, totalCount: 10, updatedAt: now }
  ], now);

  assert.deepEqual(queue, []);
});

test("explains a nearly finished title", () => {
  const [item] = buildSmartQueue([
    { id: "near", title: "Near", status: "WATCHING", progress: 90, watchedCount: 9, totalCount: 10, updatedAt: now }
  ], now);

  assert.match(item?.reason ?? "", /1 episode left/);
});
