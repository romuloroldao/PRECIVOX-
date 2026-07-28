/**
 * Registro client-side de eventos EL (via API).
 */

import { recordElSugestaoResposta } from '@/lib/events/frontend-events';
import type { ElSugestaoMetadata } from '@/lib/el-sugestao-types';
import type { ProdutoMelhorAlternativa } from '@/app/hooks/useProdutos';

type ProdutoElContext = {
  estoqueId: string;
  produtoCatalogoId?: string;
  mercadoOrigemId: string;
  melhorAlternativa?: ProdutoMelhorAlternativa | null;
};

export function registrarRespostaEl(
  produto: ProdutoElContext,
  acao: ElSugestaoMetadata['acao']
): void {
  const el = produto.melhorAlternativa?.economiaLiquida;
  if (!el || !produto.mercadoOrigemId) return;

  void recordElSugestaoResposta('session', produto.mercadoOrigemId, {
    acao,
    recomendacao: el.recomendacao,
    economiaLiquida: el.economiaLiquida,
    distanciaKm: produto.melhorAlternativa?.distanciaKm,
    estoqueId: produto.estoqueId,
    produtoId: produto.produtoCatalogoId,
    mercadoOrigemId: produto.mercadoOrigemId,
    mercadoDestinoNome: produto.melhorAlternativa?.mercadoNome,
  });
}

export { inferirAcaoElAoAdicionar } from '@/lib/el-sugestao-types';
