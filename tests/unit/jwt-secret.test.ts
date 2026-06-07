import { getJwtSecret } from '@/lib/jwt-secret';

describe('jwt-secret', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv, NODE_ENV: 'test' };
    process.env.JWT_SECRET = 'test-secret-key-for-jest-min-16';
    delete process.env.NEXTAUTH_SECRET;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it('retorna JWT_SECRET quando válido', () => {
    expect(getJwtSecret()).toBe('test-secret-key-for-jest-min-16');
  });

  it('rejeita placeholder inseguro em produção', () => {
    process.env.NODE_ENV = 'production';
    process.env.JWT_SECRET = 'fallback-secret-change-in-production';
    delete process.env.NEXTAUTH_SECRET;

    expect(() => getJwtSecret()).toThrow(/JWT_SECRET|NEXTAUTH_SECRET/);
  });
});
