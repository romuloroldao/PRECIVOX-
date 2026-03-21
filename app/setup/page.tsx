'use client';

import { useState } from 'react';

/**
 * Página de setup: cria usuários de teste (Admin, Gestor, Cliente) em produção.
 * Acesse https://precivox.com.br/setup e informe o SEED_SECRET configurado no servidor.
 */
export default function SetupPage() {
  const [secret, setSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message?: string; error?: string; credentials?: Record<string, string> } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!secret.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch('/api/setup/seed-users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ secret: secret.trim() }),
      });
      const data = await res.json();
      setResult({
        success: data.success,
        message: data.message,
        error: data.error,
        credentials: data.credentials,
      });
    } catch (err) {
      setResult({ success: false, error: 'Erro de conexão. Tente novamente.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-lg p-8 max-w-md w-full">
        <h1 className="text-xl font-bold text-gray-900 mb-2">Setup — Usuários de teste</h1>
        <p className="text-gray-600 text-sm mb-6">
          Cria ou atualiza Admin, Gestor e Cliente com e-mail verificado. Use apenas se você configurou <code className="bg-gray-100 px-1 rounded">SEED_SECRET</code> no servidor.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="secret" className="block text-sm font-medium text-gray-700 mb-1">
              SEED_SECRET
            </label>
            <input
              id="secret"
              type="password"
              value={secret}
              onChange={(e) => setSecret(e.target.value)}
              placeholder="Senha configurada no servidor"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              autoComplete="off"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold disabled:opacity-50"
          >
            {loading ? 'Executando...' : 'Criar usuários'}
          </button>
        </form>

        {result && (
          <div className={`mt-6 p-4 rounded-lg ${result.success ? 'bg-green-50 border border-green-200 text-green-800' : 'bg-red-50 border border-red-200 text-red-800'}`}>
            {result.success ? (
              <>
                <p className="font-semibold">{result.message}</p>
                {result.credentials && (
                  <div className="mt-3 text-sm space-y-1">
                    <p className="font-medium">Credenciais:</p>
                    <p>Admin: {result.credentials.admin}</p>
                    <p>Gestor: {result.credentials.gestor}</p>
                    <p>Cliente: {result.credentials.cliente}</p>
                  </div>
                )}
              </>
            ) : (
              <p>{result.error}</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
