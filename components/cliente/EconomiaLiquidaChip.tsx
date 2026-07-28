'use client';

import { useEffect, useRef } from 'react';
import type { RecomendacaoEL } from '@/lib/economia-liquida';
import { cn } from '@/lib/utils';
import { MapPin, Home, HelpCircle } from 'lucide-react';
import { recordElSugestaoResposta } from '@/lib/events/frontend-events';
import { impressaoElJaRegistrada, marcarImpressaoEl } from '@/lib/el-sugestao-types';

export interface EconomiaLiquidaChipProps {
  recomendacao: RecomendacaoEL;
  economiaLiquida: number;
  explicacao?: string;
  mercadoDestino?: string;
  distanciaKm?: number | null;
  tempoMinutos?: number | null;
  className?: string;
  /** Quando informado, registra impressão da sugestão EL (uma vez por sessão/estoque). */
  tracking?: {
    estoqueId: string;
    mercadoOrigemId: string;
    produtoCatalogoId?: string;
  };
}

export function EconomiaLiquidaChip({
  recomendacao,
  economiaLiquida,
  explicacao,
  mercadoDestino,
  distanciaKm,
  tempoMinutos,
  className,
  tracking,
}: EconomiaLiquidaChipProps) {
  const ref = useRef<HTMLParagraphElement>(null);

  useEffect(() => {
    if (!tracking?.estoqueId || !tracking.mercadoOrigemId) return;
    if (impressaoElJaRegistrada(tracking.estoqueId)) return;

    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (!entries[0]?.isIntersecting) return;
        if (impressaoElJaRegistrada(tracking.estoqueId)) return;
        marcarImpressaoEl(tracking.estoqueId);
        void recordElSugestaoResposta('session', tracking.mercadoOrigemId, {
          acao: 'visualizada',
          recomendacao,
          economiaLiquida,
          distanciaKm,
          estoqueId: tracking.estoqueId,
          produtoId: tracking.produtoCatalogoId,
          mercadoOrigemId: tracking.mercadoOrigemId,
          mercadoDestinoNome: mercadoDestino,
        });
        observer.disconnect();
      },
      { threshold: 0.6 }
    );

    observer.observe(node);
    return () => observer.disconnect();
  }, [
    tracking,
    recomendacao,
    economiaLiquida,
    distanciaKm,
    mercadoDestino,
  ]);

  if (recomendacao === 'indeterminado' && economiaLiquida <= 0) {
    return null;
  }

  const styles = {
    ir: 'bg-emerald-600 text-white',
    ficar: 'bg-slate-100 text-slate-800 ring-1 ring-slate-200',
    indeterminado: 'bg-sky-50 text-sky-900 ring-1 ring-sky-200',
  };

  const Icon = recomendacao === 'ir' ? MapPin : recomendacao === 'ficar' ? Home : HelpCircle;

  let label = explicacao ?? '';
  if (!label) {
    if (recomendacao === 'ir') {
      label = `Vale ir${mercadoDestino ? ` — ${mercadoDestino}` : ''}: +R$ ${economiaLiquida.toFixed(2).replace('.', ',')} líquidos`;
      if (distanciaKm != null && tempoMinutos != null) {
        label += ` (~${Math.round(tempoMinutos)} min)`;
      }
    } else if (recomendacao === 'ficar') {
      label =
        economiaLiquida < 0
          ? 'Não vale sair — a viagem custa mais que a economia'
          : 'Fique aqui — economia líquida pequena para outro mercado';
    } else {
      label = `Economia no preço: R$ ${Math.max(0, economiaLiquida).toFixed(2).replace('.', ',')} (ative localização para ver se vale ir)`;
    }
  }

  return (
    <p
      ref={ref}
      className={cn(
        'mt-2 flex items-start gap-2 rounded-lg px-2.5 py-2 text-xs font-medium leading-snug',
        styles[recomendacao],
        className
      )}
      title={explicacao}
    >
      <Icon className="mt-0.5 h-4 w-4 shrink-0 opacity-90" aria-hidden />
      <span>{label}</span>
    </p>
  );
}
