import type { UserEvent } from '@/lib/ai/types';
import type { MlLeveChurn, ChurnNivel } from './types';

function nivelDeScore(score: number): ChurnNivel {
  if (score >= 65) return 'alto';
  if (score >= 35) return 'medio';
  return 'baixo';
}

/**
 * Risco de churn 0–100 a partir de recência e queda de atividade (heurístico).
 */
export function calcularChurnRisk(eventos: UserEvent[], referencia = new Date()): MlLeveChurn {
  if (!eventos.length) {
    return {
      score: 75,
      nivel: 'alto',
      diasSemAtividade: 999,
      explicacao: 'Sem eventos recentes no PRECIVOX — usuário inativo ou novo.',
    };
  }

  const ordenados = [...eventos].sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  const ultimo = new Date(ordenados[0].timestamp);
  const diasSemAtividade = Math.floor(
    (referencia.getTime() - ultimo.getTime()) / 86400000
  );

  const ha7 = new Date(referencia);
  ha7.setDate(ha7.getDate() - 7);
  const ha14 = new Date(referencia);
  ha14.setDate(ha14.getDate() - 14);

  const ultimos7 = eventos.filter((e) => new Date(e.timestamp) >= ha7).length;
  const dias7anteriores = eventos.filter((e) => {
    const t = new Date(e.timestamp);
    return t >= ha14 && t < ha7;
  }).length;

  let score = Math.min(90, diasSemAtividade * 4);
  if (dias7anteriores > 0 && ultimos7 < dias7anteriores * 0.5) {
    score = Math.min(100, score + 20);
  }
  if (ultimos7 >= 5) score = Math.max(0, score - 25);

  const teveCompra = eventos.some((e) =>
    ['compra_confirmada', 'compra_realizada'].includes(e.type)
  );
  if (teveCompra && diasSemAtividade > 21) score = Math.min(100, score + 15);

  const nivel = nivelDeScore(score);
  let explicacao = `Última atividade há ${diasSemAtividade} dia(s).`;
  if (nivel === 'alto') {
    explicacao += ' Risco alto de abandono — vale reativar com cesta ou push.';
  } else if (nivel === 'medio') {
    explicacao += ' Atividade em queda — monitore retenção.';
  } else {
    explicacao += ' Padrão saudável de uso.';
  }

  return { score: Math.round(score), nivel, diasSemAtividade, explicacao };
}
