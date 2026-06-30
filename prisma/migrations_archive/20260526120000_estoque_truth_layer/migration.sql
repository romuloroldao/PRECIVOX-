-- Truth layer: fonte, confiança e verificação de preço em estoques

CREATE TYPE "EstoqueFonte" AS ENUM (
  'UPLOAD_GESTOR',
  'API_PARCEIRO',
  'CROWD',
  'MANUAL_GESTOR'
);

ALTER TABLE "estoques" ADD COLUMN IF NOT EXISTS "fonte" "EstoqueFonte" NOT NULL DEFAULT 'UPLOAD_GESTOR';
ALTER TABLE "estoques" ADD COLUMN IF NOT EXISTS "confianca" INTEGER NOT NULL DEFAULT 70;
ALTER TABLE "estoques" ADD COLUMN IF NOT EXISTS "verificado_em" TIMESTAMP(3);

-- Backfill: verificado_em = atualizado_em onde nulo
UPDATE "estoques"
SET "verificado_em" = "atualizadoEm"
WHERE "verificado_em" IS NULL;

CREATE INDEX IF NOT EXISTS "estoques_confianca_atualizado_idx" ON "estoques"("confianca", "atualizadoEm");

COMMENT ON COLUMN "estoques"."fonte" IS 'Origem do preço: upload, API parceiro, crowd ou ajuste manual';
COMMENT ON COLUMN "estoques"."confianca" IS '0-100: confiança no preço exibido ao consumidor';
COMMENT ON COLUMN "estoques"."verificado_em" IS 'Última verificação/confirmação do preço';
