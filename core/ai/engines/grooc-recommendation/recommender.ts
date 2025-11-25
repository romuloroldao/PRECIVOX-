/**
 * Enhanced GROOC Recommender - Motor de Recomendações Inteligente
 * 
 * Critérios de recomendação:
 * 1. Custo-benefício (preço vs qualidade)
 * 2. Histórico do usuário
 * 3. Estoque disponível
 * 4. Marca preferida
 * 5. Opções mais saudáveis
 * 6. Ordenação por: preço, estoque e compatibilidade
 */

import {
    RecommendationInput,
    RecommendationOutput,
    ProductRecommendation,
    ProductRequest,
    UserPreferences,
    UserHistory
} from './types';
import { logger } from '../../utils/logger';
import { ProductData } from '../../types/common';

export class GROOCRecommender {
    private readonly ENGINE_NAME = 'GROOCEngine';

    /**
     * Gera recomendações inteligentes baseadas em múltiplos critérios
     */
    async recommend(
        input: RecommendationInput,
        availableProducts: ProductData[]
    ): Promise<RecommendationOutput> {
        const startTime = Date.now();

        logger.info(this.ENGINE_NAME, 'Iniciando recomendações GROOC', {
            totalProdutosSolicitados: input.produtos.length,
            totalProdutosDisponiveis: availableProducts.length,
            temPreferencias: !!input.preferencias,
            temHistorico: !!input.historicoUsuario
        });

        const preferencias = this.getDefaultPreferences(input.preferencias);
        const recomendacoes: ProductRecommendation[] = [];

        // Processar cada produto solicitado
        for (const produtoSolicitado of input.produtos) {
            const recomendacoesProduto = this.findBestMatches(
                produtoSolicitado,
                availableProducts,
                preferencias,
                input.historicoUsuario
            );

            recomendacoes.push(...recomendacoesProduto);
        }

        // Ordenar recomendações por score total
        const recomendacoesOrdenadas = this.sortRecommendations(recomendacoes, preferencias);

        // Calcular economia total
        const economiaEstimada = recomendacoesOrdenadas.reduce((sum, r) => sum + r.economia, 0);

        // Gerar resumo
        const resumo = this.generateSummary(input.produtos, recomendacoesOrdenadas);

        // Otimizar rota se houver localização
        let rotaOtimizada;
        if (input.localizacaoUsuario) {
            rotaOtimizada = this.optimizeRoute(
                recomendacoesOrdenadas,
                input.localizacaoUsuario,
                preferencias
            );
        }

        const executionTime = Date.now() - startTime;

        logger.info(this.ENGINE_NAME, 'Recomendações geradas com sucesso', {
            totalRecomendacoes: recomendacoesOrdenadas.length,
            economiaEstimada,
            executionTime
        });

        return {
            recomendacoes: recomendacoesOrdenadas,
            rotaOtimizada,
            economiaEstimada,
            tempoEstimado: rotaOtimizada?.tempoEstimado || 30,
            resumo
        };
    }

