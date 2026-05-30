-- AlterTable
ALTER TABLE "User" ADD COLUMN "watchlistPublic" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ADD COLUMN "watchlistShareId" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "User_watchlistShareId_key" ON "User"("watchlistShareId");
