-- CreateEnum
CREATE TYPE "AuthProvider" AS ENUM ('GOOGLE', 'FACEBOOK', 'APPLE', 'PHONE');

-- CreateEnum
CREATE TYPE "OtpChannel" AS ENUM ('SMS', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "Role" AS ENUM ('CLIENTE', 'GESTOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "StatusImportacao" AS ENUM ('PROCESSANDO', 'CONCLUIDO', 'FALHA', 'PARCIAL');

-- CreateEnum
CREATE TYPE "ImagemStatus" AS ENUM ('PENDENTE', 'AUTOMATICA', 'MANUAL', 'INVALIDA');

-- CreateEnum
CREATE TYPE "EstoqueFonte" AS ENUM ('UPLOAD_GESTOR', 'API_PARCEIRO', 'CROWD', 'MANUAL_GESTOR');

-- CreateTable
CREATE TABLE "acoes_gestor" (
    "id" TEXT NOT NULL,
    "mercadoId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "analiseId" TEXT,
    "resultadoEsperado" JSONB,
    "resultadoReal" JSONB,
    "executadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "avaliadaEm" TIMESTAMP(3),

    CONSTRAINT "acoes_gestor_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "alertas_ia" (
    "id" TEXT NOT NULL,
    "mercadoId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "produtoId" TEXT,
    "tipo" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL,
    "acaoRecomendada" TEXT,
    "linkAcao" TEXT,
    "lido" BOOLEAN NOT NULL DEFAULT false,
    "lidoEm" TIMESTAMP(3),
    "metadata" JSONB,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiradoEm" TIMESTAMP(3),

    CONSTRAINT "alertas_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "analises_ia" (
    "id" TEXT NOT NULL,
    "mercadoId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "produtoId" TEXT,
    "tipo" TEXT NOT NULL,
    "categoria" TEXT,
    "resultado" JSONB NOT NULL,
    "recomendacao" TEXT NOT NULL,
    "prioridade" TEXT NOT NULL,
    "impactoEstimado" DECIMAL(10,2),
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "feedbackGestor" TEXT,
    "aceitaEm" TIMESTAMP(3),
    "executadaEm" TIMESTAMP(3),
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiraEm" TIMESTAMP(3),

    CONSTRAINT "analises_ia_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "estoques" (
    "id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 0,
    "preco" DECIMAL(10,2) NOT NULL,
    "precoPromocional" DECIMAL(10,2),
    "emPromocao" BOOLEAN NOT NULL DEFAULT false,
    "disponivel" BOOLEAN NOT NULL DEFAULT true,
    "atualizadoEm" TIMESTAMP(3) NOT NULL,
    "fonte" "EstoqueFonte" NOT NULL DEFAULT 'UPLOAD_GESTOR',
    "confianca" INTEGER NOT NULL DEFAULT 70,
    "verificado_em" TIMESTAMP(3),
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "unidadeId" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,

    CONSTRAINT "estoques_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "vendas" (
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
CREATE TABLE "movimentacoes_estoque" (
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

-- CreateTable
CREATE TABLE "logs_importacao" (
    "id" TEXT NOT NULL,
    "nomeArquivo" TEXT NOT NULL,
    "tamanhoBytes" INTEGER NOT NULL,
    "totalLinhas" INTEGER NOT NULL DEFAULT 0,
    "linhasSucesso" INTEGER NOT NULL DEFAULT 0,
    "linhasErro" INTEGER NOT NULL DEFAULT 0,
    "linhasDuplicadas" INTEGER NOT NULL DEFAULT 0,
    "status" "StatusImportacao" NOT NULL DEFAULT 'PROCESSANDO',
    "mensagemErro" TEXT,
    "detalhesErros" TEXT,
    "dataInicio" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataFim" TIMESTAMP(3),
    "mercadoId" TEXT NOT NULL,

    CONSTRAINT "logs_importacao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "mercados" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cnpj" TEXT NOT NULL,
    "descricao" TEXT,
    "telefone" TEXT,
    "emailContato" TEXT,
    "horarioFuncionamento" TEXT,
    "logo" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "planoId" TEXT,
    "gestorId" TEXT,
    "sync_agendado" JSONB,
    "parceiro_tier" INTEGER NOT NULL DEFAULT 1,
    "parceiro_sla_contrato" JSONB,
    "parceiro_webhook" JSONB,
    "oferta_agregada" JSONB,
    "parceiro_ancora" JSONB,
    "monetizacao" JSONB,

    CONSTRAINT "mercados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metricas_dashboard" (
    "id" TEXT NOT NULL,
    "mercadoId" TEXT NOT NULL,
    "unidadeId" TEXT,
    "data" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "periodo" TEXT NOT NULL,
    "giroEstoqueGeral" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaRuptura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "valorEstoque" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "diasCobertura" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "produtosAtivos" INTEGER NOT NULL DEFAULT 0,
    "produtosInativos" INTEGER NOT NULL DEFAULT 0,
    "ticketMedio" DECIMAL(10,2) NOT NULL DEFAULT 0,
    "quantidadeVendas" INTEGER NOT NULL DEFAULT 0,
    "faturamentoDia" DECIMAL(12,2) NOT NULL DEFAULT 0,
    "margemLiquida" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "margemBruta" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaConversao" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "taxaRecompra" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "clientesAtivos" INTEGER NOT NULL DEFAULT 0,
    "clientesNovos" INTEGER NOT NULL DEFAULT 0,
    "nps" DOUBLE PRECISION,
    "churnRate" DOUBLE PRECISION,
    "variacaoD1" JSONB,
    "variacaoD7" JSONB,
    "variacaoD30" JSONB,

    CONSTRAINT "metricas_dashboard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "planos_de_pagamento" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "valor" DECIMAL(10,2) NOT NULL,
    "duracao" INTEGER NOT NULL,
    "limiteUnidades" INTEGER NOT NULL DEFAULT 1,
    "limiteUploadMb" INTEGER NOT NULL DEFAULT 10,
    "limiteUsuarios" INTEGER NOT NULL DEFAULT 5,
    "features" JSONB,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "planos_de_pagamento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "produtos" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "descricao" TEXT,
    "categoria" TEXT,
    "codigoBarras" TEXT,
    "marca" TEXT,
    "unidadeMedida" TEXT,
    "imagem" TEXT,
    "imagem_thumb" TEXT,
    "imagem_status" "ImagemStatus",
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "giroEstoqueMedio" DOUBLE PRECISION DEFAULT 0,
    "elasticidadePreco" DOUBLE PRECISION DEFAULT -1.2,
    "demandaPrevista7d" INTEGER DEFAULT 0,
    "demandaPrevista30d" INTEGER DEFAULT 0,
    "pontoReposicao" INTEGER DEFAULT 0,
    "margemContribuicao" DECIMAL(10,2) DEFAULT 0,
    "scoreSazonalidade" DOUBLE PRECISION DEFAULT 0.5,
    "categoriaABC" TEXT DEFAULT 'C',
    "ultimaAtualizacaoIA" TIMESTAMP(3),
    "nome_chave" VARCHAR(512),
    "chave_insight" VARCHAR(768),
    "mercado_id" TEXT,
    "sku_nacional" TEXT,
    "embedding_json" JSONB,

    CONSTRAINT "produtos_pkey" PRIMARY KEY ("id")
);

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

-- CreateTable
CREATE TABLE "produtos_relacionados" (
    "id" TEXT NOT NULL,
    "produtoId" TEXT NOT NULL,
    "produtoRelacionadoId" TEXT NOT NULL,
    "tipo" TEXT NOT NULL,
    "confianca" DOUBLE PRECISION NOT NULL,
    "suporte" DOUBLE PRECISION NOT NULL,
    "lift" DOUBLE PRECISION NOT NULL,
    "geradoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "produtos_relacionados_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "refresh_tokens" (
    "id" TEXT NOT NULL,
    "token_hash" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "revoked" BOOLEAN NOT NULL DEFAULT false,
    "revoked_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "user_agent" TEXT,
    "ip_address" TEXT,

    CONSTRAINT "refresh_tokens_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "auth_audit_logs" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "event" TEXT NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "metadata" JSONB DEFAULT '{}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "auth_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "social_identities" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "provider" "AuthProvider" NOT NULL,
    "provider_sub" TEXT NOT NULL,
    "email" TEXT,
    "email_verified" BOOLEAN NOT NULL DEFAULT false,
    "is_private_relay" BOOLEAN NOT NULL DEFAULT false,
    "display_name" TEXT,
    "avatar_url" TEXT,
    "provider_access_token" TEXT,
    "provider_refresh_token" TEXT,
    "provider_token_expires" TIMESTAMP(3),
    "raw_profile" JSONB,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "social_identities_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "phone_otp_challenges" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "code_hash" TEXT NOT NULL,
    "channel" "OtpChannel" NOT NULL DEFAULT 'SMS',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "max_attempts" INTEGER NOT NULL DEFAULT 5,
    "consumed_at" TIMESTAMP(3),
    "expires_at" TIMESTAMP(3) NOT NULL,
    "ip" TEXT,
    "user_agent" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "phone_otp_challenges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "unidades" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "endereco" TEXT,
    "bairro" TEXT,
    "cidade" TEXT,
    "estado" TEXT,
    "cep" TEXT,
    "telefone" TEXT,
    "horarioFuncionamento" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "ativa" BOOLEAN NOT NULL DEFAULT true,
    "dataCriacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dataAtualizacao" TIMESTAMP(3) NOT NULL,
    "mercadoId" TEXT NOT NULL,

    CONSTRAINT "unidades_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usuarios" (
    "id" TEXT NOT NULL,
    "nome" TEXT,
    "email" TEXT NOT NULL,
    "email_verified" TIMESTAMP(3),
    "imagem" TEXT,
    "senha_hash" TEXT,
    "role" "Role" NOT NULL DEFAULT 'CLIENTE',
    "token_version" INTEGER NOT NULL DEFAULT 0,
    "telefone" TEXT,
    "phone_verified" TIMESTAMP(3),
    "data_criacao" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "data_atualizacao" TIMESTAMP(3) NOT NULL,
    "ultimo_login" TIMESTAMP(3),
    "perfil_preci" JSONB,

    CONSTRAINT "usuarios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "verification_tokens" (
    "identifier" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expires" TIMESTAMP(3) NOT NULL
);

-- CreateTable
CREATE TABLE "badges" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "icon" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "requirementType" TEXT NOT NULL,
    "requirementValue" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_badges" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "badge_id" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "unlocked_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_badges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "listas_compras" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "usuario_id" TEXT NOT NULL,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "listas_compras_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itens_lista" (
    "id" TEXT NOT NULL,
    "lista_id" TEXT NOT NULL,
    "produto_id" TEXT NOT NULL,
    "quantidade" INTEGER NOT NULL DEFAULT 1,
    "comprado" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "itens_lista_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_streaks" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "current_streak" INTEGER NOT NULL DEFAULT 0,
    "longest_streak" INTEGER NOT NULL DEFAULT 0,
    "last_login" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_streaks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "savings_history" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "list_id" TEXT,
    "product_id" TEXT,
    "price_paid" INTEGER NOT NULL,
    "avg_price" INTEGER NOT NULL,
    "savings" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "savings_history_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "referrals" (
    "id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "referrer_id" TEXT NOT NULL,
    "referee_id" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" TIMESTAMP(3),

    CONSTRAINT "referrals_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "notification_subscriptions" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_subscriptions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_events" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mercado_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB NOT NULL DEFAULT '{}',

    CONSTRAINT "user_events_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "demo_requests" (
    "id" TEXT NOT NULL,
    "ticket_id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "empresa" TEXT NOT NULL,
    "cidade" TEXT NOT NULL,
    "telefone" TEXT,
    "interesse" TEXT NOT NULL,
    "porte" TEXT,
    "mensagem" TEXT,
    "origem" TEXT NOT NULL DEFAULT 'site-demo',
    "ip" TEXT,
    "status" TEXT NOT NULL DEFAULT 'novo',
    "notas" TEXT,
    "criado_em" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "atualizado_em" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "demo_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "nps_responses" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "mercado_id" TEXT NOT NULL,
    "score" INTEGER NOT NULL,
    "comment" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "nps_gatilho" VARCHAR(64),

    CONSTRAINT "nps_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "newsletter_subscribers" (
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

-- CreateIndex
CREATE INDEX "acoes_gestor_mercadoId_executadaEm_idx" ON "acoes_gestor"("mercadoId", "executadaEm");

-- CreateIndex
CREATE INDEX "acoes_gestor_userId_tipo_idx" ON "acoes_gestor"("userId", "tipo");

-- CreateIndex
CREATE INDEX "alertas_ia_criadoEm_idx" ON "alertas_ia"("criadoEm");

-- CreateIndex
CREATE INDEX "alertas_ia_mercadoId_lido_prioridade_idx" ON "alertas_ia"("mercadoId", "lido", "prioridade");

-- CreateIndex
CREATE INDEX "analises_ia_mercadoId_tipo_status_idx" ON "analises_ia"("mercadoId", "tipo", "status");

-- CreateIndex
CREATE INDEX "analises_ia_prioridade_status_idx" ON "analises_ia"("prioridade", "status");

-- CreateIndex
CREATE INDEX "analises_ia_unidadeId_criadoEm_idx" ON "analises_ia"("unidadeId", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "estoques_unidadeId_produtoId_key" ON "estoques"("unidadeId", "produtoId");

-- CreateIndex
CREATE INDEX "vendas_produtoId_dataVenda_idx" ON "vendas"("produtoId", "dataVenda");

-- CreateIndex
CREATE INDEX "vendas_unidadeId_dataVenda_idx" ON "vendas"("unidadeId", "dataVenda");

-- CreateIndex
CREATE INDEX "vendas_dataVenda_idx" ON "vendas"("dataVenda");

-- CreateIndex
CREATE INDEX "vendas_produtoId_unidadeId_dataVenda_idx" ON "vendas"("produtoId", "unidadeId", "dataVenda");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_produtoId_dataMovimentacao_idx" ON "movimentacoes_estoque"("produtoId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_unidadeId_dataMovimentacao_idx" ON "movimentacoes_estoque"("unidadeId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_estoqueId_dataMovimentacao_idx" ON "movimentacoes_estoque"("estoqueId", "dataMovimentacao");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_tipo_dataMovimentacao_idx" ON "movimentacoes_estoque"("tipo", "dataMovimentacao");

-- CreateIndex
CREATE INDEX "movimentacoes_estoque_dataMovimentacao_idx" ON "movimentacoes_estoque"("dataMovimentacao");

-- CreateIndex
CREATE UNIQUE INDEX "mercados_cnpj_key" ON "mercados"("cnpj");

-- CreateIndex
CREATE INDEX "metricas_dashboard_mercadoId_data_idx" ON "metricas_dashboard"("mercadoId", "data");

-- CreateIndex
CREATE UNIQUE INDEX "metricas_dashboard_mercadoId_data_periodo_key" ON "metricas_dashboard"("mercadoId", "data", "periodo");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_codigoBarras_key" ON "produtos"("codigoBarras");

-- CreateIndex
CREATE INDEX "produtos_nome_chave_idx" ON "produtos"("nome_chave");

-- CreateIndex
CREATE INDEX "produtos_chave_insight_idx" ON "produtos"("chave_insight");

-- CreateIndex
CREATE INDEX "produtos_sku_nacional_idx" ON "produtos"("sku_nacional");

-- CreateIndex
CREATE INDEX "produtos_imagem_status_idx" ON "produtos"("imagem_status");

-- CreateIndex
CREATE UNIQUE INDEX "produto_imagens_produto_id_key" ON "produto_imagens"("produto_id");

-- CreateIndex
CREATE INDEX "produto_imagens_status_idx" ON "produto_imagens"("status");

-- CreateIndex
CREATE INDEX "produtos_relacionados_produtoId_confianca_idx" ON "produtos_relacionados"("produtoId", "confianca");

-- CreateIndex
CREATE UNIQUE INDEX "produtos_relacionados_produtoId_produtoRelacionadoId_tipo_key" ON "produtos_relacionados"("produtoId", "produtoRelacionadoId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "refresh_tokens_token_hash_key" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_user_id_revoked_idx" ON "refresh_tokens"("user_id", "revoked");

-- CreateIndex
CREATE INDEX "refresh_tokens_token_hash_idx" ON "refresh_tokens"("token_hash");

-- CreateIndex
CREATE INDEX "refresh_tokens_expires_at_idx" ON "refresh_tokens"("expires_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_user_id_created_at_idx" ON "auth_audit_logs"("user_id", "created_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_event_created_at_idx" ON "auth_audit_logs"("event", "created_at");

-- CreateIndex
CREATE INDEX "auth_audit_logs_created_at_idx" ON "auth_audit_logs"("created_at");

-- CreateIndex
CREATE INDEX "social_identities_user_id_idx" ON "social_identities"("user_id");

-- CreateIndex
CREATE INDEX "social_identities_email_idx" ON "social_identities"("email");

-- CreateIndex
CREATE UNIQUE INDEX "social_identities_provider_provider_sub_key" ON "social_identities"("provider", "provider_sub");

-- CreateIndex
CREATE INDEX "phone_otp_challenges_phone_expires_at_idx" ON "phone_otp_challenges"("phone", "expires_at");

-- CreateIndex
CREATE INDEX "phone_otp_challenges_expires_at_idx" ON "phone_otp_challenges"("expires_at");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_email_key" ON "usuarios"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usuarios_telefone_key" ON "usuarios"("telefone");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_token_key" ON "verification_tokens"("token");

-- CreateIndex
CREATE UNIQUE INDEX "verification_tokens_identifier_token_key" ON "verification_tokens"("identifier", "token");

-- CreateIndex
CREATE UNIQUE INDEX "user_badges_user_id_badge_id_key" ON "user_badges"("user_id", "badge_id");

-- CreateIndex
CREATE INDEX "listas_compras_usuario_id_idx" ON "listas_compras"("usuario_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_streaks_user_id_key" ON "user_streaks"("user_id");

-- CreateIndex
CREATE INDEX "savings_history_user_id_date_idx" ON "savings_history"("user_id", "date");

-- CreateIndex
CREATE UNIQUE INDEX "referrals_code_key" ON "referrals"("code");

-- CreateIndex
CREATE UNIQUE INDEX "notification_subscriptions_token_key" ON "notification_subscriptions"("token");

-- CreateIndex
CREATE INDEX "notification_subscriptions_user_id_idx" ON "notification_subscriptions"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "notification_subscriptions_user_id_token_key" ON "notification_subscriptions"("user_id", "token");

-- CreateIndex
CREATE INDEX "user_events_user_id_mercado_id_idx" ON "user_events"("user_id", "mercado_id");

-- CreateIndex
CREATE INDEX "user_events_mercado_id_timestamp_idx" ON "user_events"("mercado_id", "timestamp");

-- CreateIndex
CREATE INDEX "user_events_type_timestamp_idx" ON "user_events"("type", "timestamp");

-- CreateIndex
CREATE UNIQUE INDEX "demo_requests_ticket_id_key" ON "demo_requests"("ticket_id");

-- CreateIndex
CREATE INDEX "demo_requests_status_criado_em_idx" ON "demo_requests"("status", "criado_em");

-- CreateIndex
CREATE INDEX "demo_requests_email_idx" ON "demo_requests"("email");

-- CreateIndex
CREATE INDEX "nps_responses_mercado_id_created_at_idx" ON "nps_responses"("mercado_id", "created_at");

-- CreateIndex
CREATE UNIQUE INDEX "newsletter_subscribers_email_key" ON "newsletter_subscribers"("email");

-- CreateIndex
CREATE INDEX "newsletter_subscribers_status_idx" ON "newsletter_subscribers"("status");

-- AddForeignKey
ALTER TABLE "acoes_gestor" ADD CONSTRAINT "acoes_gestor_analiseId_fkey" FOREIGN KEY ("analiseId") REFERENCES "analises_ia"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_gestor" ADD CONSTRAINT "acoes_gestor_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "acoes_gestor" ADD CONSTRAINT "acoes_gestor_userId_fkey" FOREIGN KEY ("userId") REFERENCES "usuarios"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_ia" ADD CONSTRAINT "alertas_ia_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_ia" ADD CONSTRAINT "alertas_ia_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "alertas_ia" ADD CONSTRAINT "alertas_ia_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "analises_ia" ADD CONSTRAINT "analises_ia_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "estoques" ADD CONSTRAINT "estoques_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

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

-- AddForeignKey
ALTER TABLE "logs_importacao" ADD CONSTRAINT "logs_importacao_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mercados" ADD CONSTRAINT "mercados_gestorId_fkey" FOREIGN KEY ("gestorId") REFERENCES "usuarios"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "mercados" ADD CONSTRAINT "mercados_planoId_fkey" FOREIGN KEY ("planoId") REFERENCES "planos_de_pagamento"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricas_dashboard" ADD CONSTRAINT "metricas_dashboard_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "metricas_dashboard" ADD CONSTRAINT "metricas_dashboard_unidadeId_fkey" FOREIGN KEY ("unidadeId") REFERENCES "unidades"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produto_imagens" ADD CONSTRAINT "produto_imagens_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_relacionados" ADD CONSTRAINT "produtos_relacionados_produtoId_fkey" FOREIGN KEY ("produtoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "produtos_relacionados" ADD CONSTRAINT "produtos_relacionados_produtoRelacionadoId_fkey" FOREIGN KEY ("produtoRelacionadoId") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "refresh_tokens" ADD CONSTRAINT "refresh_tokens_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "social_identities" ADD CONSTRAINT "social_identities_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "unidades" ADD CONSTRAINT "unidades_mercadoId_fkey" FOREIGN KEY ("mercadoId") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_badges" ADD CONSTRAINT "user_badges_badge_id_fkey" FOREIGN KEY ("badge_id") REFERENCES "badges"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_lista" ADD CONSTRAINT "itens_lista_lista_id_fkey" FOREIGN KEY ("lista_id") REFERENCES "listas_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itens_lista" ADD CONSTRAINT "itens_lista_produto_id_fkey" FOREIGN KEY ("produto_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_streaks" ADD CONSTRAINT "user_streaks_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_list_id_fkey" FOREIGN KEY ("list_id") REFERENCES "listas_compras"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "savings_history" ADD CONSTRAINT "savings_history_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "produtos"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referrer_id_fkey" FOREIGN KEY ("referrer_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "referrals" ADD CONSTRAINT "referrals_referee_id_fkey" FOREIGN KEY ("referee_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "notification_subscriptions" ADD CONSTRAINT "notification_subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_mercado_id_fkey" FOREIGN KEY ("mercado_id") REFERENCES "mercados"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "nps_responses" ADD CONSTRAINT "nps_responses_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "usuarios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

