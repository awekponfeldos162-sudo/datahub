-- CreateEnum
CREATE TYPE "Plan" AS ENUM ('FREE', 'STARTER', 'PRO', 'ENTERPRISE');

-- CreateEnum
CREATE TYPE "Platform" AS ENUM ('FACEBOOK', 'YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'SNAPCHAT');

-- CreateEnum
CREATE TYPE "ReportFormat" AS ENUM ('PDF', 'EXCEL');

-- CreateEnum
CREATE TYPE "ReportPeriod" AS ENUM ('WEEKLY', 'MONTHLY', 'CUSTOM');

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT,
    "full_name" TEXT NOT NULL,
    "avatar" TEXT,
    "plan" "Plan" NOT NULL DEFAULT 'FREE',
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "verification_token" TEXT,
    "reset_token" TEXT,
    "reset_token_expiry" TIMESTAMP(3),
    "mfa_enabled" BOOLEAN NOT NULL DEFAULT false,
    "mfa_secret" TEXT,
    "google_id" TEXT,
    "facebook_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,
    "last_login_at" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "platform_accounts" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "platform" "Platform" NOT NULL,
    "platform_user_id" TEXT NOT NULL,
    "platform_username" TEXT,
    "platform_avatar" TEXT,
    "access_token_enc" TEXT NOT NULL,
    "refresh_token_enc" TEXT,
    "token_expires_at" TIMESTAMP(3),
    "scope" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_sync_at" TIMESTAMP(3),
    "follower_count" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "platform_accounts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" TEXT NOT NULL,
    "platform_account_id" TEXT NOT NULL,
    "platform_post_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "thumbnail_url" TEXT,
    "url" TEXT,
    "published_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metrics" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "metric_date" DATE NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,
    "likes" INTEGER NOT NULL DEFAULT 0,
    "comments" INTEGER NOT NULL DEFAULT 0,
    "shares" INTEGER NOT NULL DEFAULT 0,
    "reach" INTEGER NOT NULL DEFAULT 0,
    "engagement_rate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "watch_time_seconds" INTEGER NOT NULL DEFAULT 0,
    "impressions" INTEGER NOT NULL DEFAULT 0,
    "saves" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "metrics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "period_start" TIMESTAMP(3) NOT NULL,
    "period_end" TIMESTAMP(3) NOT NULL,
    "platforms" "Platform"[],
    "format" "ReportFormat" NOT NULL,
    "file_url" TEXT,
    "file_size" INTEGER,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "generated_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan" "Plan" NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "current_period_start" TIMESTAMP(3) NOT NULL,
    "current_period_end" TIMESTAMP(3) NOT NULL,
    "payment_provider" TEXT,
    "external_sub_id" TEXT,
    "amount" DOUBLE PRECISION NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'XOF',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "action" TEXT NOT NULL,
    "resource" TEXT NOT NULL,
    "details" JSONB,
    "ip_address" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_google_id_key" ON "users"("google_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_facebook_id_key" ON "users"("facebook_id");

-- CreateIndex
CREATE INDEX "platform_accounts_user_id_idx" ON "platform_accounts"("user_id");

-- CreateIndex
CREATE INDEX "platform_accounts_platform_idx" ON "platform_accounts"("platform");

-- CreateIndex
CREATE UNIQUE INDEX "platform_accounts_user_id_platform_key" ON "platform_accounts"("user_id", "platform");

-- CreateIndex
CREATE INDEX "posts_platform_account_id_idx" ON "posts"("platform_account_id");

-- CreateIndex
CREATE INDEX "posts_published_at_idx" ON "posts"("published_at");

-- CreateIndex
CREATE UNIQUE INDEX "posts_platform_account_id_platform_post_id_key" ON "posts"("platform_account_id", "platform_post_id");

-- CreateIndex
CREATE INDEX "metrics_post_id_idx" ON "metrics"("post_id");

-- CreateIndex
CREATE INDEX "metrics_metric_date_idx" ON "metrics"("metric_date");

-- CreateIndex
CREATE UNIQUE INDEX "metrics_post_id_metric_date_key" ON "metrics"("post_id", "metric_date");

-- CreateIndex
CREATE INDEX "reports_user_id_idx" ON "reports"("user_id");

-- CreateIndex
CREATE INDEX "reports_created_at_idx" ON "reports"("created_at");

-- CreateIndex
CREATE INDEX "subscriptions_user_id_idx" ON "subscriptions"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_user_id_idx" ON "audit_logs"("user_id");

-- CreateIndex
CREATE INDEX "audit_logs_created_at_idx" ON "audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "platform_accounts" ADD CONSTRAINT "platform_accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_platform_account_id_fkey" FOREIGN KEY ("platform_account_id") REFERENCES "platform_accounts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metrics" ADD CONSTRAINT "metrics_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "subscriptions" ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
