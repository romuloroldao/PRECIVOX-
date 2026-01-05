/**
 * Funções helper para APIs de Markets
 * Todas incluem credentials: 'include' para garantir envio de cookies
 */

export interface Market {
  id: string;
  nome: string;
  cnpj: string;
  descricao: string | null;
  telefone: string | null;
  emailContato: string | null;
  horarioFuncionamento: string | null;
  logo: string | null;
  ativo: boolean;
  gestorId: string | null;
  planoId: string | null;
  dataCriacao: Date;
  dataAtualizacao: Date;
  gestor?: {
    id: string;
    nome: string | null;
    email: string;
  };
}

export interface MarketsResponse {
  success: true;
  data: Market[];
}

export interface CreateMarketData {
  nome: string;
  cnpj: string;
  descricao?: string;
  telefone?: string;
  emailContato?: string;
  gestorId?: string;
  planoId?: string;
}

/**
 * Buscar todos os mercados
 */
export async function fetchMarkets(): Promise<MarketsResponse> {
  const res = await fetch('/api/markets', {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Criar novo mercado
 */
export async function createMarket(data: CreateMarketData): Promise<{ success: true; data: Market }> {
  const res = await fetch('/api/markets', {
    method: 'POST',
    credentials: 'include', // ✅ ESSENCIAL
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Buscar mercado por ID
 */
export async function fetchMarketById(marketId: string): Promise<{ success: true; data: Market }> {
  const res = await fetch(`/api/markets/${marketId}`, {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Atualizar mercado
 */
export async function updateMarket(
  marketId: string,
  data: Partial<CreateMarketData>
): Promise<{ success: true; data: Market }> {
  const res = await fetch(`/api/markets/${marketId}`, {
    method: 'PUT',
    credentials: 'include', // ✅ ESSENCIAL
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Deletar mercado
 */
export async function deleteMarket(marketId: string): Promise<void> {
  const res = await fetch(`/api/markets/${marketId}`, {
    method: 'DELETE',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }
}

