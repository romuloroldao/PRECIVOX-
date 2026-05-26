-- Perfil PRECI: ajustes do usuário (5 eixos) persistidos no cadastro

ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "perfil_preci" JSONB;

COMMENT ON COLUMN "usuarios"."perfil_preci" IS 'Overrides e metadados do Perfil PRECI (5 eixos comportamentais)';
