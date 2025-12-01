/**
 * Compatibilidade com Prisma - Interface para injeção de dependência
 * Em runtime, o Prisma será injetado via require dinâmico
 */

// Tipo do Prisma Client (será resolvido em runtime)
export type PrismaClient = any;

// Variável que será injetada em runtime
let prismaInstance: PrismaClient | null = null;

/**
 * Inicializa o Prisma (deve ser chamado antes de usar os engines)
 */
export function initPrisma(prisma: PrismaClient) {
    prismaInstance = prisma;
}

/**
 * Obtém a instância do Prisma
 * Em runtime, tenta carregar dinamicamente se não foi injetado
 */
export function getPrisma(): PrismaClient {
    if (prismaInstance) {
        return prismaInstance;
    }
    
    // Fallback: tentar carregar dinamicamente em runtime
    try {
        // eslint-disable-next-line @typescript-eslint/no-require-imports
        const prismaModule = require('../../../lib/prisma');
        prismaInstance = prismaModule.prisma;
        return prismaInstance;
    } catch (error) {
        throw new Error('Prisma não foi inicializado. Chame initPrisma() primeiro ou certifique-se de que /lib/prisma.ts está acessível.');
    }
}

// Export para compatibilidade direta (será resolvido em runtime)
export const prisma = new Proxy({} as PrismaClient, {
    get(_target, prop) {
        return getPrisma()[prop];
    }
});
