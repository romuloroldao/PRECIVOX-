/**
 * Página de Listas - Gerenciamento Completo
 * 
 * SQUAD A - Frontend/UX
 * 
 * Grid de listas com filtros, busca e ações
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { TOKENS } from '@/styles/tokens';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { Plus, Search, X } from 'lucide-react';
import DashboardLayout from '@/components/DashboardLayout';
import { ClientePage } from '@/components/cliente/ClientePage';
import { Button, EmptyState, Chip } from '@/components/ui';
import { useLista } from '@/app/context/ListaContext';
import {
  isListaLocal,
  listasSalvasToSummaries,
  mergeListSummaries,
  type ListSummary,
} from '@/lib/listas-merge';
import { useToast } from '@/components/ToastContainer';

type FilterType = 'all' | 'active' | 'archived';

type List = ListSummary;

export default function ListasPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const { data: session, status } = useSession();
  const { success, error } = useToast();
  const userId = (session?.user as any)?.id ?? null;
  const { listasSalvas, selecionarLista } = useLista();

  const localLists = useMemo(
    () => listasSalvasToSummaries(listasSalvas),
    [listasSalvas]
  );

  useEffect(() => {
    if (status === 'loading') return;
    async function fetchLists() {
      try {
        setIsLoading(true);

        if (!userId) {
          setLists(localLists);
          return;
        }

        const response = await fetch(`/api/lists?userId=${userId}`);
        const data = await response.json();
        const apiLists: List[] = data.success ? data.data.lists || [] : [];
        setLists(mergeListSummaries(apiLists, localLists));
      } catch (error) {
        console.error('Error fetching lists:', error);
        setLists(localLists);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLists();
  }, [userId, status, localLists]);

  const handleOpenList = (list: List) => {
    if (isListaLocal(list.id)) {
      selecionarLista(list.id);
      router.push('/cliente/busca');
      return;
    }
    router.push(`/cliente/listas/${list.id}`);
  };

  // Filtrar e buscar
  const filteredLists = useMemo(() => {
    let result = lists;

    // Filtro por status
    if (filter === 'active') {
      result = result.filter((list) => !list.archived);
    } else if (filter === 'archived') {
      result = result.filter((list) => list.archived);
    }

    // Busca
    if (searchQuery) {
      result = result.filter((list) =>
        list.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    return result;
  }, [lists, filter, searchQuery]);

  const counts = {
    all: lists.length,
    active: lists.filter((l) => !l.archived).length,
    archived: lists.filter((l) => l.archived).length,
  };

  const handleCreateList = () => {
    router.push('/cliente/busca');
  };

  const handleDuplicate = (list: List) => {
    // TODO: Implementar duplicação
    console.log('Duplicar lista:', list.id);
  };

  const handleArchive = (list: List) => {
    // TODO: Implementar arquivamento
    setLists((prev) =>
      prev.map((l) => (l.id === list.id ? { ...l, archived: !l.archived } : l))
    );
  };

  const handleDelete = (list: List) => {
    if (confirm(`Tem certeza que deseja deletar "${list.name}"?`)) {
      // TODO: Chamar API de delete
      setLists((prev) => prev.filter((l) => l.id !== list.id));
    }
  };

  const handleSendSummary = async (list: List) => {
    if (isListaLocal(list.id)) {
      error('Salve a lista na sua conta para enviar o resumo por e-mail.');
      return;
    }
    try {
      const res = await fetch(`/api/lists/${list.id}/send-summary`, {
        method: 'POST',
        credentials: 'include',
      });
      const data = await res.json();
      if (res.ok && data.success) {
        success(data.message || 'Resumo enviado para o seu e-mail.');
      } else {
        error(data.error || 'Não foi possível enviar o resumo agora.');
      }
    } catch {
      error('Erro de conexão. Tente novamente.');
    }
  };

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Minhas listas"
        description="Gerencie suas listas de compras"
        actions={
          <Button variant="primary" size="sm" icon={Plus} onClick={handleCreateList}>
            Começar compra
          </Button>
        }
      >
        {/* Filtros */}
        <div className="mb-3 flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
          <Chip selected={filter === 'all'} count={counts.all} onClick={() => setFilter('all')}>
            Todas
          </Chip>
          <Chip selected={filter === 'active'} count={counts.active} onClick={() => setFilter('active')}>
            Ativas
          </Chip>
          <Chip selected={filter === 'archived'} count={counts.archived} onClick={() => setFilter('archived')}>
            Arquivadas
          </Chip>
        </div>

        {/* Busca */}
        <div className="relative mb-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Buscar lista…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-lg border border-slate-200 py-2.5 pl-10 pr-10 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100"
              aria-label="Limpar busca"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={styles.grid}>
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-slate-200/70" />
            ))}
          </div>
        ) : filteredLists.length > 0 ? (
          <div style={styles.grid}>
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                canSendSummary={!!userId && !isListaLocal(list.id)}
                onOpen={() => handleOpenList(list)}
                onDuplicate={() => handleDuplicate(list)}
                onArchive={() => handleArchive(list)}
                onDelete={() => handleDelete(list)}
                onSendSummary={() => handleSendSummary(list)}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title={
              searchQuery
                ? 'Nenhuma lista encontrada'
                : filter === 'archived'
                ? 'Nenhuma lista arquivada'
                : 'Você ainda não tem listas'
            }
            message={
              searchQuery
                ? 'Tente outro nome.'
                : 'Crie sua primeira lista adicionando produtos pela busca.'
            }
            action={
              !searchQuery && filter !== 'archived'
                ? { label: 'Buscar produtos', onClick: handleCreateList }
                : undefined
            }
          />
        )}
      </ClientePage>
    </DashboardLayout>
  );
}

