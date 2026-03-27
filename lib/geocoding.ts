/**
 * Geocodificação a partir do endereço (Nominatim / OSM).
 * Respeite a política de uso: cache, não bombardear; User-Agent identificável.
 */

export async function geocodeEnderecoBrasil(params: {
  endereco?: string | null;
  bairro?: string | null;
  cidade?: string | null;
  estado?: string | null;
  cep?: string | null;
}): Promise<{ lat: number; lon: number } | null> {
  const parts = [
    params.endereco?.trim(),
    params.bairro?.trim(),
    params.cidade?.trim(),
    params.estado?.trim(),
    params.cep?.trim() ? `CEP ${params.cep.replace(/\D/g, '')}` : null,
    'Brasil',
  ].filter((p): p is string => Boolean(p && p.length > 0));

  if (parts.length < 2) {
    return null;
  }

  const q = parts.join(', ');
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`;

  const res = await fetch(url, {
    headers: {
      'User-Agent':
        process.env.PRECIVOX_NOMINATIM_UA ||
        'Precivox/1.0 (https://precivox.com.br; contato@sistema)',
      'Accept-Language': 'pt-BR,pt;q=0.9',
    },
    signal: AbortSignal.timeout(12_000),
  });

  if (!res.ok) {
    return null;
  }

  const json: unknown = await res.json();
  if (!Array.isArray(json) || json.length === 0) {
    return null;
  }

  const row = json[0] as { lat?: string; lon?: string };
  const lat = parseFloat(row.lat ?? '');
  const lon = parseFloat(row.lon ?? '');
  if (Number.isNaN(lat) || Number.isNaN(lon)) {
    return null;
  }

  return { lat, lon };
}
