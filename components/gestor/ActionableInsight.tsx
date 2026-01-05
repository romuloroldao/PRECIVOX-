/**
 * ActionableInsight Component
 * 
 * SQUAD B - Dashboard Gestor
 * 
 * Transforma métricas em ações acionáveis com impacto financeiro
 */

'use client';

import React from 'react';
import { Button, Card } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import { 
  AlertTriangle, 
  TrendingUp, 
  Package, 
  DollarSign,
  ShoppingCart,
  Tag,
  ArrowRight
} from 'lucide-react';

export interface ActionableInsightProps {
  /** Tipo de insight: URGENTE, OPORTUNIDADE, MELHORIA */
  type: 'URGENTE' | 'OPORTUNIDADE' | 'MELHORIA';
  
  /** Título do insight */
  title: string;
  
  /** Descrição do insight */
  description: string;
  
  /** Impacto financeiro estimado em centavos */
  impactValue: number;
  
  /** Tipo de impacto: positivo (ganho) ou negativo (perda) */
  impactType: 'positive' | 'negative';
  
  /** Ações disponíveis */
  actions: Array<{
    label: string;
    type: 'pedido' | 'promocao' | 'ajuste' | 'ver-detalhes';
    onClick: () => void;
  }>;
  
  /** Produtos relacionados (opcional) */
  products?: Array<{
    id: string;
    name: string;
    quantity?: number;
  }>;
  
  /** Prioridade (1-10) */
  priority?: number;
}

