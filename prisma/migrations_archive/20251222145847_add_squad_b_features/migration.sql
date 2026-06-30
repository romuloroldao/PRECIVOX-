-- Migration: Add Squad B Features
-- Models: UserStreak, SavingsHistory, Referral, NotificationSubscription

-- Create UserStreak table
CREATE TABLE IF NOT EXISTS "user_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_login" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "user_streaks_user_id_key" ON "user_streaks"("user_id");

-- Create SavingsHistory table
CREATE TABLE IF NOT EXISTS "savings_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "list_id" TEXT,
    "product_id" TEXT,
    "price_paid" INTEGER NOT NULL,
    "avg_price" INTEGER NOT NULL,
    "savings" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_history_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "savings_history_user_id_date_idx" ON "savings_history"("user_id", "date");

-- Create Referral table
CREATE TABLE IF NOT EXISTS "referrals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "referrals_code_key" ON "referrals"("code");

-- Create NotificationSubscription table
CREATE TABLE IF NOT EXISTS "notification_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "notification_subscriptions_token_key" ON "notification_subscriptions"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "notification_subscriptions_user_id_token_key" ON "notification_subscriptions"("user_id", "token");
CREATE INDEX IF NOT EXISTS "notification_subscriptions_user_id_idx" ON "notification_subscriptions"("user_id");

-- Add foreign keys
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'user_streaks_user_id_fkey'
    ) THEN
        ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'savings_history_user_id_fkey'
    ) THEN
        ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'savings_history_list_id_fkey'
    ) THEN
        ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_list_id_fkey" 
            FOREIGN KEY ("list_id") REFERENCES "listas_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'savings_history_product_id_fkey'
    ) THEN
        ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_product_id_fkey" 
            FOREIGN KEY ("product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referrer_id_fkey'
    ) THEN
        ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" 
            FOREIGN KEY ("referrer_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'referrals_referee_id_fkey'
    ) THEN
        ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey" 
            FOREIGN KEY ("referee_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'notification_subscriptions_user_id_fkey'
    ) THEN
        ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_fkey" 
            FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
    END IF;
END $$;

