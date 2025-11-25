/**
 * Stock Health Analyzer - Análise de saúde do estoque
 * Implementação MOCK com regras heurísticas
 * TODO: Implementar modelos ML para detecção de anomalias
 */

import { StockHealthInput, StockHealthOutput, StockAlert, StockMetrics, CategoryAnalysis } from './types';
import { ProductData, AlertPriority } from '../../types/common';
import { logger } from '../../utils/logger';

export class StockHealthAnalyzer {
    private readonly ENGINE_NAME = 'StockHealthEngine';

    /**
     * Analisa saúde geral do estoque de uma unidade
     */
    async analyze(input: StockHealthInput, stockData: ProductData[]): Promise<StockHealthOutput> {
        const startTime = Date.now();

        logger.info(this.ENGINE_NAME, 'Iniciando análise de saúde do estoque', {
            unidadeId: input.unidadeId,
            totalProdutos: stockData.length,
            categorias: input.categorias
        });

        // Filtrar por categorias se especificado
        let filteredStock = stockData;
        if (input.categorias && input.categorias.length > 0) {
            filteredStock = stockData.filter(p =>
                p.categoria && input.categorias!.includes(p.categoria)
            );
        }

        // Gerar alertas
        const alertas = this.generateAlerts(filteredStock);

        // Calcular métricas
        const metricas = this.calculateMetrics(filteredStock, alertas);

        // Análise por categoria
        const analiseDetalhada = this.analyzeByCategory(filteredStock, alertas);

        // Calcular score de saúde
        const score = this.calculateHealthScore(metricas, alertas);

        // Determinar status
        const status = this.determineStatus(score);

        // Gerar recomendações
        const recomendacoes = this.generateRecommendations(score, status, metricas, alertas);

        const executionTime = Date.now() - startTime;

        logger.info(this.ENGINE_NAME, 'Análise de saúde concluída', {
            unidadeId: input.unidadeId,
            score: score.toFixed(1),
            status,
            totalAlertas: alertas.length,
            alertasCriticos: alertas.filter(a => a.prioridade === 'CRITICA').length,
            executionTime
        });

        return {
            unidadeId: input.unidadeId,
            score,
            status,
            alertas,
            metricas,
            recomendacoes,
            analiseDetalhada
        };
    }