    /**
     * Encontra as melhores correspondências para um produto
     */
    private findBestMatches(
        produtoSolicitado: ProductRequest,
        availableProducts: ProductData[],
        preferencias: UserPreferences,
        historico?: UserHistory
    ): ProductRecommendation[] {
        const matches: ProductRecommendation[] = [];

        // Filtrar produtos compatíveis
        let candidatos = availableProducts.filter(p => {
            // Filtrar por categoria se especificada
            if (produtoSolicitado.categoria && p.categoria !== produtoSolicitado.categoria) {
                return false;
            }

            // Filtrar por preço máximo
            if (produtoSolicitado.precoMaximo && p.preco > produtoSolicitado.precoMaximo) {
                return false;
            }

            // Filtrar marcas a evitar
            if (preferencias.marcasEvitar?.includes(p.marca || '')) {
                return false;
            }

            // Filtrar categorias a evitar
            if (preferencias.categoriasEvitar?.includes(p.categoria || '')) {
                return false;
            }

            return true;
        });

        // Buscar por nome similar (mock - em produção usar fuzzy matching)
        const nomeNormalizado = produtoSolicitado.nome.toLowerCase();
        candidatos = candidatos.filter(p =>
            p.nome.toLowerCase().includes(nomeNormalizado) ||
            nomeNormalizado.includes(p.nome.toLowerCase().split(' ')[0])
        );

        // Se não encontrou nada, buscar na mesma categoria
        if (candidatos.length === 0 && produtoSolicitado.categoria) {
            candidatos = availableProducts.filter(p =>
                p.categoria === produtoSolicitado.categoria
            );
        }

        // Limitar a top 5 candidatos
        candidatos = candidatos.slice(0, 5);

        // Calcular scores para cada candidato
        for (const produto of candidatos) {
            const scores = this.calculateScores(
                produto,
                produtoSolicitado,
                preferencias,
                historico
            );

            const economia = this.calculateSavings(produto, produtoSolicitado);
            const tipo = this.determineRecommendationType(produto, produtoSolicitado, scores);
            const justificativa = this.generateJustification(produto, scores, economia);

            matches.push({
                produtoOriginal: produtoSolicitado.nome,
                produtoId: produto.id,
                produtoNome: produto.nome,
                tipo,
                unidadeSugerida: produto.unidadeId,
                unidadeNome: 'Unidade ' + produto.unidadeId.substring(0, 8),
                preco: produto.preco,
                precoOriginal: produto.precoPromocional ? produto.preco : undefined,
                economia: economia.valor,
                economiaPercentual: economia.percentual,
                distancia: Math.random() * 10, // Mock - calcular distância real
                estoque: produto.quantidade,
                marca: produto.marca || 'Sem marca',
                categoria: produto.categoria || 'Geral',
                scores,
                atributosSaude: this.generateHealthAttributes(produto),
                justificativa,
                confianca: scores.total / 100,
                prioridade: scores.total >= 80 ? 'ALTA' : scores.total >= 60 ? 'MEDIA' : 'BAIXA'
            });
        }

        return matches;
    }

    /**
     * Calcula scores de compatibilidade
     */
    private calculateScores(
        produto: ProductData,
        solicitado: ProductRequest,
        preferencias: UserPreferences,
        historico?: UserHistory
    ): ProductRecommendation['scores'] {
        // 1. Score de custo-benefício (0-100)
        const custoBeneficio = this.calculateCostBenefitScore(produto, solicitado, preferencias);

        // 2. Score de compatibilidade (0-100)
        const compatibilidade = this.calculateCompatibilityScore(produto, solicitado);

        // 3. Score de estoque (0-100)
        const estoque = this.calculateStockScore(produto, solicitado.quantidade);

        // 4. Score de saúde (0-100)
        const saude = this.calculateHealthScore(produto);

        // 5. Score de preferência do usuário (0-100)
        const preferencia = this.calculatePreferenceScore(produto, preferencias, historico);

        // Score total ponderado
        const weights = {
            custoBeneficio: preferencias.prefereMenorPreco ? 0.35 : 0.25,
            compatibilidade: 0.25,
            estoque: 0.15,
            saude: preferencias.opcoesSaudaveis ? 0.15 : 0.05,
            preferencia: 0.20
        };

        const total =
            custoBeneficio * weights.custoBeneficio +
            compatibilidade * weights.compatibilidade +
            estoque * weights.estoque +
            saude * weights.saude +
            preferencia * weights.preferencia;

        return {
            custoBeneficio: Math.round(custoBeneficio),
            compatibilidade: Math.round(compatibilidade),
            estoque: Math.round(estoque),
            saude: Math.round(saude),
            preferencia: Math.round(preferencia),
            total: Math.round(total)
        };
    }

