import type { MlLeveSnapshot } from './types';

function parsePerfilPreci(raw: unknown): Record<string, unknown> {
  if (!raw || typeof raw !== 'object') return {};
  return { ...(raw as Record<string, unknown>) };
}

/**
 * Lê snapshot batch por mercado (suporta legado `mlLeve` único).
 */
export function lerMlLeveSnapshot(perfilPreci: unknown, mercadoId: string): MlLeveSnapshot | null {
  if (!perfilPreci || typeof perfilPreci !== 'object') return null;
  const base = perfilPreci as Record<string, unknown>;

  const porMercado = base.mlLevePorMercado as Record<string, MlLeveSnapshot> | undefined;
  if (porMercado?.[mercadoId]) return porMercado[mercadoId];

  const legado = base.mlLeve as MlLeveSnapshot | undefined;
  if (legado?.mercadoId === mercadoId) return legado;

  return null;
}

/**
 * Persiste snapshot por mercado em `perfilPreci.mlLevePorMercado`.
 */
export function gravarMlLeveSnapshot(
  perfilPreci: unknown,
  snapshot: MlLeveSnapshot
): Record<string, unknown> {
  const base = parsePerfilPreci(perfilPreci);
  const porMercado: Record<string, MlLeveSnapshot> = {
    ...(base.mlLevePorMercado as Record<string, MlLeveSnapshot> | undefined),
  };

  const legado = base.mlLeve as MlLeveSnapshot | undefined;
  if (legado?.mercadoId && !porMercado[legado.mercadoId]) {
    porMercado[legado.mercadoId] = legado;
  }

  porMercado[snapshot.mercadoId] = snapshot;

  const { mlLeve: _legado, ...resto } = base;
  return { ...resto, mlLevePorMercado: porMercado };
}
