/**
 * Página Offline - PWA
 * 
 * SQUAD A - Frontend/UX
 */

'use client';

import { TOKENS } from '@/styles/tokens';

export default function OfflinePage() {
  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <span style={styles.icon}>📡</span>
        <h1 style={styles.title}>Você está offline</h1>
        <p style={styles.text}>
          Não foi possível conectar à internet.
          <br />
          Algumas funcionalidades podem estar limitadas.
        </p>
        <button
          onClick={() => window.location.reload()}
          style={styles.button}
        >
          Tentar Novamente
        </button>
      </div>
    </main>
  );
}

const styles = {
  main: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: TOKENS.colors.surface,
  },
  container: {
    textAlign: 'center' as const,
    padding: TOKENS.spacing[8],
  },
  icon: {
    fontSize: '80px',
    display: 'block',
    marginBottom: TOKENS.spacing[4],
    opacity: 0.5,
  },
  title: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[4],
  },
  text: {
    fontSize: TOKENS.typography.fontSize.lg,
    color: TOKENS.colors.text.secondary,
    marginBottom: TOKENS.spacing[6],
    lineHeight: TOKENS.typography.lineHeight.relaxed,
  },
  button: {
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[6]}`,
    backgroundColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
    border: 'none',
    borderRadius: TOKENS.borderRadius.lg,
    fontSize: TOKENS.typography.fontSize.base,
    fontWeight: TOKENS.typography.fontWeight.semibold,
    cursor: 'pointer',
  },
};
