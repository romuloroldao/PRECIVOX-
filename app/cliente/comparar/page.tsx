/**
 * Página de Comparação - Comparar Preços
 * 
 * SQUAD A - Frontend/UX
 * 
 * Tabela de comparação de preços entre mercados
 */

'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import DashboardLayout from '@/components/DashboardLayout';
import { ClientePage } from '@/components/cliente/ClientePage';
import { EmptyState } from '@/components/ui';

interface Product {
  id: string;
  name: string;
  prices: {
    marketId: string;
    marketName: string;
    price: number; // centavos
    distance: number; // km
    inStock: boolean;
  }[];
  bestDeal: {
    marketId: string;
    price: number;
    savings: number;
  };
}

interface ComparisonData {
  products: Product[];
  totalSavings: number;
}

export default function ComparacaoPage() {
  const [data, setData] = useState<ComparisonData | null>(null);
  const [selectedMarkets, setSelectedMarkets] = useState<string[]>([]);
  const [maxDistance, setMaxDistance] = useState<number>(10); // km
  const [isLoading, setIsLoading] = useState(true);

  // Mock data para desenvolvimento
  useEffect(() => {
    async function fetchComparison() {
      try {
        setIsLoading(true);
        
        // TODO: Buscar da API real
        // const response = await fetch('/api/compare', {
        //   method: 'POST',
        //   body: JSON.stringify({ productIds: [...], location: {...} })
        // });
        
        // Mock data
        const mockData: ComparisonData = {
          products: [
            {
              id: '1',
              name: 'Arroz Tipo 1 5kg',
              prices: [
                { marketId: 'm1', marketName: 'Mercado A', price: 2200, distance: 0.8, inStock: true },
                { marketId: 'm2', marketName: 'Mercado B', price: 2590, distance: 1.5, inStock: true },
                { marketId: 'm3', marketName: 'Mercado C', price: 2450, distance: 3.2, inStock: false },
              ],
              bestDeal: { marketId: 'm1', price: 2200, savings: 390 },
            },
            {
              id: '2',
              name: 'Feijão Preto 1kg',
              prices: [
                { marketId: 'm1', marketName: 'Mercado A', price: 890, distance: 0.8, inStock: true },
                { marketId: 'm2', marketName: 'Mercado B', price: 850, distance: 1.5, inStock: true },
                { marketId: 'm3', marketName: 'Mercado C', price: 920, distance: 3.2, inStock: true },
              ],
              bestDeal: { marketId: 'm2', price: 850, savings: 70 },
            },
          ],
          totalSavings: 460,
        };
        
        setData(mockData);
        
        // Inicializar mercados selecionados (todos)
        const allMarkets = Array.from(
          new Set(mockData.products.flatMap((p) => p.prices.map((pr) => pr.marketId)))
        );
        setSelectedMarkets(allMarkets);
      } catch (error) {
        console.error('Error fetching comparison:', error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchComparison();
  }, []);

  const allMarkets = data
    ? Array.from(new Set(data.products.flatMap((p) => p.prices.map((pr) => pr.marketId))))
    : [];

  const filteredProducts = data?.products.map((product) => ({
    ...product,
    prices: product.prices.filter(
      (price) =>
        selectedMarkets.includes(price.marketId) &&
        price.distance <= maxDistance
    ),
  }));

  const handleToggleMarket = (marketId: string) => {
    setSelectedMarkets((prev) =>
      prev.includes(marketId)
        ? prev.filter((id) => id !== marketId)
        : [...prev, marketId]
    );
  };

  const handleBuyHere = (product: Product) => {
    const bestPrice = product.prices.find(
      (p) => p.marketId === product.bestDeal.marketId
    );
    if (bestPrice) {
      // Abrir Google Maps com rota
      const url = `https://www.google.com/maps/search/${encodeURIComponent(
        bestPrice.marketName
      )}`;
      window.open(url, '_blank');
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout role="CLIENTE">
        <ClientePage title="Comparar preços" description="Compare preços e encontre as melhores ofertas">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 animate-pulse rounded-xl bg-slate-200/70" />
            ))}
          </div>
        </ClientePage>
      </DashboardLayout>
    );
  }

  if (!data || data.products.length === 0) {
    return (
      <DashboardLayout role="CLIENTE">
        <ClientePage title="Comparar preços" description="Compare preços e encontre as melhores ofertas">
          <EmptyState
            title="Nenhum produto para comparar"
            message="Adicione produtos à sua lista para comparar preços entre mercados."
          />
        </ClientePage>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Comparar preços"
        description="Compare preços e encontre as melhores ofertas"
        actions={
          <div style={styles.savingsCard}>
            <span style={styles.savingsLabel}>Economia total</span>
            <span style={styles.savingsValue}>
              R$ {(data.totalSavings / 100).toFixed(2)}
            </span>
          </div>
        }
      >
        {/* Filters */}
        <div style={styles.filters}>
          {/* Markets Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>Mercados:</label>
            <div style={styles.checkboxGroup}>
              {allMarkets.map((marketId) => {
                const market = data.products[0].prices.find(
                  (p) => p.marketId === marketId
                );
                return (
                  <label key={marketId} style={styles.checkbox}>
                    <input
                      type="checkbox"
                      checked={selectedMarkets.includes(marketId)}
                      onChange={() => handleToggleMarket(marketId)}
                    />
                    <span>{market?.marketName}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Distance Filter */}
          <div style={styles.filterGroup}>
            <label style={styles.filterLabel}>
              Distância máxima: {maxDistance}km
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={maxDistance}
              onChange={(e) => setMaxDistance(Number(e.target.value))}
              style={styles.slider}
            />
          </div>
        </div>

        {/* Comparison Table */}
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Produto</th>
                {selectedMarkets.map((marketId) => {
                  const market = data.products[0].prices.find(
                    (p) => p.marketId === marketId
                  );
                  return (
                    <th key={marketId} style={styles.th}>
                      {market?.marketName}
                      <br />
                      <span style={styles.distance}>
                        {market?.distance.toFixed(1)}km
                      </span>
                    </th>
                  );
                })}
                <th style={styles.th}>Melhor Oferta</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts?.map((product) => (
                <tr key={product.id}>
                  <td style={styles.td}>
                    <strong>{product.name}</strong>
                  </td>
                  {selectedMarkets.map((marketId) => {
                    const price = product.prices.find(
                      (p) => p.marketId === marketId
                    );
                    const isBest = price?.marketId === product.bestDeal.marketId;

                    return (
                      <td
                        key={marketId}
                        style={{
                          ...styles.td,
                          ...(isBest ? styles.bestPrice : {}),
                        }}
                      >
                        {price ? (
                          <>
                            <span style={styles.price}>
                              R$ {(price.price / 100).toFixed(2)}
                            </span>
                            {!price.inStock && (
                              <span style={styles.outOfStock}>
                                Sem estoque
                              </span>
                            )}
                          </>
                        ) : (
                          <span style={styles.noData}>-</span>
                        )}
                      </td>
                    );
                  })}
                  <td style={styles.td}>
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={() => handleBuyHere(product)}
                    >
                      🛒 Comprar Aqui
                    </Button>
                    <div style={styles.savings}>
                      Economize R${' '}
                      {(product.bestDeal.savings / 100).toFixed(2)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Actions */}
        <div style={styles.actions}>
          <Button variant="secondary" size="md">
            📤 Compartilhar
          </Button>
          <Button variant="outline" size="md">
            📄 Exportar PDF
          </Button>
        </div>
      </ClientePage>
    </DashboardLayout>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.surface,
  },

  container: {
    maxWidth: '1400px',
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

  savingsCard: {
    display: 'flex',
    flexDirection: 'column' as const,
    alignItems: 'flex-end',
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.success + '20',
    borderRadius: TOKENS.borderRadius.lg,
    border: `${TOKENS.borderWidth[2]} solid ${TOKENS.colors.success}`,
  },

  savingsLabel: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.success,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    marginBottom: TOKENS.spacing[1],
  },

  savingsValue: {
    fontSize: TOKENS.typography.fontSize['2xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    color: TOKENS.colors.success,
  },

  filters: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[4],
    padding: TOKENS.spacing[4],
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.lg,
    marginBottom: TOKENS.spacing[6],
  },

  filterGroup: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[2],
  },

  filterLabel: {
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
  },

  checkboxGroup: {
    display: 'flex',
    gap: TOKENS.spacing[4],
    flexWrap: 'wrap' as const,
  },

  checkbox: {
    display: 'flex',
    alignItems: 'center',
    gap: TOKENS.spacing[2],
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.primary,
    cursor: 'pointer',
  },

  slider: {
    width: '100%',
    maxWidth: '400px',
  },

  tableContainer: {
    overflowX: 'auto' as const,
    marginBottom: TOKENS.spacing[6],
  },

  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
    backgroundColor: TOKENS.colors.background,
    borderRadius: TOKENS.borderRadius.lg,
    overflow: 'hidden' as const,
  },

  th: {
    padding: TOKENS.spacing[3],
    backgroundColor: TOKENS.colors.surface,
    borderBottom: `${TOKENS.borderWidth[2]} solid ${TOKENS.colors.border}`,
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    color: TOKENS.colors.text.primary,
    textAlign: 'left' as const,
  },

  td: {
    padding: TOKENS.spacing[3],
    borderBottom: `${TOKENS.borderWidth[1]} solid ${TOKENS.colors.border}`,
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.primary,
  },

  bestPrice: {
    backgroundColor: TOKENS.colors.success + '10',
    fontWeight: TOKENS.typography.fontWeight.bold,
  },

  price: {
    display: 'block',
    marginBottom: TOKENS.spacing[1],
  },

  outOfStock: {
    display: 'block',
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.error,
  },

  noData: {
    color: TOKENS.colors.text.secondary,
  },

  distance: {
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.text.secondary,
    fontWeight: TOKENS.typography.fontWeight.normal,
  },

  savings: {
    marginTop: TOKENS.spacing[2],
    fontSize: TOKENS.typography.fontSize.xs,
    color: TOKENS.colors.success,
    fontWeight: TOKENS.typography.fontWeight.semibold,
  },

  actions: {
    display: 'flex',
    gap: TOKENS.spacing[3],
    justifyContent: 'center',
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
  },
};
