-- Épico 17 — monetização (SaaS features + promos gestor).

ALTER TABLE "mercados" ADD COLUMN IF NOT EXISTS "monetizacao" JSONB;
ALTER TABLE "planos_de_pagamento" ADD COLUMN IF NOT EXISTS "features" JSONB;
