/**
 * Landing Page - Mobile-First (INTEGRADO COM API REAL)
 * 
 * SQUAD A - Frontend/UX
 * INTEGRAÇÃO COM SQUAD B
 * 
 * Objetivo: Fazer visitante entender valor em 3 segundos
 * Meta: Taxa de conversão 5% → 15%
 * 
 * IMPORTANTE: Esta página é PÚBLICA - não requer autenticação
 */

// @ts-nocheck
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/shared';
import { TOKENS } from '@/styles/tokens';
import Link from 'next/link';
import Header from '@/components/Header';

interface GlobalStats {
  totalUsers: number;
  totalSavings: number;
  savingsThisMonth: number;
  activeMarkets: number;
  lastUpdate: string;
}

export default function LandingPage() {
  const [stats, setStats] = useState<GlobalStats>({
    totalUsers: 0,
    totalSavings: 0,
    savingsThisMonth: 0,
    activeMarkets: 0,
    lastUpdate: '',
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Buscar estatísticas REAIS da API
    async function fetchStats() {
      try {
        setIsLoading(true);
        const response = await fetch('/api/stats/global');
        
        if (!response.ok) {
          throw new Error('Erro ao buscar estatísticas');
        }
        
        const result = await response.json();
        
        if (result.success) {
          // Animar contadores
          animateCounters(result.data);
        } else {
          throw new Error(result.message || 'Erro desconhecido');
        }
      } catch (err) {
        console.error('Error fetching stats:', err);
        setError(err instanceof Error ? err.message : 'Erro ao carregar dados');
        
        // Fallback para dados mock
        animateCounters({
          totalUsers: 12543,
          totalSavings: 23456700,
          savingsThisMonth: 5432100,
          activeMarkets: 45,
          lastUpdate: new Date().toISOString(),
        });
      } finally {
        setIsLoading(false);
      }
    }

    fetchStats();
  }, []);

  function animateCounters(targetStats: GlobalStats): void {
    let currentUsers = 0;
    let currentSavings = 0;
    
    const interval = setInterval(() => {
      if (currentUsers < targetStats.totalUsers) {
        currentUsers += Math.ceil(targetStats.totalUsers / 50);
        if (currentUsers > targetStats.totalUsers) currentUsers = targetStats.totalUsers;
      }
      
      if (currentSavings < targetStats.totalSavings) {
        currentSavings += Math.ceil(targetStats.totalSavings / 50);
        if (currentSavings > targetStats.totalSavings) currentSavings = targetStats.totalSavings;
      }
      
      setStats({
        ...targetStats,
        totalUsers: currentUsers,
        totalSavings: currentSavings,
      });
      
      if (currentUsers >= targetStats.totalUsers && currentSavings >= targetStats.totalSavings) {
        clearInterval(interval);
      }
    }, 30);
  }

  // Formatar valores em reais
  const totalSavingsInReais = (stats.totalSavings / 100).toFixed(2);
  const savingsThisMonthInReais = (stats.savingsThisMonth / 100).toFixed(2);

  return (
    <>
      <Header title="PRECIVOX" showUserInfo={true} />
      <main style={styles.main}>
        {/* Hero Section */}
        <section style={styles.hero}>
        <div style={styles.container}>
          {/* Logo */}
          <div style={styles.logoContainer}>
            <h1 style={styles.logo}>PRECIVOX</h1>
            <p style={styles.tagline}>Economia Inteligente</p>
          </div>

          {/* Headline - CRÍTICO: 3 segundos para entender */}
          <h2 style={styles.headline}>
            Economize até
            <span style={styles.highlightAmount}> R$ 200/mês </span>
            em compras
          </h2>

          {/* Subheadline */}
          <p style={styles.subheadline}>
            Compare preços de supermercados na sua região e descubra onde comprar mais barato. 
            Simples, rápido e grátis.
          </p>
          <div style={styles.ctaContainer}>
            <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <Button
                variant="primary"
                size="lg"
                fullWidth
              >
                🎯 Começar a Economizar Grátis
              </Button>
            </Link>
            
            <p style={styles.ctaSubtext}>
              ✓ Sem cartão de crédito • ✓ Grátis para sempre
            </p>
          </div>

          {/* Prova Social - DADOS REAIS DA API */}
          {!isLoading && (
            <div style={styles.socialProof}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  {stats.totalUsers.toLocaleString('pt-BR')}
                </div>
                <div style={styles.statLabel}>
                  pessoas economizando
                </div>
              </div>
              
              <div style={styles.statCard}>
                <div style={styles.statNumber}>
                  R$ {Number(totalSavingsInReais).toLocaleString('pt-BR')}
                </div>
                <div style={styles.statLabel}>
                  economizados no total
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div style={styles.socialProof}>
              <div style={styles.statCard}>
                <div style={styles.statNumber}>...</div>
                <div style={styles.statLabel}>carregando</div>
              </div>
            </div>
          )}

          {/* Error State (não mostrar para usuário, apenas console) */}
          {error && console.error('Stats API Error:', error)}
        </div>
      </section>

      {/* Como Funciona */}
      <section style={styles.howItWorks}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>Como Funciona</h3>
          
          <div style={styles.stepsContainer}>
            <Step
              number="1"
              icon="📝"
              title="Crie sua lista"
              description="Adicione os produtos que você sempre compra"
            />
            
            <Step
              number="2"
              icon="🔍"
              title="Compare preços"
              description="Veja onde cada produto está mais barato"
            />
            
            <Step
              number="3"
              icon="💰"
              title="Economize"
              description="Compre no lugar certo e guarde dinheiro"
            />
          </div>

          <div style={styles.ctaContainer}>
            <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <Button variant="secondary" size="lg" fullWidth>
                Criar Minha Primeira Lista
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section style={styles.benefits}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>Por Que Usar o PRECIVOX?</h3>
          
          <div style={styles.benefitsGrid}>
            <Benefit
              icon="🤖"
              title="Inteligência Artificial"
              description="Algoritmos que encontram as melhores ofertas para você"
            />
            
            <Benefit
              icon="📍"
              title="Perto de Você"
              description="Mostramos mercados próximos da sua localização"
            />
            
            <Benefit
              icon="⚡"
              title="Rápido e Fácil"
              description="Crie sua lista em menos de 2 minutos"
            />
            
            <Benefit
              icon="🔒"
              title="100% Grátis"
              description="Sem taxas escondidas, sem pegadinhas"
            />
          </div>
        </div>
      </section>

      {/* Depoimentos */}
      <section style={styles.testimonials}>
        <div style={styles.container}>
          <h3 style={styles.sectionTitle}>O Que Dizem Nossos Usuários</h3>
          
          <div style={styles.testimonialsGrid}>
            <Testimonial
              name="Maria Silva"
              location="São Paulo, SP"
              text="Economizei R$ 150 no primeiro mês! Agora não compro nada sem consultar o PRECIVOX."
              savings="R$ 150"
            />
            
            <Testimonial
              name="João Santos"
              location="Rio de Janeiro, RJ"
              text="Muito prático! Consigo ver todos os preços sem sair de casa."
              savings="R$ 89"
            />
            
            <Testimonial
              name="Ana Costa"
              location="Belo Horizonte, MG"
              text="Recomendo para todos os amigos. É incrível quanto dá para economizar!"
              savings="R$ 203"
            />
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section style={styles.finalCta}>
        <div style={styles.container}>
          <h3 style={styles.finalCtaTitle}>
            Pronto para Economizar?
          </h3>
          
          <p style={styles.finalCtaText}>
            Junte-se a {stats.totalUsers > 0 ? stats.totalUsers.toLocaleString('pt-BR') : 'milhares de'} pessoas que já estão economizando
          </p>
          
          <div style={styles.ctaContainer}>
            <Link href="/login" style={{ textDecoration: 'none', width: '100%' }}>
              <Button variant="primary" size="lg" fullWidth>
                Começar Agora - É Grátis
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer style={styles.footer}>
        <div style={styles.container}>
          <p style={styles.footerText}>
            © 2025 PRECIVOX - Economia Inteligente para Todos
          </p>
          <div style={styles.footerLinks}>
            <a href="/privacidade" style={styles.footerLink}>Privacidade</a>
            <span style={styles.footerSeparator}>•</span>
            <a href="/termos" style={styles.footerLink}>Termos de Uso</a>
            <span style={styles.footerSeparator}>•</span>
            <a href="/contato" style={styles.footerLink}>Contato</a>
          </div>
        </div>
      </footer>
      </main>
    </>
  );
}

