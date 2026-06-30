-- Épico 9.3 — SLA + contrato dados parceiro (Tier 1–3)
ALTER TABLE "mercados"
  ADD COLUMN IF NOT EXISTS "parceiro_tier" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS "parceiro_sla_contrato" JSONB;
