import { AIScheduler } from './jobs/scheduler';
import { logger } from './utils/logger';

// Tratamento de sinais para encerramento gracioso
process.on('SIGTERM', () => {
    logger.info('RunScheduler', '🛑 Recebido SIGTERM. Parando scheduler...');
    AIScheduler.stopAll();
    process.exit(0);
});

process.on('SIGINT', () => {
    logger.info('RunScheduler', '🛑 Recebido SIGINT. Parando scheduler...');
    AIScheduler.stopAll();
    process.exit(0);
});

// Iniciar scheduler
logger.info('RunScheduler', '🚀 Iniciando processo de agendamento de IA...');
AIScheduler.init();

// Manter processo rodando
setInterval(() => {}, 1000 * 60 * 60);
