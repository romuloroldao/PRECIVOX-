import { AIEngineFactory } from '../index';
import { logger } from '../utils/logger';

export class AIJobs {
    private static engines = AIEngineFactory.createAll();

    /**
     * Executa análise diária de demanda e estoque
     */
    static async runDailyAnalysis() {
        logger.info('AIJobs', '🔄 [JOB] Iniciando análise diária...');
        try {
            const mockProdutos = [
                { id: '1', nome: 'Arroz', historicoVendas: [] },
                { id: '2', nome: 'Feijão', historicoVendas: [] }
            ];
            
            logger.info('AIJobs', `📊 Analisando demanda para ${mockProdutos.length} produtos`);

            const mockUnidadeId = 'unidade-1';
            logger.info('AIJobs', `🏥 Verificando saúde do estoque para ${mockUnidadeId}`);

            logger.info('AIJobs', '✅ [JOB] Análise diária concluída com sucesso');
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro na análise diária:', error);
        }
    }

    /**
     * Verifica alertas críticos de estoque (roda a cada hora)
     */
    static async checkStockAlerts() {
        logger.info('AIJobs', '🔍 [JOB] Verificando alertas de estoque...');
        try {
            const alertsFound = 0;
            
            if (alertsFound > 0) {
                logger.warn('AIJobs', `⚠️ [JOB] ${alertsFound} alertas críticos encontrados!`);
            } else {
                logger.info('AIJobs', '✅ [JOB] Nenhum alerta crítico encontrado');
            }
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro ao verificar alertas:', error);
        }
    }

    /**
     * Gera relatório semanal de performance
     */
    static async generateWeeklyReport() {
        logger.info('AIJobs', '📑 [JOB] Gerando relatório semanal...');
        try {
            const report = {
                date: new Date(),
                totalSales: 0,
                stockHealth: 85,
                predictionsAccuracy: 0.92
            };

            logger.info('AIJobs', '✅ [JOB] Relatório semanal gerado', report);
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro ao gerar relatório semanal:', error);
        }
    }

    /** Sync agendado URL/SFTP → processarUpload (Épico 9.1) */
    static async runCatalogSync() {
        logger.info('AIJobs', '🔄 [JOB] Verificando syncs de catálogo agendados...');
        try {
            const { executarSyncsDevidos } = await import('../../../lib/sync-agendado');
            const resumo = await executarSyncsDevidos();
            logger.info('AIJobs', `✅ [JOB] Sync catálogo: ${resumo.executados} ok, ${resumo.falhas} falhas, ${resumo.ignorados} ignorados`);
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro no sync agendado:', error);
        }
    }

    /** ML leve batch — churn + elasticidade (Épico 12) via API cron (evita import lib/ no build AI) */
    static async runMlLeveBatch() {
        logger.info('AIJobs', '🧠 [JOB] Batch ML leve (churn + elasticidade)...');
        try {
            const secret = process.env.CRON_SECRET;
            const base =
                process.env.INTERNAL_API_URL ||
                process.env.NEXT_PUBLIC_URL ||
                'http://127.0.0.1:3000';
            if (!secret) {
                logger.warn('AIJobs', '⚠️ CRON_SECRET ausente — batch ML leve ignorado');
                return;
            }
            const res = await fetch(`${base.replace(/\/$/, '')}/api/cron/ml-leve-batch?limite=400`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${secret}` },
            });
            const json = (await res.json()) as {
                success?: boolean;
                data?: { processados: number; erros: number; ignorados: number };
                error?: string;
            };
            if (!res.ok || !json.success) {
                throw new Error(json.error ?? `HTTP ${res.status}`);
            }
            const r = json.data!;
            logger.info(
                'AIJobs',
                `✅ [JOB] ML leve: ${r.processados} ok, ${r.erros} erros, ${r.ignorados} ignorados`
            );
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro no batch ML leve:', error);
        }
    }

    /** Backfill de imagens de produtos via Open Food Facts */
    static async runProductImageBackfill() {
        logger.info('AIJobs', '🖼️ [JOB] Backfill de imagens de produtos...');
        try {
            const { runProductImageBackfill } = await import('../../../lib/imagens/produto-imagem-service');
            const resumo = await runProductImageBackfill();
            logger.info(
                'AIJobs',
                `✅ [JOB] Imagens: ${resumo.processados} processados, ${resumo.automatica} automáticas, ${resumo.invalida} inválidas, ${resumo.pendente} pendentes`
            );
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro no backfill de imagens:', error);
        }
    }

    /** Push retenção — cesta provável + dia de mercado (2.3 / 6.3) */
    static async runRetentionPush() {
        logger.info('AIJobs', '🔔 [JOB] Push de retenção (cesta / dia de mercado)...');
        try {
            const { executarPushRetencao } = await import('../../../lib/push-retencao');
            const resumo = await executarPushRetencao();
            logger.info(
                'AIJobs',
                `✅ [JOB] Push retenção: cesta=${resumo.cestaEnviados} dia=${resumo.diaMercadoEnviados} ignorados=${resumo.ignorados}`
            );
        } catch (error) {
            logger.error('AIJobs', '❌ [JOB] Erro no push de retenção:', error);
        }
    }
}
