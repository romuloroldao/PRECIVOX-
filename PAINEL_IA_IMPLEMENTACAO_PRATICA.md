# 🛠️ Guia Prático de Implementação - Painel de IA do Gestor

## 📚 Índice
1. [Expansão do Schema Prisma](#1-expansão-do-schema-prisma)
2. [Implementação dos Endpoints de IA](#2-implementação-dos-endpoints-de-ia)
3. [Componentes React do Painel](#3-componentes-react-do-painel)
4. [Jobs de Processamento de IA](#4-jobs-de-processamento-de-ia)
5. [Exemplos de Modelos Preditivos](#5-exemplos-de-modelos-preditivos)
6. [Sistema de Alertas](#6-sistema-de-alertas)

---

## 1. Expansão do Schema Prisma

### Arquivo: `prisma/schema.prisma`

```prisma
// ============================================
// EXTENSÕES PARA IA - ADICIONAR AO SCHEMA EXISTENTE
// ============================================

// Modelo existente Produto - ADICIONAR campos:
model Produto {
  id                    String    @id @default(cuid())
  nome                  String
  descricao             String?
  categoria             String?
  codigoBarras          String?   @unique
  marca                 String?
  unidadeMedida         String?
  
  // 🆕 CAMPOS DE INTELIGÊNCIA ARTIFICIAL
  giroEstoqueMedio      Float?    @default(0)        // Calculado: vendas/estoque médio
  elasticidadePreco     Float?    @default(-1.2)     // Coeficiente de elasticidade
  demandaPrevista7d     Int?      @default(0)        // Previsão 7 dias
  demandaPrevista30d    Int?      @default(0)        // Previsão 30 dias
  pontoReposicao        Int?      @default(0)        // Quantidade crítica
  margemContribuicao    Decimal?  @default(0)        // Margem unitária
  scoreSazonalidade     Float?    @default(0.5)      // 0 (não sazonal) a 1 (altamente sazonal)
  categoriaABC          String?   @default("C")      // A (20% top), B (30%), C (50% cauda longa)
  ultimaAtualizacaoIA   DateTime? @updatedAt
  
  // Relacionamentos existentes + novos
  estoques              Estoque[]
  analises              AnaliseIA[]
  produtosRelacionados  ProdutoRelacionado[] @relation("ProdutoPrincipal")
  relacionadoCom        ProdutoRelacionado[] @relation("ProdutoRelacionado")
  
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
}

// 🆕 NOVO: Tabela de Análises de IA
model AnaliseIA {
  id                String   @id @default(cuid())
  mercadoId         String
  unidadeId         String?
  produtoId         String?
  
  tipo              String   // DEMANDA, RUPTURA, PROMOCAO, ELASTICIDADE, SAZONALIDADE
  categoria         String?  // Para análises agregadas por categoria
  
  resultado         Json     // Estrutura flexível com resultados
  // Exemplo para DEMANDA:
  // {
  //   "previsao7d": 125,
  //   "previsao30d": 540,
  //   "intervaloConfianca": [115, 135],
  //   "acuracia": 0.87,
  //   "metodoUtilizado": "ARIMA"
  // }
  
  recomendacao      String   @db.Text  // Texto formatado da recomendação
  prioridade        String   // BAIXA, MEDIA, ALTA, CRITICA
  impactoEstimado   Decimal? // Impacto financeiro estimado (R$)
  
  status            String   @default("PENDENTE")  // PENDENTE, ACEITA, REJEITADA, EXECUTADA
  feedbackGestor    String?  // Comentário do gestor
  aceitaEm          DateTime?
  executadaEm       DateTime?
  
  criadoEm          DateTime @default(now())
  expiraEm          DateTime? // Análises podem ter validade
  
  // Relacionamentos
  mercado           Mercado  @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  unidade           Unidade? @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  produto           Produto? @relation(fields: [produtoId], references: [id], onDelete: Cascade)
  
  @@index([mercadoId, tipo, status])
  @@index([unidadeId, criadoEm])
  @@index([prioridade, status])
}

// 🆕 NOVO: Tabela de Alertas Inteligentes
model AlertaIA {
  id                String   @id @default(cuid())
  mercadoId         String
  unidadeId         String?
  produtoId         String?
  
  tipo              String   // RUPTURA, OPORTUNIDADE, PERFORMANCE, ANOMALIA, SAZONAL
  titulo            String   // Ex: "Ruptura iminente em 3 produtos"
  descricao         String   @db.Text
  prioridade        String   // BAIXA, MEDIA, ALTA, CRITICA
  
  acaoRecomendada   String?  @db.Text
  linkAcao          String?  // URL para ação (ex: /ia/compras/produto/123)
  
  lido              Boolean  @default(false)
  lidoEm            DateTime?
  
  metadata          Json?    // Dados adicionais
  // Exemplo:
  // {
  //   "produtos": ["prod1", "prod2"],
  //   "estoqueAtual": 12,
  //   "diasRestantes": 2.5
  // }
  
  criadoEm          DateTime @default(now())
  expiradoEm        DateTime? // Alertas podem expirar
  
  // Relacionamentos
  mercado           Mercado  @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  unidade           Unidade? @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  produto           Produto? @relation(fields: [produtoId], references: [id], onDelete: SetNull)
  
  @@index([mercadoId, lido, prioridade])
  @@index([criadoEm])
}

// 🆕 NOVO: Métricas Consolidadas do Dashboard
model MetricasDashboard {
  id                String   @id @default(cuid())
  mercadoId         String
  unidadeId         String?
  data              DateTime @default(now())
  periodo           String   // DIA, SEMANA, MES
  
  // 📊 Métricas de Estoque
  giroEstoqueGeral  Float    @default(0)
  taxaRuptura       Float    @default(0)      // % de produtos com estoque < ponto reposição
  valorEstoque      Decimal  @default(0)
  diasCobertura     Float    @default(0)      // Dias até ruptura total (média)
  produtosAtivos    Int      @default(0)
  produtosInativos  Int      @default(0)
  
  // 💰 Métricas de Vendas
  ticketMedio       Decimal  @default(0)
  quantidadeVendas  Int      @default(0)
  faturamentoDia    Decimal  @default(0)
  margemLiquida     Float    @default(0)
  margemBruta       Float    @default(0)
  
  // 👥 Métricas de Cliente
  taxaConversao     Float    @default(0)
  taxaRecompra      Float    @default(0)
  clientesAtivos    Int      @default(0)
  clientesNovos     Int      @default(0)
  nps               Float?
  churnRate         Float?
  
  // 📈 Comparações
  variacaoD1        Json?    // Variação vs. dia anterior
  variacaoD7        Json?    // Variação vs. semana anterior
  variacaoD30       Json?    // Variação vs. mês anterior
  
  // Relacionamentos
  mercado           Mercado  @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  unidade           Unidade? @relation(fields: [unidadeId], references: [id], onDelete: Cascade)
  
  @@unique([mercadoId, data, periodo])
  @@index([mercadoId, data])
}

// 🆕 NOVO: Produtos Relacionados (Cross-sell/Upsell)
model ProdutoRelacionado {
  id                String   @id @default(cuid())
  produtoId         String
  produtoRelacionadoId String
  
  tipo              String   // CROSS_SELL, UPSELL, SUBSTITUTO
  confianca         Float    // 0 a 1 (frequência de compra conjunta)
  suporte           Float    // 0 a 1 (% de transações com ambos)
  lift              Float    // Fator de aumento (>1 indica correlação positiva)
  
  geradoEm          DateTime @default(now())
  
  // Relacionamentos
  produto           Produto  @relation("ProdutoPrincipal", fields: [produtoId], references: [id], onDelete: Cascade)
  relacionado       Produto  @relation("ProdutoRelacionado", fields: [produtoRelacionadoId], references: [id], onDelete: Cascade)
  
  @@unique([produtoId, produtoRelacionadoId, tipo])
  @@index([produtoId, confianca])
}

// 🆕 NOVO: Histórico de Ações do Gestor
model AcaoGestor {
  id                String   @id @default(cuid())
  mercadoId         String
  userId            String
  
  tipo              String   // REPOSICAO, PROMOCAO, AJUSTE_PRECO, ACEITAR_RECOMENDACAO
  descricao         String   @db.Text
  
  analiseId         String?  // Se foi baseado em uma análise de IA
  
  resultadoEsperado Json?    // O que a IA previa
  resultadoReal     Json?    // O que aconteceu de fato (preenchido depois)
  
  executadaEm       DateTime @default(now())
  avaliadaEm        DateTime? // Quando foi medido o resultado
  
  // Relacionamentos
  mercado           Mercado  @relation(fields: [mercadoId], references: [id], onDelete: Cascade)
  usuario           User     @relation(fields: [userId], references: [id])
  analise           AnaliseIA? @relation(fields: [analiseId], references: [id], onDelete: SetNull)
  
  @@index([mercadoId, executadaEm])
  @@index([userId, tipo])
}

// Adicionar relacionamentos aos modelos existentes:

model Mercado {
  // ... campos existentes
  
  // 🆕 Novos relacionamentos
  analises          AnaliseIA[]
  alertas           AlertaIA[]
  metricas          MetricasDashboard[]
  acoes             AcaoGestor[]
}

model Unidade {
  // ... campos existentes
  
  // 🆕 Novos relacionamentos
  analises          AnaliseIA[]
  alertas           AlertaIA[]
  metricas          MetricasDashboard[]
}

model User {
  // ... campos existentes
  
  // 🆕 Novos relacionamentos
  acoes             AcaoGestor[]
}
```

### Migration:

```bash
# Criar migration
npx prisma migrate dev --name add_ai_features

# Gerar cliente Prisma
npx prisma generate
```

---

## 2. Implementação dos Endpoints de IA

### Arquivo: `backend/routes/ia.ts`

```typescript
import express from 'express';
import { authenticate, authorizeRole, canAccessMercado } from '../middleware/auth';
import {
  getDashboardIA,
  getModuloCompras,
  getModuloPromocoes,
  getModuloConversao,
  getAlertas,
  marcarAlertaComoLido,
  aceitarRecomendacao,
  rejeitarRecomendacao,
  gerarPedidoAutomatico,
  simularPromocao,
  aplicarPromocao,
  getFeedbackIA
} from '../controllers/iaController';

const router = express.Router();

// ============================================
// ROTAS DE IA DO PAINEL DO GESTOR
// ============================================

// Dashboard Principal
router.get(
  '/dashboard/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getDashboardIA
);

// Módulo 1: Compras e Reposição
router.get(
  '/compras/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getModuloCompras
);

router.post(
  '/compras/:mercadoId/gerar-pedido',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  gerarPedidoAutomatico
);

// Módulo 2: Promoções e Precificação
router.get(
  '/promocoes/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getModuloPromocoes
);

router.post(
  '/promocoes/:mercadoId/simular',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  simularPromocao
);

router.post(
  '/promocoes/:mercadoId/aplicar',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  aplicarPromocao
);

// Módulo 3: Conversão e Fidelização
router.get(
  '/conversao/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getModuloConversao
);

// Alertas
router.get(
  '/alertas/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getAlertas
);

router.put(
  '/alertas/:alertaId/marcar-lido',
  authenticate,
  marcarAlertaComoLido
);

// Feedback de Recomendações
router.post(
  '/recomendacoes/:analiseId/aceitar',
  authenticate,
  aceitarRecomendacao
);

router.post(
  '/recomendacoes/:analiseId/rejeitar',
  authenticate,
  rejeitarRecomendacao
);

// Métricas de Performance da IA
router.get(
  '/feedback/:mercadoId',
  authenticate,
  authorizeRole('ADMIN', 'GESTOR'),
  canAccessMercado,
  getFeedbackIA
);

export default router;
```

### Arquivo: `backend/controllers/iaController.ts`

```typescript
import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import {
  calcularGiroEstoque,
  calcularTaxaRuptura,
  preverDemanda,
  calcularElasticidade,
  identificarProdutosRelacionados,
  gerarRecomendacoesReposicao,
  gerarRecomendacoesPromocao,
  calcularMetricasConversao
} from '../services/iaService';

const prisma = new PrismaClient();

// ============================================
// DASHBOARD PRINCIPAL
// ============================================
export const getDashboardIA = async (req: Request, res: Response) => {
  try {
    const { mercadoId } = req.params;
    const userId = req.user?.id;

    // 1. Buscar alertas críticos (não lidos, prioridade ALTA ou CRITICA)
    const alertasCriticos = await prisma.alertaIA.findMany({
      where: {
        mercadoId,
        lido: false,
        prioridade: { in: ['ALTA', 'CRITICA'] },
        OR: [
          { expiradoEm: null },
          { expiradoEm: { gt: new Date() } }
        ]
      },
      orderBy: [
        { prioridade: 'desc' },
        { criadoEm: 'desc' }
      ],
      take: 5,
      include: {
        produto: { select: { nome: true } },
        unidade: { select: { nome: true } }
      }
    });

    // 2. Buscar métricas do dia atual
    const hoje = new Date();
    hoje.setHours(0, 0, 0, 0);

    let metricas = await prisma.metricasDashboard.findFirst({
      where: {
        mercadoId,
        data: hoje,
        periodo: 'DIA'
      }
    });

    // Se não existir, calcular
    if (!metricas) {
      metricas = await calcularMetricasDia(mercadoId);
    }

    // 3. Contar análises pendentes por módulo
    const analisesPendentes = await prisma.analiseIA.groupBy({
      by: ['tipo'],
      where: {
        mercadoId,
        status: 'PENDENTE',
        OR: [
          { expiraEm: null },
          { expiraEm: { gt: new Date() } }
        ]
      },
      _count: { id: true }
    });

    // 4. Buscar unidades do mercado
    const unidades = await prisma.unidade.findMany({
      where: { mercadoId },
      select: {
        id: true,
        nome: true,
        _count: { select: { estoques: true } }
      }
    });

    // 5. Calcular variações (comparar com ontem)
    const ontem = new Date(hoje);
    ontem.setDate(ontem.getDate() - 1);
    
    const metricasOntem = await prisma.metricasDashboard.findFirst({
      where: {
        mercadoId,
        data: ontem,
        periodo: 'DIA'
      }
    });

    const variacoes = calcularVariacoes(metricas, metricasOntem);

    // 6. Resposta
    res.json({
      success: true,
      data: {
        alertasCriticos: alertasCriticos.map(a => ({
          id: a.id,
          tipo: a.tipo,
          titulo: a.titulo,
          descricao: a.descricao,
          prioridade: a.prioridade,
          acaoRecomendada: a.acaoRecomendada,
          linkAcao: a.linkAcao,
          produto: a.produto?.nome,
          unidade: a.unidade?.nome,
          criadoEm: a.criadoEm
        })),
        
        visaoExecutiva: {
          giroEstoque: {
            valor: metricas.giroEstoqueGeral,
            variacao: variacoes.giroEstoque,
            tendencia: variacoes.giroEstoque > 0 ? 'up' : 'down'
          },
          taxaRuptura: {
            valor: metricas.taxaRuptura,
            variacao: variacoes.taxaRuptura,
            tendencia: variacoes.taxaRuptura < 0 ? 'up' : 'down' // Negativo é bom
          },
          ticketMedio: {
            valor: metricas.ticketMedio,
            variacao: variacoes.ticketMedio,
            tendencia: variacoes.ticketMedio > 0 ? 'up' : 'down'
          },
          margemLiquida: {
            valor: metricas.margemLiquida,
            variacao: variacoes.margemLiquida,
            tendencia: variacoes.margemLiquida > 0 ? 'up' : 'down'
          }
        },
        
        modulosIA: {
          compras: {
            insightsPendentes: analisesPendentes.find(a => a.tipo === 'DEMANDA')?._count.id || 0
          },
          promocoes: {
            oportunidades: analisesPendentes.find(a => a.tipo === 'PROMOCAO')?._count.id || 0
          },
          conversao: {
            acoesSugeridas: analisesPendentes.find(a => a.tipo === 'PERFORMANCE')?._count.id || 0
          }
        },
        
        unidades,
        
        ultimaAtualizacao: new Date()
      }
    });

  } catch (error) {
    console.error('Erro ao buscar dashboard IA:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar dashboard de IA' 
    });
  }
};

// ============================================
// MÓDULO 1: COMPRAS E REPOSIÇÃO
// ============================================
export const getModuloCompras = async (req: Request, res: Response) => {
  try {
    const { mercadoId } = req.params;
    const { unidadeId, categoria } = req.query;

    // 1. Buscar produtos com estoque
    const estoques = await prisma.estoque.findMany({
      where: {
        unidade: { mercadoId },
        ...(unidadeId && { unidadeId: unidadeId as string }),
        ...(categoria && { produto: { categoria: categoria as string } })
      },
      include: {
        produto: true,
        unidade: { select: { nome: true } }
      }
    });

    // 2. Calcular giro de estoque por categoria
    const giroPorCategoria = await calcularGiroEstoquePorCategoria(mercadoId);

    // 3. Identificar produtos em risco de ruptura
    const produtosEmRuptura = estoques.filter(e => {
      const diasRestantes = e.quantidade / (e.produto.demandaPrevista7d || 1) * 7;
      return diasRestantes < 3;
    }).map(e => ({
      id: e.produto.id,
      nome: e.produto.nome,
      unidade: e.unidade.nome,
      estoqueAtual: e.quantidade,
      demandaDiaria: (e.produto.demandaPrevista7d || 0) / 7,
      diasRestantes: e.quantidade / ((e.produto.demandaPrevista7d || 1) / 7),
      quantidadeRepor: Math.ceil((e.produto.demandaPrevista30d || 0) - e.quantidade),
      prioridade: e.quantidade / ((e.produto.demandaPrevista7d || 1) / 7) < 1 ? 'CRITICA' : 'ALTA'
    }));

    // 4. Análise de ciclo de vida
    const cicloVida = await analisarCicloVida(mercadoId);

    // 5. Tendências regionais (simulado - em produção, consultar dados externos)
    const tendenciasRegionais = [
      {
        produto: "Água de Coco 1L",
        variacaoDemanda: 30,
        insight: "Demanda cresceu 30% na sua região nas últimas 2 semanas",
        acao: "Aumentar estoque em 40%"
      }
    ];

    // 6. Recomendações de reposição
    const recomendacoes = await gerarRecomendacoesReposicao(mercadoId, unidadeId as string);

    res.json({
      success: true,
      data: {
        giroPorCategoria,
        produtosEmRuptura,
        cicloVida,
        tendenciasRegionais,
        recomendacoes,
        resumo: {
          totalProdutos: estoques.length,
          emRupturaCritica: produtosEmRuptura.filter(p => p.prioridade === 'CRITICA').length,
          emRupturaAlta: produtosEmRuptura.filter(p => p.prioridade === 'ALTA').length,
          giroMedio: giroPorCategoria.reduce((acc, g) => acc + g.giro, 0) / (giroPorCategoria.length || 1)
        }
      }
    });

  } catch (error) {
    console.error('Erro ao buscar módulo de compras:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar módulo de compras' 
    });
  }
};

// ============================================
// MÓDULO 2: PROMOÇÕES E PRECIFICAÇÃO
// ============================================
export const getModuloPromocoes = async (req: Request, res: Response) => {
  try {
    const { mercadoId } = req.params;

    // 1. Análise de elasticidade
    const elasticidade = await calcularElasticidadeProdutos(mercadoId);

    // 2. Produtos correlatos (cross-sell)
    const produtosCorrelatos = await prisma.produtoRelacionado.findMany({
      where: {
        produto: {
          estoques: {
            some: {
              unidade: { mercadoId }
            }
          }
        },
        tipo: 'CROSS_SELL',
        confianca: { gte: 0.6 }
      },
      include: {
        produto: { select: { nome: true } },
        relacionado: { select: { nome: true } }
      },
      take: 10,
      orderBy: { lift: 'desc' }
    });

    // 3. Histórico de promoções
    const historico = await prisma.acaoGestor.findMany({
      where: {
        mercadoId,
        tipo: 'PROMOCAO'
      },
      orderBy: { executadaEm: 'desc' },
      take: 10
    });

    // 4. Oportunidades de promoção
    const oportunidades = await gerarOportunidadesPromocao(mercadoId);

    res.json({
      success: true,
      data: {
        elasticidade,
        produtosCorrelatos: produtosCorrelatos.map(p => ({
          produtoPrincipal: p.produto.nome,
          produtoRelacionado: p.relacionado.nome,
          confianca: Math.round(p.confianca * 100),
          sugestao: `Clientes que compraram "${p.produto.nome}" também compraram "${p.relacionado.nome}" em ${Math.round(p.confianca * 100)}% das vezes`
        })),
        historico,
        oportunidades
      }
    });

  } catch (error) {
    console.error('Erro ao buscar módulo de promoções:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Erro ao buscar módulo de promoções' 
    });
  }
};

// ============================================
// FUNÇÕES AUXILIARES
// ============================================

async function calcularMetricasDia(mercadoId: string) {
  // Implementar cálculo real das métricas
  // Por enquanto, retornar valores simulados
  return await prisma.metricasDashboard.create({
    data: {
      mercadoId,
      data: new Date(),
      periodo: 'DIA',
      giroEstoqueGeral: 4.2,
      taxaRuptura: 2.3,
      ticketMedio: 87.30,
      margemLiquida: 18.5,
      // ... outros campos
    }
  });
}

function calcularVariacoes(atual: any, anterior: any | null) {
  if (!anterior) {
    return {
      giroEstoque: 0,
      taxaRuptura: 0,
      ticketMedio: 0,
      margemLiquida: 0
    };
  }

  return {
    giroEstoque: ((atual.giroEstoqueGeral - anterior.giroEstoqueGeral) / anterior.giroEstoqueGeral * 100),
    taxaRuptura: ((atual.taxaRuptura - anterior.taxaRuptura) / anterior.taxaRuptura * 100),
    ticketMedio: ((Number(atual.ticketMedio) - Number(anterior.ticketMedio)) / Number(anterior.ticketMedio) * 100),
    margemLiquida: ((atual.margemLiquida - anterior.margemLiquida) / anterior.margemLiquida * 100)
  };
}

async function calcularGiroEstoquePorCategoria(mercadoId: string) {
  // Agrupar por categoria e calcular giro
  const categorias = await prisma.produto.groupBy({
    by: ['categoria'],
    where: {
      estoques: {
        some: {
          unidade: { mercadoId }
        }
      }
    },
    _avg: {
      giroEstoqueMedio: true
    }
  });

  return categorias.map(c => ({
    categoria: c.categoria || 'Sem categoria',
    giro: c._avg.giroEstoqueMedio || 0,
    status: (c._avg.giroEstoqueMedio || 0) > 4 ? 'ACIMA' : ((c._avg.giroEstoqueMedio || 0) < 2 ? 'ABAIXO' : 'MEDIA')
  }));
}

// ... outras funções auxiliares

export {
  calcularGiroEstoquePorCategoria,
  // ... exportar outras funções úteis
};
```

---

## 3. Componentes React do Painel

### Arquivo: `app/gestor/ia/page.tsx`

```tsx
'use client';

import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/DashboardLayout';
import AlertasPrioritarios from '@/components/ia/AlertasPrioritarios';
import VisaoExecutiva from '@/components/ia/VisaoExecutiva';
import ModulosIA from '@/components/ia/ModulosIA';
import { fetchDashboardIA } from '@/lib/api/ia';

export default function PainelIAGestor() {
  const [dashboard, setDashboard] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mercadoId, setMercadoId] = useState<string | null>(null);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      setLoading(true);
      
      // Buscar mercado do gestor
      const token = localStorage.getItem('token');
      const mercadosResponse = await fetch('/api/mercados', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (mercadosResponse.ok) {
        const mercados = await mercadosResponse.json();
        if (mercados.length > 0) {
          const meuMercado = mercados[0];
          setMercadoId(meuMercado.id);
          
          // Buscar dashboard de IA
          const dashboardData = await fetchDashboardIA(meuMercado.id);
          setDashboard(dashboardData);
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dashboard IA:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-precivox-blue mx-auto mb-4"></div>
            <p className="text-gray-600">Carregando inteligência...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!dashboard) {
    return (
      <DashboardLayout role="GESTOR">
        <div className="text-center py-12">
          <p className="text-gray-600">Nenhum dado disponível</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="GESTOR">
      <div className="space-y-6">
        {/* Header */}
        <div className="bg-gradient-to-r from-precivox-blue to-blue-600 rounded-2xl p-8 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">🤖 Painel de Inteligência Artificial</h1>
              <p className="text-lg opacity-90">
                Insights preditivos e recomendações acionáveis para seu supermercado
              </p>
            </div>
            <div className="text-right">
              <p className="text-sm opacity-75">Última atualização</p>
              <p className="font-semibold">
                {new Date(dashboard.ultimaAtualizacao).toLocaleString('pt-BR')}
              </p>
            </div>
          </div>
        </div>

        {/* Alertas Críticos */}
        {dashboard.alertasCriticos.length > 0 && (
          <AlertasPrioritarios
            alertas={dashboard.alertasCriticos}
            onAtualizacao={loadDashboard}
          />
        )}

        {/* Visão Executiva - Cards de Métricas */}
        <VisaoExecutiva metricas={dashboard.visaoExecutiva} />

        {/* Módulos de IA */}
        <ModulosIA
          mercadoId={mercadoId!}
          modulosIA={dashboard.modulosIA}
        />

        {/* Unidades - Quick Access */}
        <div className="bg-white rounded-xl shadow-md p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Suas Unidades</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {dashboard.unidades.map((unidade: any) => (
              <div key={unidade.id} className="border border-gray-200 rounded-lg p-4 hover:border-precivox-blue transition-colors">
                <h3 className="font-semibold text-gray-900">{unidade.nome}</h3>
                <p className="text-sm text-gray-600 mt-1">
                  {unidade._count.estoques} produtos em estoque
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
```

### Arquivo: `components/ia/AlertasPrioritarios.tsx`

```tsx
'use client';

interface Alerta {
  id: string;
  tipo: string;
  titulo: string;
  descricao: string;
  prioridade: 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
  acaoRecomendada?: string;
  linkAcao?: string;
  produto?: string;
  unidade?: string;
  criadoEm: string;
}

interface AlertasPrioritariosProps {
  alertas: Alerta[];
  onAtualizacao: () => void;
}

export default function AlertasPrioritarios({ alertas, onAtualizacao }: AlertasPrioritariosProps) {
  const corPrioridade = {
    BAIXA: 'bg-gray-50 border-gray-300',
    MEDIA: 'bg-blue-50 border-blue-300',
    ALTA: 'bg-orange-50 border-orange-400',
    CRITICA: 'bg-red-50 border-red-500'
  };

  const iconePrioridade = {
    BAIXA: 'ℹ️',
    MEDIA: '⚡',
    ALTA: '⚠️',
    CRITICA: '🚨'
  };

  const handleMarcarLido = async (alertaId: string) => {
    try {
      const token = localStorage.getItem('token');
      await fetch(`/api/ia/alertas/${alertaId}/marcar-lido`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${token}` }
      });
      onAtualizacao();
    } catch (error) {
      console.error('Erro ao marcar alerta como lido:', error);
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-red-500">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">
          🎯 Alertas Prioritários
        </h2>
        <span className="px-3 py-1 bg-red-100 text-red-800 text-sm font-semibold rounded-full">
          {alertas.length} {alertas.length === 1 ? 'alerta' : 'alertas'}
        </span>
      </div>

      <div className="space-y-3">
        {alertas.map((alerta) => (
          <div
            key={alerta.id}
            className={`p-4 rounded-lg border-2 ${corPrioridade[alerta.prioridade]} transition-all hover:shadow-md`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-2xl">{iconePrioridade[alerta.prioridade]}</span>
                  <h3 className="font-bold text-gray-900">{alerta.titulo}</h3>
                  <span className="px-2 py-0.5 bg-gray-200 text-gray-700 text-xs rounded">
                    {alerta.tipo}
                  </span>
                </div>

                <p className="text-gray-700 mb-2">{alerta.descricao}</p>

                {alerta.produto && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Produto:</span> {alerta.produto}
                  </p>
                )}

                {alerta.unidade && (
                  <p className="text-sm text-gray-600">
                    <span className="font-semibold">Unidade:</span> {alerta.unidade}
                  </p>
                )}

                {alerta.acaoRecomendada && (
                  <div className="mt-3 p-3 bg-white rounded border border-gray-300">
                    <p className="text-sm font-semibold text-gray-700 mb-1">
                      💡 Ação Recomendada:
                    </p>
                    <p className="text-sm text-gray-600">{alerta.acaoRecomendada}</p>
                  </div>
                )}
              </div>

              <button
                onClick={() => handleMarcarLido(alerta.id)}
                className="ml-4 p-2 text-gray-400 hover:text-gray-600 transition-colors"
                title="Marcar como lido"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {alerta.linkAcao && (
              <div className="mt-3">
                <a
                  href={alerta.linkAcao}
                  className="inline-block px-4 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium text-sm"
                >
                  Ir para Ação
                </a>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Arquivo: `components/ia/VisaoExecutiva.tsx`

```tsx
'use client';

import CardInsight from './CardInsight';

interface Metrica {
  valor: number | string;
  variacao: number;
  tendencia: 'up' | 'down' | 'stable';
}

interface VisaoExecutivaProps {
  metricas: {
    giroEstoque: Metrica;
    taxaRuptura: Metrica;
    ticketMedio: Metrica;
    margemLiquida: Metrica;
  };
}

export default function VisaoExecutiva({ metricas }: VisaoExecutivaProps) {
  return (
    <div>
      <h2 className="text-2xl font-bold text-gray-900 mb-4">
        📈 Visão Executiva
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <CardInsight
          titulo="Giro de Estoque"
          valor={`${metricas.giroEstoque.valor}x/mês`}
          variacao={metricas.giroEstoque.variacao}
          tendencia={metricas.giroEstoque.tendencia}
          insight={
            metricas.giroEstoque.tendencia === 'up'
              ? 'Seu estoque está girando mais rápido! Continue otimizando.'
              : 'Giro abaixo do período anterior. Considere ajustar reposição.'
          }
          prioridade="media"
        />

        <CardInsight
          titulo="Taxa de Ruptura"
          valor={`${metricas.taxaRuptura.valor}%`}
          variacao={metricas.taxaRuptura.variacao}
          tendencia={metricas.taxaRuptura.tendencia}
          insight={
            metricas.taxaRuptura.valor < 3
              ? 'Excelente! Taxa de ruptura está controlada.'
              : 'Atenção: Taxa de ruptura acima do ideal (3%).'
          }
          prioridade={metricas.taxaRuptura.valor > 5 ? 'alta' : 'media'}
        />

        <CardInsight
          titulo="Ticket Médio"
          valor={`R$ ${metricas.ticketMedio.valor}`}
          variacao={metricas.ticketMedio.variacao}
          tendencia={metricas.ticketMedio.tendencia}
          insight={
            metricas.ticketMedio.tendencia === 'up'
              ? 'Ticket médio em crescimento! Estratégias de upsell funcionando.'
              : 'Oportunidade de aumentar ticket com combos e promoções.'
          }
          prioridade="media"
        />

        <CardInsight
          titulo="Margem Líquida"
          valor={`${metricas.margemLiquida.valor}%`}
          variacao={metricas.margemLiquida.variacao}
          tendencia={metricas.margemLiquida.tendencia}
          insight={
            metricas.margemLiquida.valor > 18
              ? 'Margem saudável! Mantenha o equilíbrio preço x volume.'
              : 'Margem abaixo do ideal. Revise precificação e custos.'
          }
          prioridade={metricas.margemLiquida.valor < 15 ? 'alta' : 'media'}
        />
      </div>
    </div>
  );
}
```

### Arquivo: `components/ia/CardInsight.tsx`

```tsx
'use client';

interface CardInsightProps {
  titulo: string;
  valor: string | number;
  variacao?: number;
  tendencia?: 'up' | 'down' | 'stable';
  insight?: string;
  acao?: {
    label: string;
    onClick: () => void;
  };
  prioridade?: 'baixa' | 'media' | 'alta' | 'critica';
}

export default function CardInsight({
  titulo,
  valor,
  variacao,
  tendencia,
  insight,
  acao,
  prioridade = 'media'
}: CardInsightProps) {
  const corPrioridade = {
    baixa: 'border-gray-300',
    media: 'border-blue-400',
    alta: 'border-orange-400',
    critica: 'border-red-500'
  };

  const iconeTendencia = {
    up: '↗️',
    down: '↘️',
    stable: '→'
  };

  const corVariacao = {
    up: 'text-green-600',
    down: 'text-red-600',
    stable: 'text-gray-600'
  };

  return (
    <div className={`bg-white rounded-xl shadow-lg p-6 border-l-4 ${corPrioridade[prioridade]} hover:shadow-xl transition-all`}>
      <h3 className="text-sm font-medium text-gray-600 mb-2">{titulo}</h3>
      
      <div className="flex items-baseline space-x-2 mb-3">
        <p className="text-3xl font-bold text-gray-900">{valor}</p>
        {variacao !== undefined && tendencia && (
          <span className={`text-sm font-semibold ${corVariacao[tendencia]}`}>
            {iconeTendencia[tendencia]} {variacao > 0 ? '+' : ''}{variacao.toFixed(1)}%
          </span>
        )}
      </div>
      
      {insight && (
        <div className="bg-blue-50 border-l-2 border-blue-400 p-3 mb-3 rounded">
          <p className="text-sm text-blue-900">
            <span className="font-semibold">💡 </span>
            {insight}
          </p>
        </div>
      )}
      
      {acao && (
        <button
          onClick={acao.onClick}
          className="w-full mt-3 px-4 py-2 bg-precivox-blue text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
        >
          {acao.label}
        </button>
      )}
    </div>
  );
}
```

---

## 4. Jobs de Processamento de IA

### Arquivo: `backend/jobs/ia-processor.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const { preverDemandaProdutos } = require('../services/previsaoDemanda');
const { calcularElasticidade } = require('../services/elasticidade');
const { gerarAlertasRuptura } = require('../services/alertas');
const { atualizarMetricasDashboard } = require('../services/metricas');

const prisma = new PrismaClient();

/**
 * Job principal de processamento de IA
 * Roda diariamente às 2h AM
 */
async function processar() {
  console.log('🤖 [IA] Iniciando processamento diário...');
  const inicio = Date.now();

  try {
    // 1. Buscar todos os mercados ativos
    const mercados = await prisma.mercado.findMany({
      where: { ativo: true },
      include: {
        unidades: {
          include: {
            estoques: {
              include: { produto: true }
            }
          }
        }
      }
    });

    console.log(`📊 [IA] Processando ${mercados.length} mercados ativos...`);

    for (const mercado of mercados) {
      console.log(`\n🏪 [IA] Mercado: ${mercado.nome}`);

      // 2. Prever demanda para todos os produtos
      await preverDemandaProdutos(mercado);
      console.log('  ✓ Previsão de demanda concluída');

      // 3. Calcular elasticidade de preço
      await calcularElasticidade(mercado);
      console.log('  ✓ Elasticidade calculada');

      // 4. Gerar alertas de ruptura
      const alertas = await gerarAlertasRuptura(mercado);
      console.log(`  ✓ ${alertas.length} alertas gerados`);

      // 5. Atualizar métricas do dashboard
      await atualizarMetricasDashboard(mercado);
      console.log('  ✓ Métricas atualizadas');

      // 6. Limpar dados antigos
      await limparDadosAntigos(mercado.id);
      console.log('  ✓ Limpeza concluída');
    }

    const duracao = ((Date.now() - inicio) / 1000).toFixed(2);
    console.log(`\n✅ [IA] Processamento concluído em ${duracao}s`);

  } catch (error) {
    console.error('❌ [IA] Erro no processamento:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

/**
 * Limpar dados antigos (mais de 90 dias)
 */
async function limparDadosAntigos(mercadoId) {
  const dataLimite = new Date();
  dataLimite.setDate(dataLimite.getDate() - 90);

  // Deletar análises expiradas
  await prisma.analiseIA.deleteMany({
    where: {
      mercadoId,
      criadoEm: { lt: dataLimite }
    }
  });

  // Deletar alertas lidos e antigos
  await prisma.alertaIA.deleteMany({
    where: {
      mercadoId,
      lido: true,
      lidoEm: { lt: dataLimite }
    }
  });
}

// Executar se for chamado diretamente
if (require.main === module) {
  processar()
    .then(() => process.exit(0))
    .catch(() => process.exit(1));
}

module.exports = { processar };
```

---

## 5. Exemplos de Modelos Preditivos

### Arquivo: `backend/services/previsaoDemanda.js`

```javascript
/**
 * Previsão de Demanda usando Média Móvel Ponderada
 * (Versão simplificada - em produção, usar Prophet/ARIMA)
 */

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function preverDemandaProdutos(mercado) {
  for (const unidade of mercado.unidades) {
    for (const estoque of unidade.estoques) {
      try {
        // Buscar histórico de vendas (simulado por enquanto)
        const historicoVendas = await buscarHistoricoVendas(estoque.produtoId, unidade.id);
        
        if (historicoVendas.length < 7) {
          continue; // Dados insuficientes
        }

        // Calcular previsão usando média móvel ponderada
        const previsao7d = calcularMediaMovelPonderada(historicoVendas, 7);
        const previsao30d = previsao7d * 4.28; // Aproximação mensal

        // Atualizar produto
        await prisma.produto.update({
          where: { id: estoque.produtoId },
          data: {
            demandaPrevista7d: Math.round(previsao7d),
            demandaPrevista30d: Math.round(previsao30d),
            pontoReposicao: calcularPontoReposicao(previsao7d),
            ultimaAtualizacaoIA: new Date()
          }
        });

      } catch (error) {
        console.error(`Erro ao prever demanda do produto ${estoque.produtoId}:`, error);
      }
    }
  }
}

/**
 * Buscar histórico de vendas
 * (Em produção, criar tabela VendasDiarias)
 */
async function buscarHistoricoVendas(produtoId, unidadeId) {
  // Simulação - retornar array de vendas dos últimos 30 dias
  // Em produção: SELECT * FROM vendas_diarias WHERE produto_id = ? AND unidade_id = ?
  
  return [
    { data: '2024-10-01', quantidade: 12 },
    { data: '2024-10-02', quantidade: 15 },
    { data: '2024-10-03', quantidade: 10 },
    { data: '2024-10-04', quantidade: 18 },
    { data: '2024-10-05', quantidade: 14 },
    { data: '2024-10-06', quantidade: 16 },
    { data: '2024-10-07', quantidade: 13 },
    // ... últimos 30 dias
  ];
}

/**
 * Média Móvel Ponderada
 * Dá mais peso aos dados recentes
 */
function calcularMediaMovelPonderada(historico, dias) {
  const dadosRecentes = historico.slice(-dias);
  let somaPonderada = 0;
  let somaPesos = 0;

  dadosRecentes.forEach((registro, index) => {
    const peso = index + 1; // Peso crescente
    somaPonderada += registro.quantidade * peso;
    somaPesos += peso;
  });

  return somaPonderada / somaPesos;
}

/**
 * Calcular ponto de reposição
 * Estoque mínimo antes de fazer novo pedido
 */
function calcularPontoReposicao(demandaSemanal) {
  const demandaDiaria = demandaSemanal / 7;
  const leadTimeFornecedor = 5; // dias (pode ser configurável por fornecedor)
  const estoqueSeguranca = demandaSemanal * 0.3; // 30% de margem
  
  return Math.ceil((demandaDiaria * leadTimeFornecedor) + estoqueSeguranca);
}

module.exports = {
  preverDemandaProdutos,
  calcularPontoReposicao
};
```

---

## 6. Sistema de Alertas

### Arquivo: `backend/services/alertas.js`

```javascript
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Gerar alertas de ruptura
 */
async function gerarAlertasRuptura(mercado) {
  const alertasGerados = [];

  for (const unidade of mercado.unidades) {
    for (const estoque of unidade.estoques) {
      const { produto } = estoque;

      // Calcular dias restantes de estoque
      const demandaDiaria = (produto.demandaPrevista7d || 0) / 7;
      const diasRestantes = estoque.quantidade / (demandaDiaria || 1);

      let prioridade = null;
      let titulo = null;
      let descricao = null;

      if (diasRestantes < 1) {
        prioridade = 'CRITICA';
        titulo = `🚨 RUPTURA CRÍTICA: ${produto.nome}`;
        descricao = `Estoque atual de ${estoque.quantidade} unidades. Previsão de ruptura em menos de 24 horas!`;
      } else if (diasRestantes < 3) {
        prioridade = 'ALTA';
        titulo = `⚠️ Ruptura iminente: ${produto.nome}`;
        descricao = `Estoque atual de ${estoque.quantidade} unidades. Previsão de ruptura em ${Math.round(diasRestantes)} dias.`;
      } else if (diasRestantes < 7 && estoque.quantidade < produto.pontoReposicao) {
        prioridade = 'MEDIA';
        titulo = `📦 Reposição recomendada: ${produto.nome}`;
        descricao = `Estoque abaixo do ponto de reposição (${produto.pontoReposicao} unidades).`;
      }

      if (prioridade) {
        // Verificar se já existe alerta similar não lido
        const alertaExistente = await prisma.alertaIA.findFirst({
          where: {
            mercadoId: mercado.id,
            unidadeId: unidade.id,
            produtoId: produto.id,
            tipo: 'RUPTURA',
            lido: false
          }
        });

        if (!alertaExistente) {
          const quantidadeRepor = Math.ceil(produto.demandaPrevista30d - estoque.quantidade);

          const alerta = await prisma.alertaIA.create({
            data: {
              mercadoId: mercado.id,
              unidadeId: unidade.id,
              produtoId: produto.id,
              tipo: 'RUPTURA',
              titulo,
              descricao,
              prioridade,
              acaoRecomendada: `Repor ${quantidadeRepor} unidades de "${produto.nome}" na unidade ${unidade.nome}.`,
              linkAcao: `/gestor/ia/compras?produto=${produto.id}`,
              metadata: {
                estoqueAtual: estoque.quantidade,
                diasRestantes: Math.round(diasRestantes * 10) / 10,
                pontoReposicao: produto.pontoReposicao,
                quantidadeSugerida: quantidadeRepor
              }
            }
          });

          alertasGerados.push(alerta);
        }
      }
    }
  }

  return alertasGerados;
}

/**
 * Gerar alertas de oportunidades de promoção
 */
async function gerarAlertasOportunidades(mercado) {
  // Buscar produtos com estoque alto e giro baixo
  const produtosEstoqueAlto = await prisma.estoque.findMany({
    where: {
      unidade: { mercadoId: mercado.id },
      quantidade: { gte: 100 }, // Estoque alto
      produto: {
        giroEstoqueMedio: { lt: 2 } // Giro baixo
      }
    },
    include: {
      produto: true,
      unidade: { select: { nome: true } }
    },
    take: 5
  });

  const alertas = [];

  for (const estoque of produtosEstoqueAlto) {
    // Calcular desconto sugerido baseado em elasticidade
    const elasticidade = estoque.produto.elasticidadePreco || -1.2;
    const descontoSugerido = 10; // 10%
    const aumentoVendasEstimado = Math.abs(elasticidade) * descontoSugerido;

    const alerta = await prisma.alertaIA.create({
      data: {
        mercadoId: mercado.id,
        unidadeId: estoque.unidadeId,
        produtoId: estoque.produtoId,
        tipo: 'OPORTUNIDADE',
        titulo: `💰 Oportunidade de Promoção: ${estoque.produto.nome}`,
        descricao: `Estoque alto (${estoque.quantidade} unidades) com giro baixo (${estoque.produto.giroEstoqueMedio}x/mês).`,
        prioridade: 'MEDIA',
        acaoRecomendada: `Aplicar desconto de ${descontoSugerido}% pode aumentar vendas em ${aumentoVendasEstimado.toFixed(1)}%.`,
        linkAcao: `/gestor/ia/promocoes?produto=${estoque.produtoId}`,
        metadata: {
          estoqueAtual: estoque.quantidade,
          giroAtual: estoque.produto.giroEstoqueMedio,
          descontoSugerido,
          aumentoEstimado: aumentoVendasEstimado
        }
      }
    });

    alertas.push(alerta);
  }

  return alertas;
}

module.exports = {
  gerarAlertasRuptura,
  gerarAlertasOportunidades
};
```

---

## 📝 Resumo de Implementação

### Checklist Técnico

#### **Backend**
- [ ] Expandir `schema.prisma` com novos models
- [ ] Criar migrations: `npx prisma migrate dev --name add_ai_features`
- [ ] Implementar rotas `/api/ia/*`
- [ ] Implementar controllers de IA
- [ ] Criar services de previsão, elasticidade, alertas
- [ ] Configurar jobs cron (processor, alertas)
- [ ] Adicionar seeds de dados históricos

#### **Frontend**
- [ ] Criar páginas `/app/gestor/ia/page.tsx`
- [ ] Implementar componentes de IA:
  - `AlertasPrioritarios.tsx`
  - `VisaoExecutiva.tsx`
  - `ModulosIA.tsx`
  - `CardInsight.tsx`
  - `DashboardIA.tsx`
- [ ] Criar funções de API client (`lib/api/ia.ts`)
- [ ] Atualizar navegação do gestor

#### **Testes**
- [ ] Testar previsão de demanda com dados reais
- [ ] Validar geração de alertas
- [ ] Testar cálculo de métricas
- [ ] Verificar performance com grande volume de dados
- [ ] Testes de integração dos módulos

#### **Deployment**
- [ ] Configurar variáveis de ambiente
- [ ] Configurar jobs cron no PM2/servidor
- [ ] Otimizar queries (índices)
- [ ] Configurar cache (Redis) se necessário
- [ ] Documentar APIs

---

## 🚀 Próximos Passos

1. **Implementar Fase 1 (Fundação)** - 2 semanas
2. **Desenvolver Módulo de Compras** - 2 semanas
3. **Desenvolver Módulo de Promoções** - 2 semanas
4. **Desenvolver Módulo de Conversão** - 2 semanas
5. **Refinamento e Testes** - 2 semanas
6. **Lançamento Gradual** - 2 semanas

**Total: 12 semanas (3 meses)**

---

**Desenvolvido para PRECIVOX** 🚀  
**Versão:** 1.0 - Guia de Implementação Prática


