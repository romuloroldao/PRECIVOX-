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
