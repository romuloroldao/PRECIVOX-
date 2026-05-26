'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShoppingBasket, Bell } from 'lucide-react';

interface Props {
  mercadoId: string | null;
}

export function CestaProvavelCard({ mercadoId }: Props) {
  const [data, setData] = useState<{
    itens: { nome: string; motivo: string }[];
    mensagem: string;
    notificacaoSugerida?: string;
    intentScore: number;
    diaMercado?: { label: string } | null;
  } | null>(null);

  useEffect(() => {
    if (!mercadoId) return;
    void (async () => {
      try {
        const res = await fetch(`/api/cliente/cesta-provavel?mercadoId=${mercadoId}`, {
          credentials: 'include',
          cache: 'no-store',
        });
        const json = await res.json();
        if (json.success) setData(json.data);
      } catch {
        /* ignore */
      }
    })();
  }, [mercadoId]);

  useEffect(() => {
    if (!data?.notificacaoSugerida || typeof window === 'undefined') return;
    if (Notification.permission !== 'granted') return;
    const k = `precivox_notif_cesta_${mercadoId}_${new Date().toDateString()}`;
    if (sessionStorage.getItem(k)) return;
    sessionStorage.setItem(k, '1');
    try {
      new Notification('PRECIVOX — Cesta da semana', {
        body: data.notificacaoSugerida,
        tag: 'precivox-cesta',
      });
    } catch {
      /* ignore */
    }
  }, [data, mercadoId]);

  if (!mercadoId || !data?.itens?.length) return null;

  return (
    <div className="rounded-xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-sm">
      <div className="flex items-start gap-2">
        <ShoppingBasket className="h-5 w-5 shrink-0 text-emerald-700" />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-emerald-950">Cesta provável</h3>
          <p className="mt-1 text-xs text-emerald-900/80">{data.mensagem}</p>
          {data.diaMercado && (
            <p className="mt-1 flex items-center gap-1 text-xs font-medium text-emerald-800">
              <Bell className="h-3.5 w-3.5" />
              Dia de mercado: {data.diaMercado.label}
            </p>
          )}
          <ul className="mt-2 space-y-1">
            {data.itens.slice(0, 5).map((item, i) => (
              <li key={i} className="text-xs text-gray-700">
                <span className="font-medium">{item.nome}</span>
                <span className="text-gray-500"> — {item.motivo}</span>
              </li>
            ))}
          </ul>
          <Link
            href="/cliente/busca"
            className="mt-3 inline-block text-xs font-semibold text-precivox-blue hover:underline"
          >
            Revisar e montar lista →
          </Link>
        </div>
      </div>
    </div>
  );
}