// Componente ListCard
function ListCard({
  list,
  canSendSummary,
  onOpen,
  onDuplicate,
  onArchive,
  onDelete,
  onSendSummary,
}: {
  list: List;
  canSendSummary: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
  onSendSummary: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [sendingSummary, setSendingSummary] = useState(false);
  const router = useRouter();

  const savingsInReais = (list.totalSavings / 100).toFixed(2);
  const date = new Date(list.updatedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <div style={styles.card} onClick={onOpen}>
      {/* Header */}
      <div style={styles.cardHeader}>
        <h3 style={styles.cardTitle}>{list.name}</h3>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setShowMenu(!showMenu);
          }}
          style={styles.menuButton}
        >
          ⋮
        </button>

        {/* Menu Dropdown */}
        {showMenu && (
          <div
            style={styles.menu}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => {
                router.push(`/cliente/listas/${list.id}/editar`);
                setShowMenu(false);
              }}
              style={styles.menuItem}
            >
              ✏️ Editar
            </button>
            <button
              onClick={() => {
                onDuplicate();
                setShowMenu(false);
              }}
              style={styles.menuItem}
            >
              📋 Duplicar
            </button>
            {canSendSummary && (
              <button
                disabled={sendingSummary}
                onClick={async () => {
                  setSendingSummary(true);
                  try {
                    await onSendSummary();
                  } finally {
                    setSendingSummary(false);
                    setShowMenu(false);
                  }
                }}
                style={{
                  ...styles.menuItem,
                  opacity: sendingSummary ? 0.6 : 1,
                }}
              >
                {sendingSummary ? '⏳ Enviando...' : '📧 Enviar resumo por e-mail'}
              </button>
            )}
            <button
              onClick={() => {
                onArchive();
                setShowMenu(false);
              }}
              style={styles.menuItem}
            >
              {list.archived ? '📂 Desarquivar' : '📁 Arquivar'}
            </button>
            <button
              onClick={() => {
                onDelete();
                setShowMenu(false);
              }}
              style={{ ...styles.menuItem, color: TOKENS.colors.error }}
            >
              🗑️ Deletar
            </button>
          </div>
        )}
      </div>

      {/* Date */}
      <p style={styles.cardDate}>{formattedDate}</p>

      {/* Stats */}
      <div style={styles.cardStats}>
        <div style={styles.stat}>
          <span style={styles.statIcon}>📦</span>
          <span style={styles.statValue}>{list.itemsCount} itens</span>
        </div>

        <div
          style={{
            ...styles.savingsBadge,
            backgroundColor:
              list.totalSavings > 0
                ? TOKENS.colors.success + '20'
                : TOKENS.colors.gray[100],
            color:
              list.totalSavings > 0
                ? TOKENS.colors.success
                : TOKENS.colors.text.secondary,
          }}
        >
          <span style={styles.savingsIcon}>💰</span>
          <span style={styles.savingsValue}>
            R$ {Number(savingsInReais).toLocaleString('pt-BR')}
          </span>
        </div>
      </div>

      {/* Archived Badge */}
      {list.archived && (
        <div style={styles.archivedBadge}>Arquivada</div>
      )}
    </div>
  );
}

