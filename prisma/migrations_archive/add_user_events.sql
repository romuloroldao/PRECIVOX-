-- Migration: Adicionar tabela de eventos do usuário para IA
-- Data: 2024

CREATE TABLE IF NOT EXISTS "UserEvent" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "mercadoId" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}',
  
  CONSTRAINT "UserEvent_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "UserEvent_userId_mercadoId_idx" ON "UserEvent"("userId", "mercadoId");
CREATE INDEX IF NOT EXISTS "UserEvent_mercadoId_timestamp_idx" ON "UserEvent"("mercadoId", "timestamp");
CREATE INDEX IF NOT EXISTS "UserEvent_type_timestamp_idx" ON "UserEvent"("type", "timestamp");

COMMENT ON TABLE "UserEvent" IS 'Eventos do usuário coletados para análise de IA';
COMMENT ON COLUMN "UserEvent"."type" IS 'Tipo do evento: lista_criada, produto_adicionado_lista, produto_buscado, etc';
COMMENT ON COLUMN "UserEvent"."metadata" IS 'Metadados do evento em formato JSON';

