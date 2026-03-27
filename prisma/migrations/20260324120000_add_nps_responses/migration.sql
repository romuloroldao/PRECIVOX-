-- CreateTable
CREATE TABLE IF NOT EXISTS "nps_responses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mercado_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "nps_responses_mercado_id_created_at_idx" ON "nps_responses"("mercado_id", "created_at");

ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_mercado_id_fkey" FOREIGN KEY ("mercado_id") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;