    /**
     * Calcula score de custo-benefício
     */
    private calculateCostBenefitScore(
        produto: ProductData,
        solicitado: ProductRequest,
        preferencias: UserPreferences
    ): number {
        let score = 50; // Base

        // Preço abaixo do máximo é bom
        if (solicitado.precoMaximo) {
            const percentualPreco = (produto.preco / solicitado.precoMaximo) * 100;
            score = Math.max(0, 100 - percentualPreco);
        }

        // Promoção aumenta score
        if (produto.precoPromocional) {
            score += 20;
        }

        // Marca conhecida pode aumentar score (qualidade)
        if (produto.marca && produto.marca.length > 0) {
            score += 10;
        }

        return Math.min(100, score);
    }

    /**
     * Calcula score de compatibilidade
     */
    private calculateCompatibilityScore(
        produto: ProductData,
        solicitado: ProductRequest
    ): number {
        let score = 0;

        const nomeNormalizado = solicitado.nome.toLowerCase();
        const produtoNormalizado = produto.nome.toLowerCase();

        // Correspondência exata de nome
        if (produtoNormalizado === nomeNormalizado) {
            score = 100;
        }
        // Contém o nome completo
        else if (produtoNormalizado.includes(nomeNormalizado)) {
            score = 80;
        }
        // Contém primeira palavra
        else if (produtoNormalizado.includes(nomeNormalizado.split(' ')[0])) {
            score = 60;
        }
        // Mesma categoria
        else if (produto.categoria === solicitado.categoria) {
            score = 40;
        }
        else {
            score = 20;
        }

        return score;
    }

    /**
     * Calcula score de estoque
     */
    private calculateStockScore(produto: ProductData, quantidadeSolicitada: number): number {
        if (produto.quantidade === 0) {
            return 0;
        }

        if (produto.quantidade >= quantidadeSolicitada * 2) {
            return 100; // Estoque abundante
        }

        if (produto.quantidade >= quantidadeSolicitada) {
            return 80; // Estoque suficiente
        }

        // Estoque parcial
        return (produto.quantidade / quantidadeSolicitada) * 60;
    }

