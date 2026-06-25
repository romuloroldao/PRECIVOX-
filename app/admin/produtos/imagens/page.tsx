'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import DashboardLayout from '@/components/DashboardLayout';
import { useToast } from '@/components/ToastContainer';
import { getDashboardUrl } from '@/lib/redirect';
import { Button, Card, ProductImage } from '@/components/ui';
import { RefreshCw, RotateCcw, Trash2, Upload } from 'lucide-react';

type ImagemStatus = 'PENDENTE' | 'AUTOMATICA' | 'MANUAL' | 'INVALIDA';

interface ProdutoImagemRow {
  produtoId: string;
  nome: string;
  codigoBarras: string | null;
  marca: string | null;
  status: ImagemStatus;
  imagem: string | null;
  imagemThumb: string | null;
  autoOrigem: string | null;
  autoFonteUrl: string | null;
  manualOrigem: string | null;
  tentativas: number;
  ultimoErro: string | null;
  atualizadoEm: string;
}

const STATUS_LABELS: Record<ImagemStatus, string> = {
  PENDENTE: 'Pendente',
  AUTOMATICA: 'Automática',
  MANUAL: 'Manual',
  INVALIDA: 'Inválida',
};

const STATUS_COLORS: Record<ImagemStatus, string> = {
  PENDENTE: 'bg-amber-100 text-amber-800',
  AUTOMATICA: 'bg-emerald-100 text-emerald-800',
  MANUAL: 'bg-blue-100 text-blue-800',
  INVALIDA: 'bg-red-100 text-red-800',
};

type AppRole = 'ADMIN' | 'GESTOR' | 'CLIENTE';

function parseRole(role?: string): AppRole {
  if (role === 'ADMIN' || role === 'GESTOR' || role === 'CLIENTE') return role;
  return 'CLIENTE';
}

