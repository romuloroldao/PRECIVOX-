'use client';

import { useEffect, useState } from 'react';
import { Mail, Phone, Building2, MapPin, Calendar, MessageSquare } from 'lucide-react';

interface DemoRequest {
  id: string;
  ticketId: string;
  nome: string;
  email: string;
  empresa: string;
  cidade: string;
  telefone: string | null;
  interesse: string;
  porte: string | null;
  mensagem: string | null;
  status: string;
  notas: string | null;
  criadoEm: string;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

const STATUS_OPTIONS = [
  { value: 'novo', label: 'Novo', color: 'bg-blue-100 text-blue-800' },
  { value: 'contatado', label: 'Contatado', color: 'bg-yellow-100 text-yellow-800' },
  { value: 'agendado', label: 'Agendado', color: 'bg-purple-100 text-purple-800' },
  { value: 'concluido', label: 'Concluído', color: 'bg-green-100 text-green-800' },
  { value: 'descartado', label: 'Descartado', color: 'bg-gray-100 text-gray-600' },
];

const INTERESSE_LABELS: Record<string, string> = {
  mercado: 'Gestor de mercado',
  industria: 'Indústria / CPG',
  consumidor: 'Consumidor',
  outro: 'Outro',
};

function getStatusBadge(status: string) {
  const opt = STATUS_OPTIONS.find((s) => s.value === status);
  return opt || { value: status, label: status, color: 'bg-gray-100 text-gray-700' };
}

export default function DemoRequestsPage() {
  const [requests, setRequests] = useState<DemoRequest[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [page, setPage] = useState(1);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [filterStatus, page]);

  async function fetchData() {
    setLoading(true);
    try {
      const { authenticatedFetch } = await import('@/lib/auth-client');
      const params = new URLSearchParams({ page: String(page), limit: '20' });
      if (filterStatus) params.set('status', filterStatus);

      const res = await authenticatedFetch(`/api/admin/demo-requests?${params}`);
      if (res.ok) {
        const json = await res.json();
        setRequests(json.data || []);
        setPagination(json.pagination || null);
      }
    } catch (err) {
      console.error('Erro ao buscar solicitações:', err);
    } finally {
      setLoading(false);
    }
  }

  async function updateStatus(id: string, newStatus: string) {
    setUpdatingId(id);
    try {
      const { authenticatedFetch } = await import('@/lib/auth-client');
      const res = await authenticatedFetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus }),
      });
      if (res.ok) {
        setRequests((prev) =>
          prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r))
        );
      }
    } catch (err) {
      console.error('Erro ao atualizar:', err);
    } finally {
      setUpdatingId(null);
    }
  }

  async function updateNotas(id: string, notas: string) {
    try {
      const { authenticatedFetch } = await import('@/lib/auth-client');
      await authenticatedFetch('/api/admin/demo-requests', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, notas }),
      });
      setRequests((prev) =>
        prev.map((r) => (r.id === id ? { ...r, notas } : r))
      );
    } catch (err) {
      console.error('Erro ao salvar notas:', err);
    }
  }

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Solicitações de Demonstração</h1>
          <p className="mt-1 text-sm text-gray-500">
            {pagination ? `${pagination.total} solicitação(ões) no total` : 'Carregando...'}
          </p>
        </div>

        <select
          value={filterStatus}
          onChange={(e) => { setFilterStatus(e.target.value); setPage(1); }}
          className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
        >
          <option value="">Todos os status</option>
          {STATUS_OPTIONS.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <span className="ml-3 text-sm text-gray-500">Carregando...</span>
        </div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 bg-white p-12 text-center">
          <span className="mb-3 block text-4xl">📭</span>
          <p className="text-base font-medium text-gray-700">Nenhuma solicitação encontrada</p>
          <p className="mt-1 text-sm text-gray-500">
            {filterStatus ? 'Tente outro filtro de status.' : 'As solicitações aparecerão aqui quando forem recebidas.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((req) => {
            const badge = getStatusBadge(req.status);
            const isExpanded = expandedId === req.id;

            return (
              <div
                key={req.id}
                className="rounded-xl border border-gray-200 bg-white shadow-sm transition-shadow hover:shadow-md"
              >
                <button
                  type="button"
                  onClick={() => setExpandedId(isExpanded ? null : req.id)}
                  className="flex w-full items-center gap-4 px-5 py-4 text-left"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="truncate text-sm font-semibold text-gray-900">
                        {req.nome}
                      </span>
                      <span className={`shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${badge.color}`}>
                        {badge.label}
                      </span>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Building2 className="h-3.5 w-3.5" /> {req.empresa}
                      </span>
                      <span className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5" /> {req.cidade}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3.5 w-3.5" /> {formatDate(req.criadoEm)}
                      </span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs font-mono text-gray-400">{req.ticketId}</span>
                </button>

                {isExpanded && (
                  <div className="border-t border-gray-100 px-5 py-4">
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="space-y-2 text-sm">
                        <p className="flex items-center gap-2 text-gray-700">
                          <Mail className="h-4 w-4 text-gray-400" />
                          <a href={`mailto:${req.email}`} className="text-primary-600 hover:underline">
                            {req.email}
                          </a>
                        </p>
                        {req.telefone && (
                          <p className="flex items-center gap-2 text-gray-700">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <a href={`tel:${req.telefone}`} className="text-primary-600 hover:underline">
                              {req.telefone}
                            </a>
                          </p>
                        )}
                        <p className="text-gray-600">
                          <span className="font-medium">Interesse:</span>{' '}
                          {INTERESSE_LABELS[req.interesse] || req.interesse}
                        </p>
                        {req.porte && (
                          <p className="text-gray-600">
                            <span className="font-medium">Porte:</span> {req.porte}
                          </p>
                        )}
                      </div>

                      <div className="space-y-3">
                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">Status</label>
                          <select
                            value={req.status}
                            onChange={(e) => updateStatus(req.id, e.target.value)}
                            disabled={updatingId === req.id}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500 disabled:opacity-50"
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="mb-1 block text-xs font-medium text-gray-500">Notas internas</label>
                          <textarea
                            defaultValue={req.notas || ''}
                            onBlur={(e) => {
                              if (e.target.value !== (req.notas || '')) {
                                updateNotas(req.id, e.target.value);
                              }
                            }}
                            rows={2}
                            placeholder="Anotações sobre o contato..."
                            className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
                          />
                        </div>
                      </div>
                    </div>

                    {req.mensagem && (
                      <div className="mt-3 rounded-lg bg-gray-50 p-3">
                        <p className="mb-1 flex items-center gap-1 text-xs font-medium text-gray-500">
                          <MessageSquare className="h-3.5 w-3.5" /> Mensagem do solicitante
                        </p>
                        <p className="text-sm text-gray-700 whitespace-pre-wrap">{req.mensagem}</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Paginação */}
      {pagination && pagination.totalPages > 1 && (
        <div className="mt-6 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Anterior
          </button>
          <span className="text-sm text-gray-500">
            Página {page} de {pagination.totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
            disabled={page >= pagination.totalPages}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-40"
          >
            Próxima
          </button>
        </div>
      )}
    </div>
  );
}