    /**
     * Calcula score de saúde (mock - em produção usar dados nutricionais reais)
     */
    private calculateHealthScore(produto: ProductData): number {
        let score = 50; // Base

        const nomeLower = produto.nome.toLowerCase();

        // Palavras-chave saudáveis
        if (nomeLower.includes('integral')) score += 15;
        if (nomeLower.includes('light')) score += 10;
        if (nomeLower.includes('zero')) score += 10;
        if (nomeLower.includes('orgânico') || nomeLower.includes('organico')) score += 20;
        if (nomeLower.includes('natural')) score += 10;
        if (nomeLower.includes('sem açúcar') || nomeLower.includes('sem acucar')) score += 15;

        // Palavras-chave não saudáveis
        if (nomeLower.includes('frito')) score -= 15;
        if (nomeLower.includes('refrigerante')) score -= 10;
        if (nomeLower.includes('doce')) score -= 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * Calcula score de preferência do usuário
     */
    private calculatePreferenceScore(
        produto: ProductData,
        preferencias: UserPreferences,
        historico?: UserHistory
    ): number {
        let score = 50; // Base

        // Marca preferida
        if (preferencias.marcasPreferidas?.includes(produto.marca || '')) {
            score += 30;
        }

        // Histórico de compras
        if (historico) {
            // Marca frequente
            if (historico.marcasFrequentes.includes(produto.marca || '')) {
                score += 20;
            }

            // Categoria frequente
            if (historico.categoriasFrequentes.includes(produto.categoria || '')) {
                score += 15;
            }

            // Preço compatível com histórico
            if (produto.preco <= historico.precoMedioGasto * 1.1) {
                score += 10;
            }
        }

        return Math.min(100, score);
    }

    /**
     * Calcula economia
     */
    private calculateSavings(
        produto: ProductData,
        solicitado: ProductRequest
    ): { valor: number; percentual: number } {
        // Mock - em produção comparar com preço médio do mercado
        const precoReferencia = solicitado.precoMaximo || produto.preco * 1.2;
        const economia = precoReferencia - produto.preco;
        const percentual = (economia / precoReferencia) * 100;

        return {
            valor: Math.max(0, economia),
            percentual: Math.max(0, percentual)
        };
    }

    /**
     * Determina tipo de recomendação
     */
    private determineRecommendationType(
        produto: ProductData,
        solicitado: ProductRequest,
        scores: ProductRecommendation['scores']
    ): ProductRecommendation['tipo'] {
        if (produto.precoPromocional) {
            return 'PROMOCAO';
        }

        if (scores.saude >= 70) {
            return 'MAIS_SAUDAVEL';
        }

        if (scores.compatibilidade >= 80) {
            return 'MELHOR_PRECO';
        }

        return 'SUBSTITUTO';
    }

    /**
     * Gera justificativa da recomendação
     */
    private generateJustification(
        produto: ProductData,
        scores: ProductRecommendation['scores'],
        economia: { valor: number; percentual: number }
    ): string[] {
        const justificativas: string[] = [];

        if (economia.valor > 0) {
            justificativas.push(`Economia de R$ ${economia.valor.toFixed(2)} (${economia.percentual.toFixed(1)}%)`);
        }

        if (scores.custoBeneficio >= 80) {
            justificativas.push('Excelente custo-benefício');
        }

        if (scores.estoque >= 80) {
            justificativas.push(`Estoque disponível: ${produto.quantidade} unidades`);
        }

        if (scores.saude >= 70) {
            justificativas.push('Opção mais saudável');
        }

        if (produto.precoPromocional) {
            const desconto = ((produto.preco - produto.precoPromocional) / produto.preco) * 100;
            justificativas.push(`Em promoção: ${desconto.toFixed(0)}% de desconto`);
        }

        if (scores.preferencia >= 70) {
            justificativas.push('Compatível com suas preferências');
        }

        if (justificativas.length === 0) {
            justificativas.push('Produto disponível');
        }

        return justificativas;
    }

    /**
     * Gera atributos de saúde (mock)
     */
    private generateHealthAttributes(produto: ProductData): ProductRecommendation['atributosSaude'] {
        const nomeLower = produto.nome.toLowerCase();

        return {
            organico: nomeLower.includes('orgânico') || nomeLower.includes('organico'),
            integral: nomeLower.includes('integral'),
            semGluten: nomeLower.includes('sem glúten') || nomeLower.includes('sem gluten'),
            semLactose: nomeLower.includes('sem lactose'),
            vegano: nomeLower.includes('vegano') || nomeLower.includes('vegan'),
            // Mock de valores nutricionais
            calorias: Math.floor(Math.random() * 300) + 50,
            gorduras: Math.floor(Math.random() * 20),
            acucares: Math.floor(Math.random() * 30),
            sodio: Math.floor(Math.random() * 500)
        };
    }

    /**
     * Ordena recomendações por múltiplos critérios
     */
    private sortRecommendations(
        recomendacoes: ProductRecommendation[],
        preferencias: UserPreferences
    ): ProductRecommendation[] {
        return recomendacoes.sort((a, b) => {
            // 1. Prioridade
            const prioridadeOrder = { ALTA: 0, MEDIA: 1, BAIXA: 2 };
            if (a.prioridade !== b.prioridade) {
                return prioridadeOrder[a.prioridade] - prioridadeOrder[b.prioridade];
            }

            // 2. Score total
            if (Math.abs(a.scores.total - b.scores.total) > 5) {
                return b.scores.total - a.scores.total;
            }

            // 3. Preço (se preferir menor preço)
            if (preferencias.prefereMenorPreco) {
                return a.preco - b.preco;
            }

            // 4. Estoque
            return b.estoque - a.estoque;
        });
    }

    /**
     * Otimiza rota de compras
     */
    private optimizeRoute(
        recomendacoes: ProductRecommendation[],
        localizacao: { latitude: number; longitude: number },
        preferencias: UserPreferences
    ): RecommendationOutput['rotaOtimizada'] {
        // Agrupar por unidade
        const porUnidade = new Map<string, ProductRecommendation[]>();

        recomendacoes.forEach(rec => {
            if (!porUnidade.has(rec.unidadeSugerida)) {
                porUnidade.set(rec.unidadeSugerida, []);
            }
            porUnidade.get(rec.unidadeSugerida)!.push(rec);
        });

        // Criar paradas
        const paradas = Array.from(porUnidade.entries()).map(([unidadeId, produtos], index) => {
            const economiaParada = produtos.reduce((sum, p) => sum + p.economia, 0);
            const distancia = Math.random() * 5 + 1; // Mock

            return {
                unidadeId,
                unidadeNome: produtos[0].unidadeNome,
                endereco: `Endereço da ${produtos[0].unidadeNome}`,
                produtos,
                ordem: index + 1,
                distancia,
                tempoEstimado: Math.round(distancia * 3 + 10), // 3 min/km + 10 min compra
                economiaAcumulada: economiaParada,
                latitude: localizacao.latitude + (Math.random() - 0.5) * 0.02,
                longitude: localizacao.longitude + (Math.random() - 0.5) * 0.02
            };
        });

        // Ordenar paradas (mock - em produção usar TSP)
        if (preferencias.prefereMenorDistancia) {
            paradas.sort((a, b) => a.distancia - b.distancia);
        } else {
            paradas.sort((a, b) => b.economiaAcumulada - a.economiaAcumulada);
        }

        // Atualizar ordem
        paradas.forEach((parada, index) => {
            parada.ordem = index + 1;
        });

        const distanciaTotal = paradas.reduce((sum, p) => sum + p.distancia, 0);
        const tempoTotal = paradas.reduce((sum, p) => sum + p.tempoEstimado, 0);
        const economiaTotal = paradas.reduce((sum, p) => sum + p.economiaAcumulada, 0);

        return {
            unidades: paradas,
            distanciaTotal: Number(distanciaTotal.toFixed(2)),
            tempoEstimado: Math.round(tempoTotal),
            economiaTotal: Number(economiaTotal.toFixed(2)),
            eficiencia: Number((economiaTotal / distanciaTotal).toFixed(2)),
            ordemOtimizada: true
        };
    }

    /**
     * Gera resumo das recomendações
     */
    private generateSummary(
        produtosSolicitados: ProductRequest[],
        recomendacoes: ProductRecommendation[]
    ): RecommendationOutput['resumo'] {
        const economiaTotal = recomendacoes.reduce((sum, r) => sum + r.economia, 0);
        const scoresSaude = recomendacoes.map(r => r.scores.saude);
        const scoresCusto = recomendacoes.map(r => r.scores.custoBeneficio);

        return {
            totalProdutos: produtosSolicitados.length,
            totalRecomendacoes: recomendacoes.length,
            economiaTotal: Number(economiaTotal.toFixed(2)),
            economiaMedia: Number((economiaTotal / recomendacoes.length).toFixed(2)),
            scoreGeralSaude: Math.round(scoresSaude.reduce((a, b) => a + b, 0) / scoresSaude.length),
            scoreGeralCustoBeneficio: Math.round(scoresCusto.reduce((a, b) => a + b, 0) / scoresCusto.length),
            produtosForaEstoque: recomendacoes.filter(r => r.estoque === 0).length,
            produtosSubstituidos: recomendacoes.filter(r => r.tipo === 'SUBSTITUTO').length
        };
    }

    /**
     * Retorna preferências padrão
     */
    private getDefaultPreferences(preferencias?: UserPreferences): UserPreferences {
        return {
            prefereMenorPreco: preferencias?.prefereMenorPreco ?? true,
            prefereMenorDistancia: preferencias?.prefereMenorDistancia ?? false,
            marcasPreferidas: preferencias?.marcasPreferidas ?? [],
            marcasEvitar: preferencias?.marcasEvitar ?? [],
            categoriasEvitar: preferencias?.categoriasEvitar ?? [],
            opcoesSaudaveis: preferencias?.opcoesSaudaveis ?? false,
            distanciaMaxima: preferencias?.distanciaMaxima ?? 15,
            aceitaSubstitutos: preferencias?.aceitaSubstitutos ?? true
        };
    }
}
