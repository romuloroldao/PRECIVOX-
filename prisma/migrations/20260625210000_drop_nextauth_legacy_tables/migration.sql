-- PR-5: Remove tabelas legado NextAuth (accounts, sessions).
-- Migra vínculos OAuth conhecidos para social_identities antes do drop.

INSERT INTO "social_identities" (
  "id",
  "user_id",
  "provider",
  "provider_sub",
  "provider_access_token",
  "provider_refresh_token",
  "created_at",
  "updated_at"
)
SELECT
  gen_random_uuid()::text,
  a."user_id",
  CASE lower(a."provider")
    WHEN 'google' THEN 'GOOGLE'::"AuthProvider"
    WHEN 'facebook' THEN 'FACEBOOK'::"AuthProvider"
    WHEN 'apple' THEN 'APPLE'::"AuthProvider"
  END,
  a."provider_account_id",
  a."access_token",
  a."refresh_token",
  NOW(),
  NOW()
FROM "accounts" a
WHERE lower(a."provider") IN ('google', 'facebook', 'apple')
ON CONFLICT ("provider", "provider_sub") DO NOTHING;

DROP TABLE IF EXISTS "sessions";
DROP TABLE IF EXISTS "accounts";
