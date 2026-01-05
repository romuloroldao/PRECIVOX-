/**
 * Página de Listas - Gerenciamento Completo
 * 
 * SQUAD A - Frontend/UX
 * 
 * Grid de listas com filtros, busca e ações
 */

'use client';

import { useState, useEffect, useMemo } from 'react';
import { Button } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import { useRouter } from 'next/navigation';

type FilterType = 'all' | 'active' | 'archived';

interface List {
  id: string;
  name: string;
  itemsCount: number;
  totalSavings: number; // centavos
  updatedAt: string;
  archived: boolean;
}

export default function ListasPage() {
  const [lists, setLists] = useState<List[]>([]);
  const [filter, setFilter] = useState<FilterType>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  // TODO: Pegar userId real do NextAuth
  const userId = 'temp-user-id';

  useEffect(() => {
    async function fetchLists() {
      try {
        setIsLoading(true);
        const response = await fetch(`/api/lists?userId=${userId}`);
        const data = await response.json();
        
        if (data.success) {
          setLists(data.data.lists || []);
        }
      } catch (error) {
        console.error('Error fetching lists:', error);
        // Mock data para desenvolvimento
        setLists([
          {
            id: '1',
            name: 'Compras da Semana',
            itemsCount: 12,
            totalSavings: 4500,
            updatedAt: new Date().toISOString(),
            archived: false,
          },
          {
            id: '2',
            name: 'Churrasco',
            itemsCount: 8,
            totalSavings: 2300,
            updatedAt: new Date(Date.now() - 86400000).toISOString(),
            archived: false,
          },
          {
            id: '3',
            name: 'Festa de Aniversário',
            itemsCount: 15,
            totalSavings: 0,
            updatedAt: new Date(Date.now() - 172800000).toISOString(),
            archived: true,
          },
        ]);
      } finally {
        setIsLoading(false);
      }
    }

    fetchLists();
  }, [userId]);

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
    router.push('/cliente/listas/nova');
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

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        {/* Header */}
        <header style={styles.header}>
          <div>
            <h1 style={styles.title}>Minhas Listas</h1>
            <p style={styles.subtitle}>
              Gerencie suas listas de compras
            </p>
          </div>

          <Button
            variant="primary"
            size="md"
            onClick={handleCreateList}
            leftIcon={<span>➕</span>}
          >
            Nova Lista
          </Button>
        </header>

        {/* Filters */}
        <div style={styles.filters}>
          <button
            onClick={() => setFilter('all')}
            style={{
              ...styles.filterButton,
              ...(filter === 'all' ? styles.filterButtonActive : {}),
            }}
          >
            Todas ({counts.all})
          </button>
          <button
            onClick={() => setFilter('active')}
            style={{
              ...styles.filterButton,
              ...(filter === 'active' ? styles.filterButtonActive : {}),
            }}
          >
            Ativas ({counts.active})
          </button>
          <button
            onClick={() => setFilter('archived')}
            style={{
              ...styles.filterButton,
              ...(filter === 'archived' ? styles.filterButtonActive : {}),
            }}
          >
            Arquivadas ({counts.archived})
          </button>
        </div>

        {/* Search */}
        <div style={styles.searchContainer}>
          <span style={styles.searchIcon}>🔍</span>
          <input
            type="text"
            placeholder="Buscar lista..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={styles.searchInput}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              style={styles.clearButton}
            >
              ✕
            </button>
          )}
        </div>

        {/* Grid */}
        {isLoading ? (
          <div style={styles.loading}>Carregando listas...</div>
        ) : filteredLists.length > 0 ? (
          <div style={styles.grid}>
            {filteredLists.map((list) => (
              <ListCard
                key={list.id}
                list={list}
                onDuplicate={() => handleDuplicate(list)}
                onArchive={() => handleArchive(list)}
                onDelete={() => handleDelete(list)}
              />
            ))}
          </div>
        ) : (
          <div style={styles.empty}>
            <span style={styles.emptyIcon}>📝</span>
            <p style={styles.emptyText}>
              {searchQuery
                ? 'Nenhuma lista encontrada'
                : filter === 'archived'
                ? 'Nenhuma lista arquivada'
                : 'Você ainda não tem listas'}
            </p>
            {!searchQuery && filter === 'all' && (
              <Button variant="primary" onClick={handleCreateList}>
                Criar Primeira Lista
              </Button>
            )}
          </div>
        )}
      </div>
    </main>
  );
}

// Componente ListCard
function ListCard({
  list,
  onDuplicate,
  onArchive,
  onDelete,
}: {
  list: List;
  onDuplicate: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const router = useRouter();

  const savingsInReais = (list.totalSavings / 100).toFixed(2);
  const date = new Date(list.updatedAt);
  const formattedDate = date.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const handleCardClick = () => {
    router.push(`/cliente/listas/${list.id}`);
  };

  return (
    <div style={styles.card} onClick={handleCardClick}>
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