    /**
     * Gera alertas baseados em regras heurísticas
     */
    private generateAlerts(stockData: ProductData[]): StockAlert[] {
        const alertas: StockAlert[] = [];

        for (const produto of stockData) {
            // Alerta de ruptura iminente
            if (produto.quantidade < 10) {
                const diasParaRuptura = Math.max(1, Math.floor(produto.quantidade / 2));
                const prioridade: AlertPriority = produto.quantidade < 5 ? 'CRITICA' : 'ALTA';

                alertas.push({
                    tipo: 'RUPTURA',
                    prioridade,
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    categoria: produto.categoria || undefined,
                    descricao: `Estoque crítico: apenas ${produto.quantidade} unidades disponíveis`,
                    quantidadeAtual: produto.quantidade,
                    quantidadeRecomendada: 50,
                    diasParaRuptura,
                    valorImpacto: produto.preco * 50,
                    acaoRecomendada: prioridade === 'CRITICA'
                        ? 'Repor IMEDIATAMENTE - risco de ruptura em menos de 24h'
                        : 'Programar reposição urgente nos próximos 2-3 dias',
                    urgencia: prioridade === 'CRITICA' ? 'IMEDIATA' : 'CURTO_PRAZO'
                });
            }

            // Alerta de excesso de estoque
            if (produto.quantidade > 200) {
                alertas.push({
                    tipo: 'EXCESSO',
                    prioridade: 'MEDIA',
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    categoria: produto.categoria || undefined,
                    descricao: `Estoque excessivo: ${produto.quantidade} unidades (giro estimado: baixo)`,
                    quantidadeAtual: produto.quantidade,
                    quantidadeRecomendada: 100,
                    valorImpacto: produto.preco * (produto.quantidade - 100),
                    acaoRecomendada: 'Considerar promoção para acelerar giro e liberar capital',
                    urgencia: 'MEDIO_PRAZO'
                });
            }

            // Alerta de giro baixo (mock - baseado em quantidade alta)
            if (produto.quantidade > 150 && produto.quantidade <= 200) {
                alertas.push({
                    tipo: 'GIRO_BAIXO',
                    prioridade: 'BAIXA',
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    categoria: produto.categoria || undefined,
                    descricao: `Giro abaixo do ideal: ${produto.quantidade} unidades em estoque`,
                    quantidadeAtual: produto.quantidade,
                    quantidadeRecomendada: 80,
                    acaoRecomendada: 'Monitorar vendas e considerar ajuste de pedidos futuros',
                    urgencia: 'MEDIO_PRAZO'
                });
            }

            // Alerta de preço desatualizado (mock - se não tem promoção há muito tempo)
            if (!produto.precoPromocional && Math.random() > 0.9) {
                alertas.push({
                    tipo: 'PRECO_DESATUALIZADO',
                    prioridade: 'BAIXA',
                    produtoId: produto.id,
                    produtoNome: produto.nome,
                    categoria: produto.categoria || undefined,
                    descricao: 'Produto sem promoção há mais de 60 dias',
                    quantidadeAtual: produto.quantidade,
                    quantidadeRecomendada: produto.quantidade,
                    acaoRecomendada: 'Revisar precificação e considerar promoção sazonal',
                    urgencia: 'MEDIO_PRAZO'
                });
            }
        }

        // Ordenar por prioridade
        const priorityOrder: Record<AlertPriority, number> = {
            'CRITICA': 0,
            'ALTA': 1,
            'MEDIA': 2,
            'BAIXA': 3
        };

        alertas.sort((a, b) => priorityOrder[a.prioridade] - priorityOrder[b.prioridade]);

        logger.debug(this.ENGINE_NAME, 'Alertas gerados', {
            total: alertas.length,
            criticos: alertas.filter(a => a.prioridade === 'CRITICA').length,
            altos: alertas.filter(a => a.prioridade === 'ALTA').length,
            medios: alertas.filter(a => a.prioridade === 'MEDIA').length,
            baixos: alertas.filter(a => a.prioridade === 'BAIXA').length
        });

        return alertas;
    }

    /**
     * Calcula métricas gerais do estoque
     */
    private calculateMetrics(stockData: ProductData[], alertas: StockAlert[]): StockMetrics {
        const totalProdutos = stockData.length;
        const totalQuantidade = stockData.reduce((sum, p) => sum + p.quantidade, 0);
        const totalValor = stockData.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);

        // Mock: giro médio (será calculado com dados reais de vendas)
        const giroMedio = 4.2;

        // Taxa de ruptura
        const produtosEmRisco = alertas.filter(a => a.tipo === 'RUPTURA').length;
        const taxaRuptura = (produtosEmRisco / totalProdutos) * 100;

        // Produtos parados (excesso ou giro baixo)
        const produtosParados = alertas.filter(a => a.tipo === 'EXCESSO' || a.tipo === 'GIRO_BAIXO').length;

        // Produtos ótimos (sem alertas)
        const produtosComAlerta = new Set(alertas.map(a => a.produtoId));
        const produtosOtimos = totalProdutos - produtosComAlerta.size;

        // Dias de cobertura (mock)
        const diasCobertura = 30;

        // Distribuição ABC (mock - baseado em quantidade)
        const sortedByQty = [...stockData].sort((a, b) => b.quantidade - a.quantidade);
        const distribuicaoABC = {
            A: Math.floor(totalProdutos * 0.2), // Top 20%
            B: Math.floor(totalProdutos * 0.3), // Próximos 30%
            C: totalProdutos - Math.floor(totalProdutos * 0.5) // Restantes 50%
        };

