import { bucketUsuariosUnicos, passaKAnonymity, K_ANON_NETWORK } from '@/lib/preci-network/privacy';
import { validarPreciNetworkAuth, preciNetworkKeysConfigured } from '@/lib/preci-network/auth';

describe('PRECI Network — privacy', () => {
  it('rejeita buckets abaixo de k-anonymity', () => {
    expect(bucketUsuariosUnicos(3)).toBeNull();
    expect(bucketUsuariosUnicos(5)).toBe('5-9');
    expect(bucketUsuariosUnicos(50)).toBe('50-99');
    expect(bucketUsuariosUnicos(120)).toBe('100+');
  });

  it('passaKAnonymity exige usuários e sinais mínimos', () => {
    expect(passaKAnonymity(4, 10)).toBe(false);
    expect(passaKAnonymity(5, 4)).toBe(false);
    expect(passaKAnonymity(5, 5)).toBe(true);
    expect(K_ANON_NETWORK).toBe(5);
  });
});

describe('PRECI Network — auth', () => {
  const envBackup = process.env.PRECI_NETWORK_API_KEYS;

  afterEach(() => {
    process.env.PRECI_NETWORK_API_KEYS = envBackup;
  });

  it('503 quando chaves não configuradas', () => {
    delete process.env.PRECI_NETWORK_API_KEYS;
    expect(preciNetworkKeysConfigured()).toBe(false);
    const r = validarPreciNetworkAuth('Bearer x');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(503);
  });

  it('valida Bearer com chave correta', () => {
    process.env.PRECI_NETWORK_API_KEYS = JSON.stringify({
      'cpg-demo': { key: 'secret-test', scopes: ['intent', 'categories'] },
    });
    const r = validarPreciNetworkAuth('Bearer secret-test', 'intent');
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.clientId).toBe('cpg-demo');
  });

  it('rejeita escopo não autorizado', () => {
    process.env.PRECI_NETWORK_API_KEYS = JSON.stringify({
      'cpg-demo': { key: 'secret-test', scopes: ['categories'] },
    });
    const r = validarPreciNetworkAuth('Bearer secret-test', 'intent');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.status).toBe(403);
  });
});
