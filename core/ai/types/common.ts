/**
 * Common types shared across all AI engines
 */

export interface AIEngineResult<T> {
    success: boolean;
    data?: T;
    error?: string;
    metadata: {
        engineName: string;
        executionTime: number;
        timestamp: Date;
        version: string;
    };
}

export interface ProductData {
    id: string;
    nome: string;
    categoria?: string | null;
    marca?: string | null;
    preco: number;
    precoPromocional?: number | null;
    quantidade: number;
    unidadeId: string;
    mercadoId: string;
    codigoBarras?: string | null;
    unidadeMedida?: string | null;
}

export interface HistoricalData {
    produtoId: string;
    vendas: SalesRecord[];
    estoque: StockRecord[];
}

export interface SalesRecord {
    data: Date;
    quantidade: number;
    valor: number;
}

export interface StockRecord {
    data: Date;
    quantidade: number;
    movimentacao: 'ENTRADA' | 'SAIDA';
}

export interface UnidadeData {
    id: string;
    nome: string;
    endereco?: string | null;
    bairro?: string | null;
    cidade?: string | null;
    estado?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    mercadoId: string;
}

export type LogLevel = 'info' | 'warn' | 'error' | 'debug';
export type AlertPriority = 'BAIXA' | 'MEDIA' | 'ALTA' | 'CRITICA';
export type AnalysisStatus = 'PENDENTE' | 'PROCESSANDO' | 'CONCLUIDO' | 'ERRO';
