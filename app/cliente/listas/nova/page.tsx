'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import DashboardLayout from '@/components/DashboardLayout';
import { ClientePage } from '@/components/cliente/ClientePage';
import { Button } from '@/components/ui';

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
        body: JSON.stringify({ userId, name: trimmed, products: [] }),
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
      <DashboardLayout role="CLIENTE">
        <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary-200 border-t-primary-600" />
          <p className="text-sm text-text-secondary">Carregando…</p>
        </div>
      </DashboardLayout>
    );
  }

  if (!userId) {
    return (
      <DashboardLayout role="CLIENTE">
        <ClientePage title="Nova lista" mobileDescription="Faça login para continuar">
          <div className="rounded-xl border border-slate-200 bg-white p-6 text-center">
            <p className="text-sm text-text-secondary">Redirecionando para o login…</p>
            <Link
              href="/login"
              className="mt-3 inline-block font-semibold text-primary-600 hover:underline"
            >
              Fazer login
            </Link>
          </div>
        </ClientePage>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Nova lista de compras"
        description="Dê um nome à sua lista. Depois você pode adicionar produtos."
      >
        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-slate-200 bg-white p-5 md:p-6"
        >
          {error && (
            <div
              className="mb-4 rounded-lg bg-error-50 px-3 py-2 text-sm text-error-700"
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="mb-6">
            <label htmlFor="list-name" className="mb-2 block text-sm font-semibold text-text-primary">
              Nome da lista
            </label>
            <input
              id="list-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ex: Compras do mês, Churrasco…"
              maxLength={100}
              autoFocus
              className="w-full rounded-lg border border-slate-300 px-4 py-3 text-base focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="flex flex-wrap justify-end gap-3">
            <Link
              href="/cliente/listas"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-text-secondary hover:bg-slate-50"
            >
              Cancelar
            </Link>
            <Button type="submit" variant="primary" size="md" isLoading={loading}>
              {loading ? 'Criando…' : 'Criar lista'}
            </Button>
          </div>
        </form>
      </ClientePage>
    </DashboardLayout>
  );
}
