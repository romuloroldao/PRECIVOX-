-- Chaves de produto para agregação e índices
ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "nome_chave" VARCHAR(512);
ALTER TABLE "produtos" ADD COLUMN IF NOT EXISTS "chave_insight" VARCHAR(768);
CREATE INDEX IF NOT EXISTS "produtos_nome_chave_idx" ON "produtos"("nome_chave");
CREATE INDEX IF NOT EXISTS "produtos_chave_insight_idx" ON "produtos"("chave_insight");