        return {
            giroMedio,
            taxaRuptura,
            valorEstoque: totalValor,
            diasCobertura,
            produtosAtivos: totalProdutos,
            produtosEmRisco,
            produtosParados,
            produtosOtimos,
            distribuicaoABC
        };
    }

    /**
     * Analisa estoque por categoria
     */
    private analyzeByCategory(stockData: ProductData[], alertas: StockAlert[]): CategoryAnalysis[] {
        const categorias = new Map<string, ProductData[]>();

        // Agrupar por categoria
        stockData.forEach(produto => {
            const categoria = produto.categoria || 'Sem Categoria';
            if (!categorias.has(categoria)) {
                categorias.set(categoria, []);
            }
            categorias.get(categoria)!.push(produto);
        });

        const analises: CategoryAnalysis[] = [];

        categorias.forEach((produtos, categoria) => {
            const totalProdutos = produtos.length;
            const valorEstoque = produtos.reduce((sum, p) => sum + (p.quantidade * p.preco), 0);
            const giroMedio = 4.0 + Math.random() * 2; // Mock

            // Contar alertas desta categoria
            const alertasCategoria = alertas.filter(a => a.categoria === categoria).length;

            // Determinar status da categoria
            let status: 'CRITICO' | 'ATENCAO' | 'SAUDAVEL' | 'OTIMO';
            const taxaAlerta = alertasCategoria / totalProdutos;

            if (taxaAlerta > 0.3) status = 'CRITICO';
            else if (taxaAlerta > 0.15) status = 'ATENCAO';
            else if (taxaAlerta > 0.05) status = 'SAUDAVEL';
            else status = 'OTIMO';

            analises.push({
                categoria,
                totalProdutos,
                valorEstoque,
                giroMedio,
                status,
                alertas: alertasCategoria
            });
        });

        // Ordenar por valor de estoque (maior primeiro)
        analises.sort((a, b) => b.valorEstoque - a.valorEstoque);

        return analises;
    }

    /**
     * Calcula score de saúde (0-100)
     */
    private calculateHealthScore(metricas: StockMetrics, alertas: StockAlert[]): number {
        let score = 100;

        // Penalizar por taxa de ruptura
        score -= metricas.taxaRuptura * 2;

        // Penalizar por produtos parados
        const taxaParados = (metricas.produtosParados / metricas.produtosAtivos) * 100;
        score -= taxaParados * 1.5;

        // Penalizar por alertas críticos
        const alertasCriticos = alertas.filter(a => a.prioridade === 'CRITICA').length;
        score -= alertasCriticos * 5;

        // Penalizar por alertas altos
        const alertasAltos = alertas.filter(a => a.prioridade === 'ALTA').length;
        score -= alertasAltos * 3;

        // Bonificar por produtos ótimos
        const taxaOtimos = (metricas.produtosOtimos / metricas.produtosAtivos) * 100;
        score += taxaOtimos * 0.2;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Determina status baseado no score
     */
    private determineStatus(score: number): 'CRITICO' | 'ATENCAO' | 'SAUDAVEL' | 'OTIMO' {
        if (score < 50) return 'CRITICO';
        if (score < 70) return 'ATENCAO';
        if (score < 90) return 'SAUDAVEL';
        return 'OTIMO';
    }

    /**
     * Gera recomendações baseadas na análise
     */
    private generateRecommendations(
        score: number,
        status: string,
        metricas: StockMetrics,
        alertas: StockAlert[]
    ): string[] {
        const recomendacoes: string[] = [];

        recomendacoes.push(`Score de saúde do estoque: ${score.toFixed(1)}/100 (${status})`);

        if (status === 'CRITICO') {
            recomendacoes.push('⚠️ ATENÇÃO: Estoque em estado crítico - ação imediata necessária!');
        }

        if (metricas.produtosEmRisco > 0) {
            recomendacoes.push(`${metricas.produtosEmRisco} produtos em risco de ruptura - priorizar reposição`);
        }

        if (metricas.produtosParados > 0) {
            recomendacoes.push(`${metricas.produtosParados} produtos com giro baixo - considerar promoções`);
        }

        if (metricas.taxaRuptura > 10) {
            recomendacoes.push(`Taxa de ruptura elevada (${metricas.taxaRuptura.toFixed(1)}%) - revisar processo de reposição`);
        }

        if (metricas.giroMedio < 3) {
            recomendacoes.push(`Giro médio abaixo do ideal (${metricas.giroMedio.toFixed(1)}x/mês) - otimizar mix de produtos`);
        }

        const alertasCriticos = alertas.filter(a => a.prioridade === 'CRITICA');
        if (alertasCriticos.length > 0) {
            recomendacoes.push(`${alertasCriticos.length} alertas críticos requerem ação imediata`);
        }

        if (status === 'OTIMO') {
            recomendacoes.push('✅ Estoque em excelente estado - manter práticas atuais');
        }

        return recomendacoes;
    }
}
