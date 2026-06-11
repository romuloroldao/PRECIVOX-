-- Épico 13 — config + histórico leve de oferta agregada por mercado (JSON).

ALTER TABLE "mercados" ADD COLUMN IF NOT EXISTS "oferta_agregada" JSONB;
