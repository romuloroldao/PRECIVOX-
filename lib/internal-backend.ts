/**
 * BFF Helper — lib/internal-backend.ts
 *
 * REGRA: Todo fetch server-side ao Express (3001) DEVE usar internalFetch.
 * Proibido fetch direto para 127.0.0.1:3001 ou BACKEND_INTERNAL_URL.
 *
 * ÚNICA API PÚBLICA: internalFetch(path, options)
 * getInternalBackendUrl e getInternalBackendHeaders são internos (não exportados).
 */

const RESERVED_HEADERS = ['x-internal-secret', 'authorization'];

function getInternalBackendUrl(path: string): string {
    const base =
        process.env.BACKEND_INTERNAL_URL ||
        (process.env.NODE_ENV === 'production'
            ? 'http://127.0.0.1:3001'
            : 'http://localhost:3001');

    const cleanPath = path.startsWith('/') ? path : `/${path}`;
    return `${base}${cleanPath}`;
}

function getInternalBackendHeaders(
    jwtToken?: string,
    extraHeaders?: HeadersInit
): Record<string, string> {
    const secret = process.env.INTERNAL_API_SECRET;

    if (!secret) {
        throw new Error(
            '[BFF] INTERNAL_API_SECRET não está definido. ' +
            'Adicione esta variável ao .env.production do Next.js.'
        );
    }

    const headers: Record<string, string> = {
        'x-internal-secret': secret,
        'Content-Type': 'application/json',
    };

    if (jwtToken) {
        headers['Authorization'] = `Bearer ${jwtToken}`;
    }

    if (extraHeaders) {
        const extra = extraHeaders as Record<string, string>;
        Object.keys(extra).forEach((key) => {
            if (!RESERVED_HEADERS.includes(key.toLowerCase())) {
                headers[key] = extra[key];
            }
        });
    }

    return headers;
}

/**
 * Bloqueia sobrescrita de headers críticos.
 * Regra: se a chave existir → erro. Valor é ignorado (undefined, null, '' também disparam).
 * Suporta objeto plano ou instância de Headers.
 */
function assertNoReservedHeaders(headers?: HeadersInit): void {
    if (!headers) return;

    const checkKey = (key: string): void => {
        const lower = key.toLowerCase();
        if (RESERVED_HEADERS.includes(lower)) {
            throw new Error(
                `[BFF] Não é permitido sobrescrever o header "${key}" em internalFetch. ` +
                'Use jwtToken nas options para Authorization.'
            );
        }
    };

    if (typeof (headers as Headers).has === 'function') {
        const h = headers as Headers;
        for (const name of RESERVED_HEADERS) {
            if (h.has(name)) throw new Error(
                `[BFF] Não é permitido sobrescrever o header "${name}" em internalFetch. Use jwtToken nas options para Authorization.`
            );
        }
        return;
    }

    const h = headers as Record<string, unknown>;
    for (const key of Object.keys(h)) {
        checkKey(key);
    }
}

/**
 * Única forma permitida de chamar o backend interno.
 * Headers x-internal-secret e authorization são sempre aplicados por último e não podem ser sobrescritos.
 *
 * @param path - Caminho da rota Express, ex: '/api/v1/products/upload-smart/123'
 * @param options - Opções do fetch + jwtToken opcional
 */
export async function internalFetch(
    path: string,
    options: RequestInit & { jwtToken?: string; skipContentType?: boolean } = {}
): Promise<Response> {
    const { jwtToken, skipContentType = false, ...fetchOpts } = options;

    assertNoReservedHeaders(fetchOpts.headers);

    const url = getInternalBackendUrl(path);

    const baseHeaders = getInternalBackendHeaders(
        jwtToken,
        skipContentType ? { 'Content-Type': '' } : undefined
    );

    if (skipContentType) {
        delete baseHeaders['Content-Type'];
    }

    // Secret e Authorization aplicados por último — nunca podem ser sobrescritos
    const mergedHeaders: Record<string, string> = {
        ...(typeof fetchOpts.headers === 'object' && fetchOpts.headers !== null
            ? (fetchOpts.headers as Record<string, string>)
            : {}),
        ...baseHeaders,
    };

    return fetch(url, {
        ...fetchOpts,
        headers: mergedHeaders,
    });
}
