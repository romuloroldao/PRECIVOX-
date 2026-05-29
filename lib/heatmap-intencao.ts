/**
 * Heatmap de intenção agregada (gestor) — Épico 11.2
 * Padrões dia×hora a partir de eventos ponderados (Intent Score).
 */

import { prisma } from '@/lib/prisma';
import { INTENT_EVENT_PESOS, INTENT_EVENT_TYPES } from '@/lib/ai/intent-score-engine';

export type HeatmapCelula = {
  diaSemana: number;
  diaLabel: string;
  faixaHora: number;
  faixaLabel: string;
  intensidade: number;
  eventosPonderados: number;
};

export type HeatmapPico = {
  diaSemana: number;
  diaLabel: string;
  faixaHora: number;
  faixaLabel: string;
  intensidade: number;
};

export type HeatmapIntencaoResumo = {
  mercadoId: string;
  periodoDias: number;
  celulas: HeatmapCelula[];
  picos: HeatmapPico[];
  totalEventos: number;
  usuariosUnicos: number;
  explicacao: string;
};

const DIAS_LABEL = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'] as const;

const FAIXAS_HORA = [
  { inicio: 0, fim: 3, label: '0–3h' },
  { inicio: 4, fim: 7, label: '4–7h' },
  { inicio: 8, fim: 11, label: '8–11h' },
  { inicio: 12, fim: 15, label: '12–15h' },
  { inicio: 16, fim: 19, label: '16–19h' },
  { inicio: 20, fim: 23, label: '20–23h' },
] as const;

function faixaParaHora(hora: number): (typeof FAIXAS_HORA)[number] {
  for (const f of FAIXAS_HORA) {
    if (hora >= f.inicio && hora <= f.fim) return f;
  }
  return FAIXAS_HORA[FAIXAS_HORA.length - 1];
}

export async function getHeatmapIntencaoMercado(
  mercadoId: string,
  dias = 14
): Promise<HeatmapIntencaoResumo> {
  const desde = new Date();
  desde.setDate(desde.getDate() - dias);

  const eventos = await prisma.userEvent.findMany({
    where: {
      mercadoId,
      timestamp: { gte: desde },
      type: { in: INTENT_EVENT_TYPES },
    },
    select: { type: true, timestamp: true, userId: true },
  });

  const grid = new Map<string, number>();
  const usuarios = new Set<string>();

  for (const ev of eventos) {
    usuarios.add(ev.userId);
    const peso = INTENT_EVENT_PESOS[ev.type as keyof typeof INTENT_EVENT_PESOS] ?? 1;
    const d = new Date(ev.timestamp);
    const dia = d.getDay();
    const faixa = faixaParaHora(d.getHours());
    const key = `${dia}-${faixa.inicio}`;
    grid.set(key, (grid.get(key) ?? 0) + peso);
  }

  let maxPeso = 0;
  for (const v of grid.values()) {
    if (v > maxPeso) maxPeso = v;
  }

  const celulas: HeatmapCelula[] = [];
  for (let dia = 0; dia < 7; dia++) {
    for (const faixa of FAIXAS_HORA) {
      const key = `${dia}-${faixa.inicio}`;
      const eventosPonderados = grid.get(key) ?? 0;
      const intensidade =
        maxPeso > 0 ? Math.round((eventosPonderados / maxPeso) * 100) : 0;
      celulas.push({
        diaSemana: dia,
        diaLabel: DIAS_LABEL[dia],
        faixaHora: faixa.inicio,
        faixaLabel: faixa.label,
        intensidade,
        eventosPonderados: Math.round(eventosPonderados * 10) / 10,
      });
    }
  }

  const picos = [...celulas]
    .filter((c) => c.intensidade > 0)
    .sort((a, b) => b.intensidade - a.intensidade)
    .slice(0, 5)
    .map((c) => ({
      diaSemana: c.diaSemana,
      diaLabel: c.diaLabel,
      faixaHora: c.faixaHora,
      faixaLabel: c.faixaLabel,
      intensidade: c.intensidade,
    }));

  return {
    mercadoId,
    periodoDias: dias,
    celulas,
    picos,
    totalEventos: eventos.length,
    usuariosUnicos: usuarios.size,
    explicacao:
      'Intenção agregada e anônima: buscas, listas, visualizações e check-ins ponderados pelo Intent Score. Use para reforçar equipe e promoções nos horários de pico.',
  };
}
