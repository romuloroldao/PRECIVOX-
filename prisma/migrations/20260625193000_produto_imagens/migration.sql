-- CreateEnum
CREATE TYPE "ImagemStatus" AS ENUM ('PENDENTE', 'AUTOMATICA', 'MANUAL', 'INVALIDA');

-- AlterTable
ALTER TABLE "produtos" ADD COLUMN "imagem_thumb" TEXT,
ADD COLUMN "imagem_status" "ImagemStatus";

-- CreateTable
CREATE TABLE "produto_imagens" (
    "id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "status" "ImagemStatus" NOT NULL DEFAULT 'PENDENTE',
    "auto_url" TEXT,
    "auto_thumb_url" TEXT,
    "auto_hash" TEXT,
    "auto_origem" TEXT,
    "auto_fonte_url" TEXT,
    "auto_ean" TEXT,
    "manual_url" TEXT,
    "manual_thumb_url" TEXT,
    "manual_hash" TEXT,
    "manual_origem" TEXT,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "ultimo_erro" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "produto_imagens_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "produto_imagens_produto_id_key" ON "produto_imagens"("produto_id");

-- CreateIndex
CREATE INDEX "produto_imagens_status_idx" ON "produto_imagens"("status");

-- CreateIndex
CREATE INDEX "produtos_imagem_status_idx" ON "produtos"("imagem_status");

-- AddForeignKey
ALTER TABLE "produto_imagens" ADD CONSTRAINT "produto_imagens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;
