-- Login Social + OTP (Auth Hardening v7.0)

-- Enums
DO $$ BEGIN
  CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE', 'PHONE');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
  CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'WHATSAPP');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Novos campos em usuarios
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "telefone" TEXT;
ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "phone_verified" TIMESTAMP(3);

CREATE UNIQUE INDEX IF NOT EXISTS "usuarios_telefone_key" ON "usuarios"("telefone");

-- Tabela social_identities (Single Source of Truth para provedores externos)
CREATE TABLE IF NOT EXISTS "social_identities" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "provider" "AuthProvider" NOT NULL,
  "provider_sub" TEXT NOT NULL,
  "email" TEXT,
  "email_verified" BOOLEAN NOT NULL DEFAULT false,
  "is_private_relay" BOOLEAN NOT NULL DEFAULT false,
  "display_name" TEXT,
  "avatar_url" TEXT,
  "provider_access_token" TEXT,
  "provider_refresh_token" TEXT,
  "provider_token_expires" TIMESTAMP(3),
  "raw_profile" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "social_identities_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "social_identities_provider_provider_sub_key"
  ON "social_identities"("provider", "provider_sub");
CREATE INDEX IF NOT EXISTS "social_identities_user_id_idx"
  ON "social_identities"("user_id");
CREATE INDEX IF NOT EXISTS "social_identities_email_idx"
  ON "social_identities"("email");

DO $$ BEGIN
  ALTER TABLE "social_identities"
    ADD CONSTRAINT "social_identities_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- Tabela phone_otp_challenges (OTP por telefone, código apenas como hash)
CREATE TABLE IF NOT EXISTS "phone_otp_challenges" (
  "id" TEXT NOT NULL,
  "phone" TEXT NOT NULL,
  "code_hash" TEXT NOT NULL,
  "channel" "OtpChannel" NOT NULL DEFAULT 'SMS',
  "attempts" INTEGER NOT NULL DEFAULT 0,
  "max_attempts" INTEGER NOT NULL DEFAULT 5,
  "consumed_at" TIMESTAMP(3),
  "expires_at" TIMESTAMP(3) NOT NULL,
  "ip" TEXT,
  "user_agent" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "phone_otp_challenges_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "phone_otp_challenges_phone_expires_at_idx"
  ON "phone_otp_challenges"("phone", "expires_at");
CREATE INDEX IF NOT EXISTS "phone_otp_challenges_expires_at_idx"
  ON "phone_otp_challenges"("expires_at");
