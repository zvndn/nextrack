CREATE TABLE "WatchActivity" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "mediaId" TEXT,
    "dayKey" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WatchActivity_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "WatchActivity_userId_dayKey_key" ON "WatchActivity"("userId", "dayKey");
CREATE INDEX "WatchActivity_userId_dayKey_idx" ON "WatchActivity"("userId", "dayKey");

ALTER TABLE "WatchActivity" ADD CONSTRAINT "WatchActivity_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

INSERT INTO "WatchActivity" ("id", "userId", "mediaId", "dayKey", "createdAt", "updatedAt")
SELECT DISTINCT
  CONCAT('backfill_', "userId", '_', REPLACE(TO_CHAR(("lastWatchedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD'), '-', '')) AS "id",
  "userId",
  NULL AS "mediaId",
  TO_CHAR(("lastWatchedAt" AT TIME ZONE 'UTC'), 'YYYY-MM-DD') AS "dayKey",
  CURRENT_TIMESTAMP AS "createdAt",
  CURRENT_TIMESTAMP AS "updatedAt"
FROM "Progress"
WHERE "lastWatchedAt" IS NOT NULL
ON CONFLICT ("userId", "dayKey") DO NOTHING;
