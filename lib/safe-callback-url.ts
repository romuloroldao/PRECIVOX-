/**
 * Evita open redirect: só aceita caminhos relativos internos.
 */
export function safeCallbackUrl(
  raw: string | null | undefined,
  defaultPath = '/cliente/home'
): string {
  if (raw == null || typeof raw !== 'string') return defaultPath;
  try {
    const decoded = decodeURIComponent(raw.trim());
    if (!decoded.startsWith('/') || decoded.startsWith('//')) return defaultPath;
    return decoded;
  } catch {
    return defaultPath;
  }
}

/** Destino padrão da jornada “criar lista” a partir da landing. */
export const CALLBACK_LISTA_NOVA = '/cliente/listas/nova';

export function loginUrlWithCallback(path: string = CALLBACK_LISTA_NOVA): string {
  return `/login?callbackUrl=${encodeURIComponent(path)}`;
}

export function signupUrlWithCallback(path: string = CALLBACK_LISTA_NOVA): string {
  return `/signup?callbackUrl=${encodeURIComponent(path)}`;
}
