-- CreateTable
CREATE TABLE IF NOT EXISTS "vendas" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "precoUnitario" DECIMAL(10,2) NOT NULL,
    "precoTotal" DECIMAL(10,2) NOT NULL,
    "desconto" DECIMAL(10,2) DEFAULT 0,
    "formaPagamento" TEXT,
    "clienteId" TEXT,
    "dataVenda" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "vendas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE IF NOT EXISTS "movimentacoes_estoque" (
    "id" TEXT NOT NULL,
    "estoqueId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "unidadeId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL,
    "quantidadeAnterior" INTEGER NOT NULL,
    "quantidadeNova" INTEGER NOT NULL,
    "motivo" TEXT,
    "observacao" TEXT,
    "responsavelId" TEXT,
    "dataMovimentacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "movimentacoes_estoque_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vendas_produtoId_dataVenda_idx" ON "vendas"("produtoId", "dataVenda");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vendas_unidadeId_dataVenda_idx" ON "vendas"("unidadeId", "dataVenda");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vendas_dataVenda_idx" ON "vendas"("dataVenda");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "vendas_produtoId_unidadeId_dataVenda_idx" ON "vendas"("produtoId", "unidadeId", "dataVenda");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movimentacoes_estoque_produtoId_dataMovimentacao_idx" ON "movimentacoes_estoque"("produtoId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movimentacoes_estoque_unidadeId_dataMovimentacao_idx" ON "movimentacoes_estoque"("unidadeId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movimentacoes_estoque_estoqueId_dataMovimentacao_idx" ON "movimentacoes_estoque"("estoqueId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movimentacoes_estoque_tipo_dataMovimentacao_idx" ON "movimentacoes_estoque"("tipo", "dataMovimentacao");

-- CreateIndex
CREATE INDEX IF NOT EXISTS "movimentacoes_estoque_dataMovimentacao_idx" ON "movimentacoes_estoque"("dataMovimentacao");

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "vendas" ADD CONSTRAINT "vendas_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_estoqueId_fkey" FOREIGN KEY ("estoqueId") REFERENCES "estoques"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "movimentacoes_estoque" ADD CONSTRAINT "movimentacoes_estoque_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

