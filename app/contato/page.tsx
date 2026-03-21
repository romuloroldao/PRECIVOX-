'use client';

import React from 'react';
import Link from 'next/link';
import { TOKENS } from '@/styles/tokens';
import Logo from '@/components/Logo';

export default function ContatoPage() {
  return (
    <>
      <header style={headerStyle}>
        <div style={containerStyle}>
          <Logo height={36} variant="white" />
        </div>
      </header>

      <main style={mainStyle}>
        <div style={contentStyle}>
          <h1 style={titleStyle}>Fale Conosco</h1>
          <p style={subtitleStyle}>
            Estamos aqui para ajudar. Entre em contato com nossa equipe.
          </p>

          <div style={cardsGrid}>
            <div style={cardStyle}>
              <h3 style={cardTitle}>Suporte ao Usuário</h3>
              <p style={cardText}>
                Dúvidas sobre o funcionamento da plataforma, problemas técnicos ou sugestões.
              </p>
              <a href="mailto:suporte@precivox.com.br" style={linkStyle}>
                suporte@precivox.com.br
              </a>
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Privacidade e Dados</h3>
              <p style={cardText}>
                Solicitações relacionadas aos seus dados pessoais, conforme seus direitos previstos na LGPD.
              </p>
              <a href="mailto:privacidade@precivox.com.br" style={linkStyle}>
                privacidade@precivox.com.br
              </a>
            </div>

            <div style={cardStyle}>
              <h3 style={cardTitle}>Parcerias Comerciais</h3>
              <p style={cardText}>
                Supermercados e estabelecimentos que desejam integrar seus dados na plataforma.
              </p>
              <a href="mailto:comercial@precivox.com.br" style={linkStyle}>
                comercial@precivox.com.br
              </a>
            </div>
          </div>

          <div style={aboutSection}>
            <h2 style={aboutTitle}>Sobre o PRECIVOX</h2>
            <p style={aboutText}>
              O PRECIVOX é uma plataforma de comparação inteligente de preços de supermercados.
              Nossa missão é ajudar consumidores brasileiros a economizar nas compras do dia a dia,
              comparando preços de produtos em estabelecimentos da sua região em tempo real.
            </p>
            <p style={aboutText}>
              Utilizamos inteligência artificial para gerar recomendações personalizadas, alertas
              de ofertas e listas de compras otimizadas. Nosso compromisso é oferecer um serviço
              transparente, seguro e acessível para todos.
            </p>
          </div>

          <div style={linksSection}>
            <Link href="/privacidade" style={footerLinkStyle}>Política de Privacidade</Link>
            <span style={{ opacity: 0.4 }}>•</span>
            <Link href="/termos" style={footerLinkStyle}>Termos de Serviço</Link>
            <span style={{ opacity: 0.4 }}>•</span>
            <Link href="/" style={footerLinkStyle}>Página Inicial</Link>
          </div>
        </div>
      </main>
    </>
  );
}

const headerStyle: React.CSSProperties = {
  background: `linear-gradient(135deg, ${TOKENS.colors.primary[600]} 0%, ${TOKENS.colors.primary[800]} 100%)`,
  padding: `${TOKENS.spacing[4]} 0`,
};

const containerStyle: React.CSSProperties = {
  maxWidth: '1200px',
  margin: '0 auto',
  padding: `0 ${TOKENS.spacing[4]}`,
};

const mainStyle: React.CSSProperties = {
  minHeight: '100vh',
  backgroundColor: TOKENS.colors.background,
  padding: `${TOKENS.spacing[12]} 0`,
};

const contentStyle: React.CSSProperties = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: `0 ${TOKENS.spacing[4]}`,
};

const titleStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize['3xl'],
  fontWeight: TOKENS.typography.fontWeight.extrabold,
  color: TOKENS.colors.text.primary,
  marginBottom: TOKENS.spacing[2],
};

const subtitleStyle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.lg,
  color: TOKENS.colors.text.secondary,
  marginBottom: TOKENS.spacing[10],
  lineHeight: TOKENS.typography.lineHeight.relaxed,
};

const cardsGrid: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
  gap: TOKENS.spacing[6],
  marginBottom: TOKENS.spacing[12],
};

const cardStyle: React.CSSProperties = {
  backgroundColor: TOKENS.colors.surface,
  padding: TOKENS.spacing[6],
  borderRadius: TOKENS.borderRadius.lg,
  boxShadow: TOKENS.shadows.sm,
  border: `1px solid ${TOKENS.colors.gray[200]}`,
};

const cardTitle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.lg,
  fontWeight: TOKENS.typography.fontWeight.semibold,
  color: TOKENS.colors.text.primary,
  marginBottom: TOKENS.spacing[2],
};

const cardText: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.sm,
  color: TOKENS.colors.text.secondary,
  lineHeight: TOKENS.typography.lineHeight.relaxed,
  marginBottom: TOKENS.spacing[4],
};

const linkStyle: React.CSSProperties = {
  color: TOKENS.colors.primary[600],
  fontWeight: TOKENS.typography.fontWeight.semibold,
  fontSize: TOKENS.typography.fontSize.sm,
  textDecoration: 'none',
};

const aboutSection: React.CSSProperties = {
  backgroundColor: TOKENS.colors.surface,
  padding: TOKENS.spacing[8],
  borderRadius: TOKENS.borderRadius.lg,
  marginBottom: TOKENS.spacing[10],
  border: `1px solid ${TOKENS.colors.gray[200]}`,
};

const aboutTitle: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.xl,
  fontWeight: TOKENS.typography.fontWeight.bold,
  color: TOKENS.colors.text.primary,
  marginBottom: TOKENS.spacing[4],
};

const aboutText: React.CSSProperties = {
  fontSize: TOKENS.typography.fontSize.base,
  color: TOKENS.colors.text.secondary,
  lineHeight: TOKENS.typography.lineHeight.relaxed,
  marginBottom: TOKENS.spacing[3],
};

const linksSection: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'center',
  gap: TOKENS.spacing[3],
  flexWrap: 'wrap',
  paddingTop: TOKENS.spacing[6],
  borderTop: `1px solid ${TOKENS.colors.gray[200]}`,
};

const footerLinkStyle: React.CSSProperties = {
  color: TOKENS.colors.primary[600],
  textDecoration: 'none',
  fontSize: TOKENS.typography.fontSize.sm,
};
