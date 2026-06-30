-- Tabela de eventos do usuário para IA (EventCollector)
CREATE TABLE IF NOT EXISTS "user_events" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "mercado_id" TEXT NOT NULL,
  "type" TEXT NOT NULL,
  "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "metadata" JSONB NOT NULL DEFAULT '{}',

  CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "user_events_user_id_mercado_id_idx"
  ON "user_events"("user_id", "mercado_id");
CREATE INDEX IF NOT EXISTS "user_events_mercado_id_timestamp_idx"
  ON "user_events"("mercado_id", "timestamp");
CREATE INDEX IF NOT EXISTS "user_events_type_timestamp_idx"
  ON "user_events"("type", "timestamp");