export function ActionableInsight({
  type,
  title,
  description,
  impactValue,
  impactType,
  actions,
  products,
  priority = 5,
}: ActionableInsightProps) {
  // Formatar valor em reais
  const formatCurrency = (cents: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(cents / 100);
  };

  // Cores e ícones por tipo
  const typeConfig = {
    URGENTE: {
      icon: AlertTriangle,
      bgColor: '#FEF2F2', // error-50 equivalente
      borderColor: '#FCA5A5', // error-200 equivalente
      iconColor: TOKENS.colors.error,
      textColor: '#991B1B', // error-800 equivalente
    },
    OPORTUNIDADE: {
      icon: TrendingUp,
      bgColor: TOKENS.colors.secondary[50],
      borderColor: TOKENS.colors.secondary[200],
      iconColor: TOKENS.colors.secondary[600],
      textColor: TOKENS.colors.secondary[900],
    },
    MELHORIA: {
      icon: Package,
      bgColor: TOKENS.colors.accent[50],
      borderColor: TOKENS.colors.accent[200],
      iconColor: TOKENS.colors.accent[600],
      textColor: TOKENS.colors.accent[900],
    },
  };

  const config = typeConfig[type];
  const Icon = config.icon;

  // Ícone da ação
  const getActionIcon = (actionType: string) => {
    switch (actionType) {
      case 'pedido':
        return ShoppingCart;
      case 'promocao':
        return Tag;
      case 'ajuste':
        return Package;
      default:
        return ArrowRight;
    }
  };

  return (
    <Card
      padding="lg"
      shadow="md"
      hoverable
      style={{
        backgroundColor: config.bgColor,
        border: `2px solid ${config.borderColor}`,
        borderRadius: TOKENS.borderRadius.lg,
      }}
    >
      <div style={{ display: 'flex', gap: TOKENS.spacing[4] }}>
        {/* Ícone */}
        <div
          style={{
            flexShrink: 0,
            width: 48,
            height: 48,
            borderRadius: TOKENS.borderRadius.full,
            backgroundColor: config.iconColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
          }}
        >
          <Icon size={24} />
        </div>

        {/* Conteúdo */}
        <div style={{ flex: 1 }}>
          {/* Header */}
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
              marginBottom: TOKENS.spacing[2],
            }}
          >
            <div>
              <div
                style={{
                  display: 'inline-block',
                  padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                  borderRadius: TOKENS.borderRadius.sm,
                  backgroundColor: config.iconColor,
                  color: '#FFFFFF',
                  fontSize: TOKENS.typography.fontSize.xs,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  textTransform: 'uppercase',
                  marginBottom: TOKENS.spacing[1],
                }}
              >
                {type}
              </div>
              <h3
                style={{
                  fontSize: TOKENS.typography.fontSize.lg,
                  fontWeight: TOKENS.typography.fontWeight.bold,
                  color: TOKENS.colors.text.primary,
                  margin: 0,
                }}
              >
                {title}
              </h3>
            </div>
          </div>

          {/* Descrição */}
          <p
            style={{
              fontSize: TOKENS.typography.fontSize.base,
              color: TOKENS.colors.text.secondary,
              marginBottom: TOKENS.spacing[4],
              lineHeight: 1.6,
            }}
          >
            {description}
          </p>

          {/* Impacto Financeiro */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: TOKENS.spacing[2],
              marginBottom: TOKENS.spacing[4],
              padding: TOKENS.spacing[3],
              borderRadius: TOKENS.borderRadius.md,
              backgroundColor: '#FFFFFF',
            }}
          >
            <DollarSign
              size={20}
              color={impactType === 'positive' ? TOKENS.colors.secondary[600] : TOKENS.colors.error}
            />
            <span
              style={{
                fontSize: TOKENS.typography.fontSize.sm,
                color: TOKENS.colors.text.secondary,
                fontWeight: TOKENS.typography.fontWeight.medium,
              }}
            >
              Impacto estimado:
            </span>
            <span
              style={{
                fontSize: TOKENS.typography.fontSize.xl,
                fontWeight: TOKENS.typography.fontWeight.bold,
                color: impactType === 'positive' ? TOKENS.colors.secondary[600] : TOKENS.colors.error,
              }}
            >
              {impactType === 'positive' ? '+' : '-'}
              {formatCurrency(Math.abs(impactValue))}
            </span>
          </div>

          {/* Produtos relacionados */}
          {products && products.length > 0 && (
            <div
              style={{
                marginBottom: TOKENS.spacing[4],
                padding: TOKENS.spacing[2],
                backgroundColor: '#FFFFFF',
                borderRadius: TOKENS.borderRadius.md,
              }}
            >
              <p
                style={{
                  fontSize: TOKENS.typography.fontSize.sm,
                  fontWeight: TOKENS.typography.fontWeight.semibold,
                  color: TOKENS.colors.text.secondary,
                  marginBottom: TOKENS.spacing[2],
                }}
              >
                Produtos afetados ({products.length}):
              </p>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: TOKENS.spacing[1] }}>
                {products.slice(0, 5).map((product) => (
                  <span
                    key={product.id}
                    style={{
                      padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                      borderRadius: TOKENS.borderRadius.sm,
                      backgroundColor: TOKENS.colors.gray[100],
                      fontSize: TOKENS.typography.fontSize.xs,
                      color: TOKENS.colors.text.secondary,
                    }}
                  >
                    {product.name}
                    {product.quantity && ` (${product.quantity})`}
                  </span>
                ))}
                {products.length > 5 && (
                  <span
                    style={{
                      padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[2]}`,
                      fontSize: TOKENS.typography.fontSize.xs,
                      color: TOKENS.colors.text.secondary,
                    }}
                  >
                    +{products.length - 5} mais
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Ações */}
          <div
            style={{
              display: 'flex',
              flexWrap: 'wrap',
              gap: TOKENS.spacing[2],
            }}
          >
            {actions.map((action, index) => {
              const ActionIcon = getActionIcon(action.type);
              const isPrimary = action.type === 'pedido' || action.type === 'promocao';

              return (
                <Button
                  key={index}
                  variant={isPrimary ? 'primary' : 'outline'}
                  size="md"
                  onClick={action.onClick}
                >
                  <ActionIcon size={16} style={{ marginRight: TOKENS.spacing[1] }} />
                  {action.label}
                </Button>
              );
            })}
          </div>
        </div>
      </div>
    </Card>
  );
}

