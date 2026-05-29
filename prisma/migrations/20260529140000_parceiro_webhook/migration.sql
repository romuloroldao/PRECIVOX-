-- Épico 9.4 — Webhook preço alterado (Tier 3)
ALTER TABLE "mercados"
  ADD COLUMN IF NOT EXISTS "parceiro_webhook" JSONB;
