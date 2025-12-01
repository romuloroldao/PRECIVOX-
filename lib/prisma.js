"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
// Cliente Prisma Singleton
const client_1 = require("@prisma/client");
exports.prisma = globalThis.prisma || new client_1.PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasources: {
        db: {
            url: process.env.DATABASE_URL,
        },
    },
});
if (process.env.NODE_ENV !== 'production') {
    globalThis.prisma = exports.prisma;
}
// Middleware para timeout nas queries
exports.prisma.$use(async (params, next) => {
    const timeout = 8000; // 8 segundos de timeout
    const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Query timeout')), timeout);
    });
    try {
        const result = await Promise.race([
            next(params),
            timeoutPromise
        ]);
        return result;
    }
    catch (error) {
        console.error('Erro no Prisma middleware:', error);
        throw error;
    }
});
//# sourceMappingURL=prisma.js.map