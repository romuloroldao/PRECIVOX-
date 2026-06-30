-- CreateEnum (se não existir)
DO $$ BEGIN
 CREATE TYPE "Role" AS ENUM ('CLIENTE', 'GESTOR', 'ADMIN');
EXCEPTION
 WHEN duplicate_object THEN null;
END $$;

-- Criar tabela de usuários se não existir, ou alterar se existir
DO $$ 
BEGIN
  -- Verificar se a tabela existe
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'usuarios') THEN
    -- Criar nova tabela
    CREATE TABLE "usuarios" (
      "id" TEXT NOT NULL,
      "nome" TEXT,
      "email" TEXT NOT NULL,
      "email_verified" TIMESTAMP(3),
      "imagem" TEXT,
      "senha_hash" TEXT,
      "role" "Role" NOT NULL DEFAULT 'CLIENTE',
      "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
      "data_atualizacao" TIMESTAMP(3) NOT NULL,
      "ultimo_login" TIMESTAMP(3),
      CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
    );
    CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");
  ELSE
    -- Adicionar colunas que podem não existir
    ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "email_verified" TIMESTAMP(3);
    ALTER TABLE "usuarios" ADD COLUMN IF NOT EXISTS "imagem" TEXT;
    
    -- Renomear colunas se necessário (ignorar erros se já estiverem corretas)
    DO $rename$ 
    BEGIN
      ALTER TABLE "usuarios" RENAME COLUMN "nome" TO "name";
    EXCEPTION
      WHEN undefined_column THEN null;
    END $rename$;
    
    -- Adicionar mapeamento de volta
    ALTER TABLE "usuarios" RENAME COLUMN "name" TO "nome";
  END IF;
END $$;

-- Criar tabela de accounts (NextAuth)
CREATE TABLE IF NOT EXISTS "accounts" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "provider" TEXT NOT NULL,
  "provider_account_id" TEXT NOT NULL,
  "refresh_token" TEXT,
  "access_token" TEXT,
  "expires_at" INTEGER,
  "token_type" TEXT,
  "scope" TEXT,
  "id_token" TEXT,
  "session_state" TEXT,
  CONSTRAINT "accounts_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "accounts_provider_provider_account_id_key" ON "accounts"("provider", "provider_account_id");

-- Criar tabela de sessions (NextAuth)
CREATE TABLE IF NOT EXISTS "sessions" (
  "id" TEXT NOT NULL,
  "session_token" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "sessions_session_token_key" ON "sessions"("session_token");

-- Criar tabela de verification tokens (NextAuth)
CREATE TABLE IF NOT EXISTS "verification_tokens" (
  "identifier" TEXT NOT NULL,
  "token" TEXT NOT NULL,
  "expires" TIMESTAMP(3) NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_token_key" ON "verification_tokens"("token");
CREATE UNIQUE INDEX IF NOT EXISTS "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- Adicionar foreign keys
DO $$ 
BEGIN
  ALTER TABLE "accounts" ADD CONSTRAINT "accounts_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ 
BEGIN
  ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Remover tabela antiga de sessoes se existir
DROP TABLE IF EXISTS "sessoes" CASCADE;

