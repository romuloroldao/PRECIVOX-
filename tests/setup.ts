/**
 * Configuração global para testes
 */

// Mock de variáveis de ambiente
process.env.JWT_SECRET = 'test-secret-key-for-jest-min-16';
process.env.NEXTAUTH_SECRET = process.env.JWT_SECRET;
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test_db';
process.env.NODE_ENV = 'test';

// Limpar mocks após cada teste
afterEach(() => {
    jest.clearAllMocks();
});

