/**
 * Configuração Jest para testes
 */

module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/tests'],
    testMatch: ['**/*.test.ts'],
    collectCoverageFrom: [
        'core/**/*.ts',
        'backend/**/*.js',
        '!**/*.d.ts',
        '!**/node_modules/**',
        '!**/dist/**'
    ],
    coverageDirectory: 'coverage',
    coverageReporters: ['text', 'lcov', 'html'],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
        '^@core/(.*)$': '<rootDir>/core/$1',
        '^@backend/(.*)$': '<rootDir>/backend/$1'
    },
    setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
    testTimeout: 30000,
    verbose: true
};

