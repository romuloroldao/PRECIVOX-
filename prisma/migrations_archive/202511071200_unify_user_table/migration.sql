-- Unificar tabelas de usuários em "usuarios" e ajustar FKs
-- No-op quando banco ainda não tem as tabelas legadas (CI / fresh install via db push).

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users')
     AND EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN

    INSERT INTO "usuarios" ("id", "nome", "email", "senha_hash", "role", "data_criacao", "data_atualizacao", "ultimo_login")
    SELECT legacy."id",
           legacy."nome",
           legacy."email",
           legacy."senha",
           legacy."role"::"Role",
           COALESCE(legacy."dataCriacao", NOW()),
           COALESCE(legacy."dataAtualizacao", NOW()),
           NULL
    FROM "users" AS legacy
    WHERE NOT EXISTS (
      SELECT 1
      FROM "usuarios" AS current
      WHERE current."id" = legacy."id"
         OR current."email" = legacy."email"
    );

    UPDATE "usuarios" AS current
    SET "role" = legacy."role"::"Role",
        "nome" = COALESCE(current."nome", legacy."nome"),
        "senha_hash" = COALESCE(current."senha_hash", legacy."senha"),
        "data_atualizacao" = GREATEST(current."data_atualizacao", COALESCE(legacy."dataAtualizacao", current."data_atualizacao"))
    FROM "users" AS legacy
    WHERE legacy."email" = current."email";

    DROP TABLE IF EXISTS "users" CASCADE;
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'mercados') THEN
    ALTER TABLE "mercados" DROP CONSTRAINT IF EXISTS "mercados_gestorId_fkey";
    ALTER TABLE "mercados"
      ADD CONSTRAINT "mercados_gestorId_fkey"
      FOREIGN KEY ("gestorId")
      REFERENCES "usuarios"("id")
      ON DELETE SET NULL
      ON UPDATE CASCADE;
  END IF;

  IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'public' AND tablename = 'acoes_gestor') THEN
    ALTER TABLE "acoes_gestor" DROP CONSTRAINT IF EXISTS "acoes_gestor_userId_fkey";
    ALTER TABLE "acoes_gestor"
      ADD CONSTRAINT "acoes_gestor_userId_fkey"
      FOREIGN KEY ("userId")
      REFERENCES "usuarios"("id")
      ON DELETE CASCADE
      ON UPDATE CASCADE;
  END IF;
END $$;

