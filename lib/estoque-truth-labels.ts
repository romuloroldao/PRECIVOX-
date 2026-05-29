/**
 * Labels de truth layer para UI — sem dependência de Prisma (client-safe).
 */

export function labelFrescorPreco(verificadoEm: Date | null, atualizadoEm: Date): string {
  const ref = verificadoEm ?? atualizadoEm;
  const horas = (Date.now() - ref.getTime()) / (1000 * 60 * 60);
  if (horas < 1) return 'Atualizado agora';
  if (horas < 24) return `Atualizado há ${Math.floor(horas)}h`;
  const dias = Math.floor(horas / 24);
  if (dias === 1) return 'Atualizado ontem';
  return `Atualizado há ${dias} dias`;
}

export function labelConfianca(confianca: number): 'alta' | 'media' | 'baixa' {
  if (confianca >= 80) return 'alta';
  if (confianca >= 55) return 'media';
  return 'baixa';
}
