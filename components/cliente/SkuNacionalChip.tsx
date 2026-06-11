'use client';

import { useEffect, useState } from 'react';
import { Globe2 } from 'lucide-react';

type Resumo = {
  mercados: number;
  precoMin: number | null;
};

export function SkuNacionalChip({
  produtoCatalogoId,
  mercadoId,
}: {
  produtoCatalogoId?: string | null;
  mercadoId?: string | null;
}) {
  const [resumo, setResumo] = useState<Resumo | null>(null);

  useEffect(() => {
    if (!produtoCatalogoId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(
          `/api/cliente/sku-nacional?produtoId=${encodeURIComponent(produtoCatalogoId)}`,
          { credentials: 'include', cache: 'no-store' }
        );
        const json = await res.json();
        if (!cancelled && json.success && json.data?.resumo?.mercados > 0) {
          setResumo({
            mercados: json.data.resumo.mercados,
            precoMin: json.data.resumo.precoMin,
          });
        }
      } catch {
        if (!cancelled) setResumo(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [produtoCatalogoId, mercadoId]);

  if (!resumo || resumo.mercados < 1) return null;

  return (
    <span
      className="inline-flex items-center gap-1 rounded-full bg-sky-50 px-2 py-0.5 text-[10px] font-semibold text-sky-900 ring-1 ring-sky-100"
      title={
        resumo.precoMin != null
          ? `Mesmo SKU em ${resumo.mercados + 1} mercado(s) · desde R$ ${resumo.precoMin.toFixed(2)}`
          : `Mesmo SKU em outros mercados`
      }
    >
      <Globe2 className="h-3 w-3" />
      +{resumo.mercados} mercado{resumo.mercados > 1 ? 's' : ''}
    </span>
  );
}
