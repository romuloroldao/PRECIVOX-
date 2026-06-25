-- Assinantes da newsletter (opt-in via cadastro ou formulário público)
CREATE TABLE IF NOT EXISTS "newsletter_subscribers" (
  "id" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "nome" TEXT,
  "status" TEXT NOT NULL DEFAULT 'active',
  "origem" TEXT NOT NULL DEFAULT 'site',
  "unsubscribed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "newsletter_subscribers_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "newsletter_subscribers_email_key"
  ON "newsletter_subscribers"("email");
CREATE INDEX IF NOT EXISTS "newsletter_subscribers_status_idx"
  ON "newsletter_subscribers"("status");