// Estilos
const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.surface,
  },

  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: TOKENS.spacing[4],
  },

  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TOKENS.spacing[6],
    flexWrap: 'wrap' as const,
    gap: TOKENS.spacing[4],
  },

  title: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    color: TOKENS.colors.text.primary,
    margin: 0,
    marginBottom: TOKENS.spacing[1],
  },

  subtitle: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },

  filters: {
    display: 'flex',
    gap: TOKENS.spacing[2],
    marginBottom: TOKENS.spacing[4],
    flexWrap: 'wrap' as const,
  },

  filterButton: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.full,
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.secondary,
    cursor: 'pointer',
    transition: TOKENS.transitions.base,
  },

  filterButtonActive: {
    backgroundColor: TOKENS.colors.primary[600],
    borderColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
  },

  searchContainer: {
    position: 'relative' as const,
    marginBottom: TOKENS.spacing[6],
  },

  searchIcon: {
    position: 'absolute' as const,
    left: TOKENS.spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    fontSize: '18px',
    pointerEvents: 'none' as const,
  },

  searchInput: {
    width: '100%',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[3]} ${TOKENS.spacing[3]} ${TOKENS.spacing[10]}`,
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.lg,
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.primary,
    outline: 'none',
  },

  clearButton: {
    position: 'absolute' as const,
    right: TOKENS.spacing[3],
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    fontSize: TOKENS.typography.fontSize.lg,
    color: TOKENS.colors.text.secondary,
    cursor: 'pointer',
    padding: TOKENS.spacing[1],
  },

  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: TOKENS.spacing[4],
  },

  card: {
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.lg,
    padding: TOKENS.spacing[4],
    cursor: 'pointer',
    transition: TOKENS.transitions.base,
    position: 'relative' as const,
    ':hover': {
      boxShadow: TOKENS.shadows.md,
      transform: 'translateY(-2px)',
    },
  },

  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: TOKENS.spacing[2],
    position: 'relative' as const,
  },

  cardTitle: {
    fontSize: TOKENS.typography.fontSize.lg,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    margin: 0,
    flex: 1,
  },

  menuButton: {
    background: 'none',
    border: 'none',
    fontSize: '20px',
    color: TOKENS.colors.text.secondary,
    cursor: 'pointer',
    padding: TOKENS.spacing[1],
    lineHeight: 1,
  },

  menu: {
    position: 'absolute' as const,
    top: '100%',
    right: 0,
    backgroundColor: TOKENS.colors.background,
    border: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.md,
    boxShadow: TOKENS.shadows.lg,
    zIndex: TOKENS.zIndex.dropdown,
    minWidth: '150px',
    marginTop: TOKENS.spacing[1],
  },

  menuItem: {
    width: '100%',
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[3]}`,
    backgroundColor: 'transparent',
    border: 'none',
    textAlign: 'left' as const,
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.primary,
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    transition: TOKENS.transitions.base,
    ':hover': {
      backgroundColor: TOKENS.colors.surface,
    },
  },

  cardDate: {
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.text.secondary,
    margin: `0 0 ${TOKENS.spacing[3]} 0`,
  },

  cardStats: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: TOKENS.spacing[3],
  },

  stat: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[1],
  },

  statIcon: {
    fontSize: '16px',
  },

  statValue: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
  },

  savingsBadge: {
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    borderRadius: TOKENS.borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[1],
  },

  savingsIcon: {
    fontSize: '14px',
  },

  savingsValue: {
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  archivedBadge: {
    position: 'absolute' as const,
    top: TOKENS.spacing[2],
    right: TOKENS.spacing[2],
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
    backgroundColor: TOKENS.colors.gray[200],
    color: TOKENS.colors.text.secondary,
    fontSize: TOKENS.typography.fontSize.xs,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    borderRadius: TOKENS.borderRadius.full,
  },

  loading: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[12],
    color: TOKENS.colors.text.secondary,
  },

  empty: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[12],
  },

  emptyIcon: {
    fontSize: '64px',
    display: 'block',
    marginBottom: TOKENS.spacing[4],
    opacity: 0.5,
  },

  emptyText: {
    fontSize: TOKENS.typography.fontSize.lg,
    color: TOKENS.colors.text.secondary,
    marginBottom: TOKENS.spacing[6],
  },
};
