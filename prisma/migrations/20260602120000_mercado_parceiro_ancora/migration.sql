-- Épico 16 — parceiros âncora por região piloto (JSON).

ALTER TABLE "mercados" ADD COLUMN IF NOT EXISTS "parceiro_ancora" JSONB;
