-- Catálogo isolado por mercado: produtos pertencem a um tenant (mercado).
-- Legado: mercado_id NULL + busca via estoques (comportamento anterior).

ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "mercado_id" TEXT;

ALTER TABLE "produtos" DROP CONSTRAINT IF EXISTS "produtos_codigoBarras_key";
DROP INDEX IF EXISTS "produtos_codigoBarras_key";

CREATE INDEX IF NOT EXISTS "produtos_mercado_id_idx" ON "produtos"("mercado_id");

ALTER TABLE "produtos"
  ADD CONSTRAINT "produtos_mercado_id_fkey"
  FOREIGN KEY ("mercado_id") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS "produtos_mercado_codigo_barras_key"
  ON "produtos" ("mercado_id", "codigoBarras")
  WHERE "codigoBarras" IS NOT NULL;
