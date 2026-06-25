import * as cron from 'node-cron';
import { AIJobs } from './tasks';
import { logger } from '../utils/logger';

export class AIScheduler {
    private static jobs: ReturnType<typeof cron.schedule>[] = [];

    /**
     * Inicializa todos os cron jobs
     */
    static init() {
        logger.info('Scheduler', '⏰ Inicializando agendador de tarefas de IA...');

        // 1. Análise Diária - 00:00 (Meia-noite)
        this.scheduleJob('0 0 * * *', async () => {
            await AIJobs.runDailyAnalysis();
        }, 'Análise Diária');

        // 2. Alertas de Estoque - A cada hora
        this.scheduleJob('0 * * * *', async () => {
            await AIJobs.checkStockAlerts();
        }, 'Alertas de Estoque');

        // 3. Relatório Semanal - Segunda-feira às 06:00
        this.scheduleJob('0 6 * * 1', async () => {
            await AIJobs.generateWeeklyReport();
        }, 'Relatório Semanal');

        // 4. Sync agendado de catálogo parceiro — a cada 30 min
        this.scheduleJob('*/30 * * * *', async () => {
            await AIJobs.runCatalogSync();
        }, 'Sync Agendado Catálogo');

        // 5. Push retenção — 8h e 18h (horário do servidor; ajuste TZ se necessário)
        this.scheduleJob('0 8,18 * * *', async () => {
            await AIJobs.runRetentionPush();
        }, 'Push Retenção Cesta/Dia Mercado');

        // 6. ML leve batch — 3h (Épico 12)
        this.scheduleJob('0 3 * * *', async () => {
            await AIJobs.runMlLeveBatch();
        }, 'ML Leve Batch');

        // 7. Backfill imagens de produtos — a cada 5 min
        this.scheduleJob('*/5 * * * *', async () => {
            await AIJobs.runProductImageBackfill();
        }, 'Backfill Imagens Produtos');

        logger.info('Scheduler', `✅ ${this.jobs.length} tarefas agendadas com sucesso`);
    }

    /**
     * Agenda um job específico com log
     */
    private static scheduleJob(cronExpression: string, task: () => Promise<void>, name: string) {
        if (!cron.validate(cronExpression)) {
            logger.error('Scheduler', `❌ Expressão cron inválida para ${name}: ${cronExpression}`);
            return;
        }

        const job = cron.schedule(cronExpression, async () => {
            logger.info('Scheduler', `🚀 Iniciando tarefa agendada: ${name}`);
            try {
                await task();
            } catch (error) {
                logger.error('Scheduler', `❌ Erro na tarefa ${name}:`, error);
            }
        });

        this.jobs.push(job);
        logger.info('Scheduler', `📅 Tarefa agendada: ${name} [${cronExpression}]`);
    }

    /**
     * Para todos os jobs
     */
    static stopAll() {
        this.jobs.forEach(job => job.stop());
        logger.info('Scheduler', '🛑 Todas as tarefas agendadas foram paradas');
    }
}