export default function ProdutosImagensPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const toast = useToast();

  const [items, setItems] = useState<ProdutoImagemRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busca, setBusca] = useState('');
  const [statusFilter, setStatusFilter] = useState<ImagemStatus | ''>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [actionId, setActionId] = useState<string | null>(null);

  const loadItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (busca) params.set('busca', busca);
      if (statusFilter) params.set('status', statusFilter);

      const res = await fetch(`/api/admin/produtos/imagens?${params}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Erro ao carregar');

      setItems(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro ao carregar imagens');
    } finally {
      setLoading(false);
    }
  }, [busca, statusFilter, page, toast]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const runAction = async (
    produtoId: string,
    action: 'reprocessar' | 'restaurar' | 'remover' | 'upload',
    file?: File
  ) => {
    setActionId(produtoId);
    try {
      let res: Response;
      if (action === 'upload' && file) {
        const fd = new FormData();
        fd.append('file', file);
        res = await fetch(`/api/admin/produtos/${produtoId}/imagem`, {
          method: 'POST',
          body: fd,
          credentials: 'include',
        });
      } else if (action === 'remover') {
        res = await fetch(`/api/admin/produtos/${produtoId}/imagem`, {
          method: 'DELETE',
          credentials: 'include',
        });
      } else {
        res = await fetch(`/api/admin/produtos/${produtoId}/imagem/${action}`, {
          method: 'POST',
          credentials: 'include',
        });
      }

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Ação falhou');

      toast.success('Imagem atualizada com sucesso');
      await loadItems();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erro na ação');
    } finally {
      setActionId(null);
    }
  };

  if (session?.user) {
    const role = parseRole((session.user as { role?: string }).role);
    if (role !== 'ADMIN' && role !== 'GESTOR') {
      router.push(getDashboardUrl(role));
      return null;
    }
  }

  const layoutRole: AppRole = session?.user
    ? parseRole((session.user as { role?: string }).role)
    : 'ADMIN';

  return (
    <DashboardLayout role={layoutRole}>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Imagens de Produtos</h1>
          <p className="mt-1 text-sm text-gray-600">
            Gerencie imagens automáticas (Open Food Facts) e substituições manuais.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <input
            type="search"
            placeholder="Buscar por nome, EAN ou marca…"
            value={busca}
            onChange={(e) => {
              setBusca(e.target.value);
              setPage(1);
            }}
            className="flex-1 rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
          />
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value as ImagemStatus | '');
              setPage(1);
            }}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm"
          >
            <option value="">Todos os status</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-gray-500">Carregando…</p>
        ) : items.length === 0 ? (
          <p className="text-sm text-gray-500">Nenhum produto encontrado.</p>
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <Card key={item.produtoId} variant="default" className="p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                  <ProductImage
                    src={item.imagem}
                    thumbSrc={item.imagemThumb}
                    alt={item.nome}
                    size="md"
                    status={item.status}
                  />

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <div>
                        <h3 className="font-semibold text-gray-900 line-clamp-2">{item.nome}</h3>
                        <p className="text-xs text-gray-500">
                          {item.marca && `${item.marca} · `}
                          {item.codigoBarras ? `EAN ${item.codigoBarras}` : 'Sem EAN'}
                        </p>
                      </div>
                      <span
                        className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-semibold ${STATUS_COLORS[item.status]}`}
                      >
                        {STATUS_LABELS[item.status]}
                      </span>
                    </div>

                    <dl className="mt-2 grid grid-cols-1 gap-1 text-xs text-gray-600 sm:grid-cols-2">
                      <div>
                        <dt className="font-medium text-gray-500">Origem</dt>
                        <dd>
                          {item.status === 'MANUAL'
                            ? item.manualOrigem || 'upload manual'
                            : item.autoOrigem || '—'}
                        </dd>
                      </div>
                      <div>
                        <dt className="font-medium text-gray-500">Atualizado</dt>
                        <dd>{new Date(item.atualizadoEm).toLocaleString('pt-BR')}</dd>
                      </div>
                      {item.autoFonteUrl && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-gray-500">Fonte</dt>
                          <dd>
                            <a
                              href={item.autoFonteUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:underline truncate block"
                            >
                              {item.autoFonteUrl}
                            </a>
                          </dd>
                        </div>
                      )}
                      {item.ultimoErro && (
                        <div className="sm:col-span-2">
                          <dt className="font-medium text-red-500">Último erro</dt>
                          <dd className="text-red-600">{item.ultimoErro}</dd>
                        </div>
                      )}
                    </dl>

                    <div className="mt-3 flex flex-wrap gap-2">
                      <label
                        className={`inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border-2 border-gray-300 px-3 py-1.5 text-sm font-medium text-text-primary hover:bg-bg-hover ${
                          actionId === item.produtoId ? 'opacity-50 pointer-events-none' : ''
                        }`}
                      >
                        <Upload className="h-4 w-4" />
                        Substituir
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          className="sr-only"
                          disabled={actionId === item.produtoId}
                          onChange={(e) => {
                            const f = e.target.files?.[0];
                            if (f) void runAction(item.produtoId, 'upload', f);
                            e.target.value = '';
                          }}
                        />
                      </label>
                      {item.status === 'MANUAL' && (
                        <Button
                          variant="outline"
                          size="sm"
                          icon={RotateCcw}
                          disabled={actionId === item.produtoId}
                          onClick={() => runAction(item.produtoId, 'restaurar')}
                        >
                          Restaurar auto
                        </Button>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        icon={RefreshCw}
                        disabled={actionId === item.produtoId}
                        onClick={() => runAction(item.produtoId, 'reprocessar')}
                      >
                        Atualizar
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        icon={Trash2}
                        disabled={actionId === item.produtoId}
                        onClick={() => runAction(item.produtoId, 'remover')}
                      >
                        Remover
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-600">
              Página {page} de {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => p + 1)}
            >
              Próxima
            </Button>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
