'use client';

import { useCallback, useEffect, useState } from 'react';

export type RaioFamiliarState = {
  ativo: boolean;
  meuRole: 'admin' | 'membro' | null;
  circle: {
    nomeCasa: string;
    codigoConvite: string;
    membros: { userId: string; nome: string; role: string }[];
    preferencias: {
      volumeFamiliar: number;
      mercadoPreferidoId: string | null;
      compartilharListas: boolean;
    };
    listaCompartilhada: {
      itens: unknown[];
      atualizadoEm: string;
      atualizadoPorNome: string;
    } | null;
  } | null;
};

export function useRaioFamiliar(enabled = true) {
  const [data, setData] = useState<RaioFamiliarState | null>(null);
  const [loading, setLoading] = useState(false);

  const recarregar = useCallback(async () => {
    if (!enabled) return;
    setLoading(true);
    try {
      const res = await fetch('/api/cliente/raio-familiar', {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setData({
          ativo: json.data.ativo,
          meuRole: json.data.meuRole,
          circle: json.data.circle,
        });
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }, [enabled]);

  useEffect(() => {
    void recarregar();
  }, [recarregar]);

  return { data, loading, recarregar };
}