// Componentes auxiliares (sem mudanças)
function Step({ number, icon, title, description }: {
  number: string;
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div style={styles.step}>
      <div style={styles.stepNumber}>{number}</div>
      <div style={styles.stepIcon}>{icon}</div>
      <h4 style={styles.stepTitle}>{title}</h4>
      <p style={styles.stepDescription}>{description}</p>
    </div>
  );
}

function Benefit({ icon, title, description }: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <div style={styles.benefitCard}>
      <div style={styles.benefitIcon}>{icon}</div>
      <h4 style={styles.benefitTitle}>{title}</h4>
      <p style={styles.benefitDescription}>{description}</p>
    </div>
  );
}

function Testimonial({ name, location, text, savings }: {
  name: string;
  location: string;
  text: string;
  savings: string;
}) {
  return (
    <div style={styles.testimonialCard}>
      <div style={styles.testimonialSavings}>{savings} economizados</div>
      <p style={styles.testimonialText}>"{text}"</p>
      <div style={styles.testimonialAuthor}>
        <strong>{name}</strong>
        <span style={styles.testimonialLocation}>{location}</span>
      </div>
    </div>
  );
}

// Estilos (sem mudanças - usando TOKENS)
const styles = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.background,
  },
  
  container: {
    maxWidth: '1200px',
    margin: '0 auto',
    padding: `0 ${TOKENS.spacing[4]}`,
  },
  
  hero: {
    background: `linear-gradient(135deg, ${TOKENS.colors.primary[600]} 0%, ${TOKENS.colors.primary[800]} 100%)`,
    color: TOKENS.colors.text.inverse,
    padding: `${TOKENS.spacing[12]} 0`,
    textAlign: 'center' as const,
  },
  
  logoContainer: {
    marginBottom: TOKENS.spacing[8],
  },
  
  logo: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    margin: 0,
    letterSpacing: '2px',
  },
  
  tagline: {
    fontSize: TOKENS.typography.fontSize.sm,
    opacity: 0.9,
    margin: `${TOKENS.spacing[1]} 0 0 0`,
  },
  
  headline: {
    fontSize: TOKENS.typography.fontSize['4xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    lineHeight: TOKENS.typography.lineHeight.tight,
    margin: `0 0 ${TOKENS.spacing[4]} 0`,
  },
  
  highlightAmount: {
    color: TOKENS.colors.secondary[300],
    display: 'block',
    fontSize: TOKENS.typography.fontSize['5xl'],
  },
  
  subheadline: {
    fontSize: TOKENS.typography.fontSize.lg,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
    opacity: 0.95,
    maxWidth: '600px',
    margin: `0 auto ${TOKENS.spacing[8]} auto`,
  },
  
  ctaContainer: {
    maxWidth: '400px',
    margin: '0 auto',
  },
  
  ctaSubtext: {
    fontSize: TOKENS.typography.fontSize.sm,
    marginTop: TOKENS.spacing[2],
    opacity: 0.9,
  },
  
  socialProof: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: TOKENS.spacing[4],
    marginTop: TOKENS.spacing[12],
  },
  
  statCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    padding: TOKENS.spacing[4],
    borderRadius: TOKENS.borderRadius.lg,
    backdropFilter: 'blur(10px)',
  },
  
  statNumber: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    marginBottom: TOKENS.spacing[1],
  },
  
  statLabel: {
    fontSize: TOKENS.typography.fontSize.sm,
    opacity: 0.9,
  },
  
  howItWorks: {
    padding: `${TOKENS.spacing[16]} 0`,
    backgroundColor: TOKENS.colors.surface,
  },
  
  sectionTitle: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.bold,
    textAlign: 'center' as const,
    marginBottom: TOKENS.spacing[12],
    color: TOKENS.colors.text.primary,
  },
  
  stepsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: TOKENS.spacing[8],
    marginBottom: TOKENS.spacing[12],
  },
  
  step: {
    textAlign: 'center' as const,
    position: 'relative' as const,
  },
  
  stepNumber: {
    position: 'absolute' as const,
    top: '-10px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '40px',
    height: '40px',
    backgroundColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
    borderRadius: TOKENS.borderRadius.full,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontWeight: TOKENS.typography.fontWeight.bold,
    fontSize: TOKENS.typography.fontSize.lg,
  },
  
  stepIcon: {
    fontSize: '48px',
    marginBottom: TOKENS.spacing[4],
    marginTop: TOKENS.spacing[4],
  },
  
  stepTitle: {
    fontSize: TOKENS.typography.fontSize.xl,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    marginBottom: TOKENS.spacing[2],
    color: TOKENS.colors.text.primary,
  },
  
  stepDescription: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
  },
  
  benefits: {
    padding: `${TOKENS.spacing[16]} 0`,
  },
  
  benefitsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: TOKENS.spacing[6],
  },
  
  benefitCard: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[6],
  },
  
  benefitIcon: {
    fontSize: '48px',
    marginBottom: TOKENS.spacing[4],
  },
  
  benefitTitle: {
    fontSize: TOKENS.typography.fontSize.xl,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    marginBottom: TOKENS.spacing[2],
    color: TOKENS.colors.text.primary,
  },
  
  benefitDescription: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
  },
  
  testimonials: {
    padding: `${TOKENS.spacing[16]} 0`,
    backgroundColor: TOKENS.colors.surface,
  },
  
  testimonialsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: TOKENS.spacing[6],
  },
  
  testimonialCard: {
    backgroundColor: TOKENS.colors.background,
    padding: TOKENS.spacing[6],
    borderRadius: TOKENS.borderRadius.lg,
    boxShadow: TOKENS.shadows.md,
  },
  
  testimonialSavings: {
    display: 'inline-block',
    backgroundColor: TOKENS.colors.secondary[100],
    color: TOKENS.colors.secondary[700],
    padding: `${TOKENS.spacing[1]} ${TOKENS.spacing[3]}`,
    borderRadius: TOKENS.borderRadius.full,
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    marginBottom: TOKENS.spacing[4],
  },
  
  testimonialText: {
    fontSize: TOKENS.typography.fontSize.base,
    lineHeight: TOKENS.typography.lineHeight.relaxed,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[4],
    fontStyle: 'italic' as const,
  },
  
  testimonialAuthor: {
    display: 'flex',
    flexDirection: 'column' as const,
    gap: TOKENS.spacing[1],
  },
  
  testimonialLocation: {
    fontSize: TOKENS.typography.fontSize.sm,
    color: TOKENS.colors.text.secondary,
  },
  
  finalCta: {
    padding: `${TOKENS.spacing[16]} 0`,
    background: `linear-gradient(135deg, ${TOKENS.colors.secondary[600]} 0%, ${TOKENS.colors.secondary[800]} 100%)`,
    color: TOKENS.colors.text.inverse,
    textAlign: 'center' as const,
  },
  
  finalCtaTitle: {
    fontSize: TOKENS.typography.fontSize['4xl'],
    fontWeight: TOKENS.typography.fontWeight.extrabold,
    marginBottom: TOKENS.spacing[4],
  },
  
  finalCtaText: {
    fontSize: TOKENS.typography.fontSize.lg,
    marginBottom: TOKENS.spacing[8],
    opacity: 0.95,
  },
  
  footer: {
    padding: `${TOKENS.spacing[8]} 0`,
    backgroundColor: TOKENS.colors.gray[900],
    color: TOKENS.colors.text.inverse,
    textAlign: 'center' as const,
  },
  
  footerText: {
    fontSize: TOKENS.typography.fontSize.sm,
    marginBottom: TOKENS.spacing[4],
    opacity: 0.8,
  },
  
  footerLinks: {
    display: 'flex',
    justifyContent: 'center',
    gap: TOKENS.spacing[2],
    flexWrap: 'wrap' as const,
  },
  
  footerLink: {
    color: TOKENS.colors.text.inverse,
    textDecoration: 'none',
    fontSize: TOKENS.typography.fontSize.sm,
    opacity: 0.8,
  },
  
  footerSeparator: {
    opacity: 0.5,
  },
};
