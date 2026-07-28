/**
 * Eventos disparados pelo browser — sempre via API (sem Prisma no bundle do cliente).
 */

import type { UserEventType } from '@/lib/ai/types';

async function postEvent(
  type: UserEventType,
  _userId: string,
  mercadoId: string,
  metadata: Record<string, unknown> = {}
): Promise<{ elRefinado?: boolean }> {
  if (typeof window === 'undefined') {
    return {};
  }
  try {
    const res = await fetch('/api/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ type, mercadoId, metadata }),
    });
    const data = (await res.json()) as { elRefinado?: boolean };
    if (data.elRefinado) {
      window.dispatchEvent(new CustomEvent('precivox-el-refinamento-atualizado'));
    }
    return data;
  } catch (error) {
    console.error('[FrontendEvents] Falha ao enviar evento:', error);
    return {};
  }
}

export async function recordListCreated(
  userId: string,
  mercadoId: string,
  listaId: string
): Promise<void> {
  await postEvent('lista_criada', userId, mercadoId, { listaId });
}

export async function recordProductViewed(
  userId: string,
  mercadoId: string,
  produtoId: string,
  categoriaId?: string
): Promise<void> {
  await postEvent('produto_visualizado', userId, mercadoId, {
    produtoId,
    ...(categoriaId ? { categoriaId } : {}),
  });
}

export async function recordProductAddedToList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string,
  quantidade: number,
  preco?: number,
  produtoCatalogoId?: string
): Promise<void> {
  await postEvent('produto_adicionado_lista', userId, mercadoId, {
    produtoId,
    listaId,
    quantidade,
    ...(preco !== undefined ? { preco } : {}),
    ...(produtoCatalogoId ? { produtoCatalogoId } : {}),
  });
}

export async function recordProductRemovedFromList(
  userId: string,
  mercadoId: string,
  produtoId: string,
  listaId: string,
  produtoCatalogoId?: string
): Promise<void> {
  await postEvent('produto_removido_lista', userId, mercadoId, {
    produtoId,
    listaId,
    ...(produtoCatalogoId ? { produtoCatalogoId } : {}),
  });
}

export async function recordSearchPerformed(
  userId: string,
  mercadoId: string,
  searchQuery: string,
  resultados?: number
): Promise<void> {
  await postEvent('produto_buscado', userId, mercadoId, {
    searchQuery,
    ...(resultados !== undefined ? { resultados } : {}),
  });
}

export async function recordPurchaseCompleted(
  userId: string,
  mercadoId: string,
  produtos: Array<{ produtoId: string; quantidade: number; preco: number }>,
  valorTotal: number
): Promise<void> {
  for (const produto of produtos) {
    await postEvent('compra_realizada', userId, mercadoId, {
      produtoId: produto.produtoId,
      quantidade: produto.quantidade,
      preco: produto.preco,
      valorTotal,
    });
  }
}

export async function recordAccessTime(userId: string, mercadoId: string): Promise<void> {
  await postEvent('horario_acesso', userId, mercadoId, {
    timestamp: new Date().toISOString(),
  });
}

export async function recordProdutoSubstituicaoAceita(
  userId: string,
  mercadoId: string,
  metadata: {
    produtoId: string;
    substitutoId: string;
    modo: 'categoria' | 'equivalente';
    listaId?: string;
  }
): Promise<void> {
  await postEvent('produto_substituicao_aceita', userId, mercadoId, metadata as Record<string, unknown>);
}

export async function recordRotaConsolidacaoLista(
  userId: string,
  mercadoId: string,
  metadata: {
    acao: 'aceita' | 'desfeita';
    deltaTotal?: number;
    mercadosAntes?: number;
    mercadosDepois?: number;
    anchorNome?: string;
  }
): Promise<void> {
  await postEvent('rota_consolidacao_lista', userId, mercadoId, metadata as Record<string, unknown>);
}

export async function recordRemocaoListaConfirmada(
  userId: string,
  mercadoId: string,
  metadata: {
    produtoId: string;
    listaId?: string;
    aposInterrupcao?: boolean;
  }
): Promise<void> {
  await postEvent('remocao_lista_confirmada', userId, mercadoId, metadata as Record<string, unknown>);
}

/** Crowd: preço na prateleira está correto */
export async function recordPrecoConfirmado(
  userId: string,
  mercadoId: string,
  metadata: {
    produtoId: string;
    estoqueId?: string;
    precoVisto?: number;
    unidadeId?: string;
  }
): Promise<void> {
  await postEvent('preco_confirmado', userId, mercadoId, metadata as Record<string, unknown>);
}

/** Crowd: mais caro / mais barato que o app */
export async function recordPrecoReportado(
  userId: string,
  mercadoId: string,
  metadata: {
    produtoId: string;
    direcao: 'mais_caro' | 'mais_barato';
    precoVisto?: number;
    estoqueId?: string;
    unidadeId?: string;
  }
): Promise<void> {
  await postEvent('preco_reportado', userId, mercadoId, metadata as Record<string, unknown>);
}

export async function recordCheckinMercado(
  userId: string,
  mercadoId: string,
  metadata?: { unidadeId?: string; lat?: number; lon?: number }
): Promise<void> {
  await postEvent('checkin_mercado', userId, mercadoId, (metadata ?? {}) as Record<string, unknown>);
}

/** Pós-compra: substituto leve de PDV */
export async function recordCompraConfirmada(
  userId: string,
  mercadoId: string,
  metadata: {
    listaId?: string;
    unidadeId?: string;
    itensCount?: number;
    valorEstimado?: number;
  }
): Promise<void> {
  await postEvent('compra_confirmada', userId, mercadoId, metadata as Record<string, unknown>);
}

export async function recordCompraParcial(
  userId: string,
  mercadoId: string,
  metadata: { listaId?: string; itensComprados?: number; itensTotal?: number }
): Promise<void> {
  await postEvent('compra_parcial', userId, mercadoId, metadata as Record<string, unknown>);
}

export async function recordCompraNaoRealizada(
  userId: string,
  mercadoId: string,
  metadata?: { listaId?: string; motivo?: string }
): Promise<void> {
  await postEvent('compra_nao_realizada', userId, mercadoId, (metadata ?? {}) as Record<string, unknown>);
}

/** Resposta à sugestão de Economia Líquida (visualização, aceite, ignore). */
export async function recordElSugestaoResposta(
  _userId: string,
  mercadoId: string,
  metadata: import('@/lib/el-sugestao-types').ElSugestaoMetadata
): Promise<void> {
  await postEvent('el_sugestao_resposta', _userId, mercadoId, metadata as Record<string, unknown>);
}

/** Funil AI-Native: usuário abriu Casa / Agora. */
export async function recordCasaAberta(
  userId: string,
  mercadoId: string,
  metadata?: { shell?: 'ai_native' | 'legacy' }
): Promise<void> {
  await postEvent('casa_aberta', userId, mercadoId, (metadata ?? { shell: 'ai_native' }) as Record<string, unknown>);
}

/** Funil AI-Native: rascunho da semana montado (Casa CTA ou Compra). */
export async function recordCompraRascunhoMontado(
  userId: string,
  mercadoId: string,
  metadata?: { origem?: 'casa' | 'compra' | 'hub'; itensCount?: number }
): Promise<void> {
  await postEvent(
    'compra_rascunho_montado',
    userId,
    mercadoId,
    (metadata ?? {}) as Record<string, unknown>
  );
}
