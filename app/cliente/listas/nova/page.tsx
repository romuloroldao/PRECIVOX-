'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { TOKENS } from '@/styles/tokens';
import Link from 'next/link';

export default function NovaListaPage() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const userId = (session?.user as { id?: string })?.id ?? null;
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const trimmed = name.trim();
    if (!trimmed) {
      setError('Dê um nome à sua lista.');
      return;
    }
    if (!userId) {
      setError('Faça login para criar uma lista.');
      router.push('/login');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/lists/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          name: trimmed,
          products: [],
        }),
      });
      const data = await res.json();
      if (data.success && data.data?.listId) {
        router.push(`/cliente/listas/${data.data.listId}`);
        return;
      }
      setError(data.message || data.error || 'Erro ao criar lista. Tente novamente.');
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') {
    return (
      <main style={styles.main}>
        <div style={styles.center}>
          <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600" />
          <p style={styles.loadingText}>Carregando...</p>
        </div>
      </main>
    );
  }

  if (!userId) {
    return (
      <main style={styles.main}>
        <div style={styles.container}>
          <p style={styles.redirect}>Redirecionando para o login...</p>
          <Link href="/login" style={styles.link}>
            Fazer login
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main style={styles.main}>
      <div style={styles.container}>
        <div style={styles.header}>
          <Link href="/cliente/listas" style={styles.backLink}>
            ← Voltar
          </Link>
          <h1 style={styles.title}>Nova lista de compras</h1>
          <p style={styles.subtitle}>
            Dê um nome à sua lista. Depois você pode adicionar produtos.
          </p>
        </div>

        <form onSubmit={handleSubmit} style={styles.form}>
          {error && (
            <div style={styles.error} role="alert">
              {error}
            </div>
          )}
          <div style={styles.field}>
            <label htmlFor="list-name" style={styles.label}>
              Nome da lista
            </label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Compras do mês, Churrasco..."
              style={styles.input}
              maxLength={100}
              autoFocus
            />
          </div>
          <div style={styles.actions}>
            <Link href="/cliente/listas" style={styles.cancelButton}>
              Cancelar
            </Link>
            <button type="submit" disabled={loading} style={styles.submitButton}>
              {loading ? 'Criando...' : 'Criar lista'}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    minHeight: '100vh',
    backgroundColor: TOKENS.colors.surface,
  },
  center: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    gap: TOKENS.spacing[4],
  },
  loadingText: {
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },
  container: {
    maxWidth: '600px',
    margin: '0 auto',
    padding: TOKENS.spacing[6],
  },
  redirect: {
    color: TOKENS.colors.text.secondary,
    marginBottom: TOKENS.spacing[4],
  },
  link: {
    color: TOKENS.colors.primary[600],
    fontWeight: 600,
  },
  header: {
    marginBottom: TOKENS.spacing[8],
  },
  backLink: {
    display: 'inline-block',
    color: TOKENS.colors.primary[600],
    fontSize: TOKENS.typography.fontSize.sm,
    marginBottom: TOKENS.spacing[4],
    textDecoration: 'none',
  },
  title: {
    fontSize: TOKENS.typography.fontSize['3xl'],
    fontWeight: TOKENS.typography.fontWeight.bold,
    color: TOKENS.colors.text.primary,
    margin: 0,
    marginBottom: TOKENS.spacing[2],
  },
  subtitle: {
    fontSize: TOKENS.typography.fontSize.base,
    color: TOKENS.colors.text.secondary,
    margin: 0,
  },
  form: {
    backgroundColor: TOKENS.colors.background,
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.lg,
    padding: TOKENS.spacing[6],
  },
  field: {
    marginBottom: TOKENS.spacing[6],
  },
  label: {
    display: 'block',
    fontSize: TOKENS.typography.fontSize.sm,
    fontWeight: 600,
    color: TOKENS.colors.text.primary,
    marginBottom: TOKENS.spacing[2],
  },
  input: {
    width: '100%',
    padding: `${TOKENS.spacing[3]} ${TOKENS.spacing[4]}`,
    fontSize: TOKENS.typography.fontSize.base,
    border: `1px solid ${TOKENS.colors.border}`,
    borderRadius: TOKENS.borderRadius.md,
    outline: 'none',
    boxSizing: 'border-box',
  },
  error: {
    padding: TOKENS.spacing[3],
    backgroundColor: '#FEE2E2',
    color: '#B91C1C',
    borderRadius: TOKENS.borderRadius.md,
    marginBottom: TOKENS.spacing[4],
    fontSize: TOKENS.typography.fontSize.sm,
  },
  actions: {
    display: 'flex',
    gap: TOKENS.spacing[4],
    justifyContent: 'flex-end',
    flexWrap: 'wrap',
  },
  cancelButton: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[4]}`,
    color: TOKENS.colors.text.secondary,
    textDecoration: 'none',
    borderRadius: TOKENS.borderRadius.md,
    fontWeight: 600,
  },
  submitButton: {
    padding: `${TOKENS.spacing[2]} ${TOKENS.spacing[6]}`,
    backgroundColor: TOKENS.colors.primary[600],
    color: TOKENS.colors.text.inverse,
    border: 'none',
    borderRadius: TOKENS.borderRadius.md,
    fontWeight: 600,
    cursor: 'pointer',
  },
};
