-- Épico 15: SKU nacional + embedding leve (TF sparse JSON)
ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "sku_nacional" VARCHAR(128);
ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "embedding_json" JSONB;

CREATE INDEX IF NOT EXISTS "produtos_sku_nacional_idx" ON "produtos"("sku_nacional");
