/**
 * Configuração global para testes
 */

process.env.JWT_SECRET = 'test-secret-key-for-jest-min-16';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';

afterEach(() => {
  jest.clearAllMocks();
});

afterAll(async () => {
  try {
    const { prisma } = await import('@/lib/prisma');
    await prisma.$disconnect();
  } catch {
    // prisma não carregado nesta suite
  }
});
