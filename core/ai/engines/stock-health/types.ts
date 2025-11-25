/**
 * Stock Health Engine - Types and Interfaces
 */

import { AlertPriority } from '../../types/common';

export interface StockHealthInput {
    unidadeId: string;
    mercadoId: string;
    categorias?: string[]; // Filtrar por categorias específicas
    incluirInativos?: boolean;
}

export interface StockHealthOutput {
    unidadeId: string;
    score: number; // 0-100
    status: 'CRITICO' | 'ATENCAO' | 'SAUDAVEL' | 'OTIMO';
    alertas: StockAlert[];
    metricas: StockMetrics;
    recomendacoes: string[];
    analiseDetalhada: CategoryAnalysis[];
}

export interface StockAlert {
    tipo: 'RUPTURA' | 'EXCESSO' | 'GIRO_BAIXO' | 'VENCIMENTO' | 'PRECO_DESATUALIZADO';
    prioridade: AlertPriority;
    produtoId: string;
    produtoNome: string;
    categoria?: string;
    descricao: string;
    quantidadeAtual: number;
    quantidadeRecomendada: number;
    diasParaRuptura?: number;
    valorImpacto?: number;
    acaoRecomendada: string;
    urgencia: 'IMEDIATA' | 'CURTO_PRAZO' | 'MEDIO_PRAZO';
}

export interface StockMetrics {
    giroMedio: number;
    taxaRuptura: number; // %
    valorEstoque: number;
    diasCobertura: number;
    produtosAtivos: number;
    produtosEmRisco: number;
    produtosParados: number;
    produtosOtimos: number;
    distribuicaoABC: {
        A: number; // Alta rotação
        B: number; // Média rotação
        C: number; // Baixa rotação
    };
}

export interface CategoryAnalysis {
    categoria: string;
    totalProdutos: number;
    valorEstoque: number;
    giroMedio: number;
    status: 'CRITICO' | 'ATENCAO' | 'SAUDAVEL' | 'OTIMO';
    alertas: number;
}
