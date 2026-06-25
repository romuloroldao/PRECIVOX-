/**
 * Privacy gates PRECI Network — k-anonymity estrito
 */

export const K_ANON_NETWORK = 5;

/** Bucket de usuários para API externa (nunca expõe contagem exata < k) */
export function bucketUsuariosUnicos(count: number): string | null {
  if (count < K_ANON_NETWORK) return null;
  if (count < 10) return '5-9';
  if (count < 25) return '10-24';
  if (count < 50) return '25-49';
  if (count < 100) return '50-99';
  return '100+';
}

export function passaKAnonymity(usuariosUnicos: number, sinais: number): boolean {
  return usuariosUnicos >= K_ANON_NETWORK && sinais >= K_ANON_NETWORK;
}
