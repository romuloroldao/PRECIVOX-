import { randomBytes } from 'crypto';
import { SEED_PREFIX } from '../config';

export function seedId(suffix: string): string {
  return `${SEED_PREFIX}-${suffix}`;
}

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomFloat(min: number, max: number, decimals = 2): number {
  const v = Math.random() * (max - min) + min;
  return parseFloat(v.toFixed(decimals));
}

export function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

export function pickN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/** Gera CNPJ fake com dígitos verificadores válidos */
export function gerarCnpj(index: number): string {
  const base = String(10000000 + index).padStart(8, '0');
  const filial = '0001';
  const partial = base + filial;

  const calcDigit = (nums: string, weights: number[]) => {
    const sum = nums.split('').reduce((acc, d, i) => acc + parseInt(d, 10) * weights[i], 0);
    const rest = sum % 11;
    return rest < 2 ? 0 : 11 - rest;
  };

  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calcDigit(partial, w1);
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d2 = calcDigit(partial + d1, w2);

  return `${base.slice(0, 2)}.${base.slice(2, 5)}.${base.slice(5, 8)}/${filial}-${d1}${d2}`;
}

/** EAN-13 fake com prefixo 789 (Brasil) */
export function gerarCodigoBarras(index: number): string {
  const body = `789${String(index).padStart(9, '0').slice(-9)}`;
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(body[i], 10) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return body + check;
}

export function normalizarChave(texto: string): string {
  return texto
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

export function addHours(date: Date, hours: number): Date {
  const d = new Date(date);
  d.setHours(d.getHours() + hours);
  return d;
}

/** Fator sazonal por mês (0=jan) — verão BR + festas */
export function fatorSazonalMes(mes: number, perfilSazonalidade: number): number {
  const base = [0.92, 0.88, 0.95, 0.98, 1.0, 1.05, 1.08, 1.06, 1.0, 0.97, 1.02, 1.25][mes];
  return 1 + (base - 1) * perfilSazonalidade;
}

/** Pico horário: manhã, almoço, tarde, noite */
export function fatorHorario(hora: number): number {
  if (hora >= 7 && hora <= 9) return 1.3;
  if (hora >= 11 && hora <= 13) return 1.5;
  if (hora >= 17 && hora <= 20) return 1.8;
  if (hora >= 21 || hora <= 6) return 0.4;
  return 1.0;
}

export function chunk<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

export function uuid(): string {
  return randomBytes(16).toString('hex').replace(/(.{8})(.{4})(.{4})(.{4})(.{12})/, '$1-$2-$3-$4-$5');
}
