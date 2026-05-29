/**
 * Constantes de geofence — seguro para import no cliente (sem Prisma).
 * @see lib/modo-mercado-vivo.ts
 */

export const GEOFENCE_RAIO_METROS = 200;
export const GEOFENCE_RAIO_MIN = 50;
export const GEOFENCE_RAIO_MAX = 800;

export const GEOFENCE_RAIO_OPCOES = [100, 200, 350, 500, 800] as const;

export function normalizarRaioGeofenceMetros(valor: unknown): number {
  const n = typeof valor === 'number' ? valor : parseInt(String(valor ?? ''), 10);
  if (!Number.isFinite(n)) return GEOFENCE_RAIO_METROS;
  return Math.min(GEOFENCE_RAIO_MAX, Math.max(GEOFENCE_RAIO_MIN, Math.round(n)));
}

export function parseRaioGeofencePerfil(perfilPreci: unknown): number {
  if (!perfilPreci || typeof perfilPreci !== 'object') return GEOFENCE_RAIO_METROS;
  return normalizarRaioGeofenceMetros(
    (perfilPreci as { geofenceRaioMetros?: number }).geofenceRaioMetros
  );
}
