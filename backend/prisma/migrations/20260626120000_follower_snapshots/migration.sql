-- CreateTable
CREATE TABLE "follower_snapshots" (
    "id" TEXT NOT NULL,
    "platform_account_id" TEXT NOT NULL,
    "follower_count" INTEGER NOT NULL,
    "snapshot_date" DATE NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "follower_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "follower_snapshots_platform_account_id_snapshot_date_key" ON "follower_snapshots"("platform_account_id", "snapshot_date");

-- CreateIndex
CREATE INDEX "follower_snapshots_platform_account_id_idx" ON "follower_snapshots"("platform_account_id");

-- CreateIndex
CREATE INDEX "follower_snapshots_snapshot_date_idx" ON "follower_snapshots"("snapshot_date");

-- AddForeignKey
ALTER TABLE "follower_snapshots" ADD CONSTRAINT "follower_snapshots_platform_account_id_fkey" FOREIGN KEY ("platform_account_id") REFERENCES "platform_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;
