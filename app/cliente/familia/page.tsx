'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import DashboardLayout from '@/components/DashboardLayout';
import { ClientePage } from '@/components/cliente/ClientePage';
import { useRaioFamiliar } from '@/app/hooks/useRaioFamiliar';
import { RAIO_FAMILIAR_MAX_MEMBROS } from '@/lib/raio-familiar-constants';
import {
  ArrowLeft,
  Copy,
  Loader2,
  LogOut,
  UserPlus,
  Users,
} from 'lucide-react';

export default function FamiliaPage() {
  const { status } = useSession();
  const { data, loading, recarregar } = useRaioFamiliar(status === 'authenticated');
  const [nomeCasa, setNomeCasa] = useState('');
  const [codigo, setCodigo] = useState('');
  const [volume, setVolume] = useState(3);
  const [compartilhar, setCompartilhar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);

  const circle = data?.circle;
  const ativo = data?.ativo;

  const post = async (body: Record<string, unknown>) => {
    setBusy(true);
    setErro(null);
    setMsg(null);
    try {
      const res = await fetch('/api/cliente/raio-familiar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha');
      setMsg(json.message ?? 'Pronto!');
      await recarregar();
      if (json.data?.circle?.preferencias) {
        setVolume(json.data.circle.preferencias.volumeFamiliar);
        setCompartilhar(json.data.circle.preferencias.compartilharListas);
      }
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
    } finally {
      setBusy(false);
    }
  };

  const copiarCodigo = () => {
    if (!circle?.codigoConvite) return;
    void navigator.clipboard.writeText(circle.codigoConvite);
    setMsg('Código copiado!');
  };

  useEffect(() => {
    if (!circle) return;
    setVolume(circle.preferencias.volumeFamiliar);
    setCompartilhar(circle.preferencias.compartilharListas);
  }, [circle?.preferencias.volumeFamiliar, circle?.preferencias.compartilharListas]);

  if (loading && !data) {
    return (
      <DashboardLayout role="CLIENTE">
        <div className="flex justify-center py-20">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout role="CLIENTE">
      <ClientePage
        title="Raio familiar"
        description="Lista e preferências compartilhadas da casa"
      >
      <div className="mx-auto max-w-lg space-y-5">
        {msg && <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
        {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}

        {!ativo && (
          <div className="space-y-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <h2 className="font-semibold text-gray-900">Criar raio da casa</h2>
            <input
              type="text"
              value={nomeCasa}
              onChange={(e) => setNomeCasa(e.target.value)}
              placeholder="Ex: Família Silva"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              disabled={busy}
              onClick={() => void post({ acao: 'criar', nomeCasa: nomeCasa || 'Minha casa' })}
              className="w-full rounded-lg bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
            >
              Criar e gerar código
            </button>

            <div className="border-t border-gray-100 pt-4">
              <h2 className="font-semibold text-gray-900">Entrar com código</h2>
              <input
                type="text"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                placeholder="Código de 6 letras"
                maxLength={6}
                className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm uppercase tracking-widest"
              />
              <button
                type="button"
                disabled={busy || codigo.length < 4}
                onClick={() => void post({ acao: 'entrar', codigo })}
                className="mt-2 w-full rounded-lg border-2 border-indigo-600 py-2.5 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 disabled:opacity-60"
              >
                Entrar no raio
              </button>
            </div>
          </div>
        )}

        {ativo && circle && (
          <>
            <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
              <p className="text-sm font-semibold text-indigo-900">{circle.nomeCasa}</p>
              <p className="mt-1 text-xs text-indigo-700">
                Você é {data?.meuRole === 'admin' ? 'administrador(a)' : 'membro'}
              </p>
              <div className="mt-3 flex items-center gap-2">
                <code className="rounded-lg bg-white px-3 py-2 text-lg font-bold tracking-widest text-indigo-900">
                  {circle.codigoConvite}
                </code>
                <button
                  type="button"
                  onClick={copiarCodigo}
                  className="rounded-lg border border-indigo-200 bg-white p-2 text-indigo-700 hover:bg-indigo-100"
                  aria-label="Copiar código"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </div>
              <p className="mt-2 text-xs text-indigo-600">
                Até {RAIO_FAMILIAR_MAX_MEMBROS} pessoas · compartilhe o código com quem mora com você
              </p>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                <UserPlus className="h-4 w-4" />
                Membros ({circle.membros.length})
              </h2>
              <ul className="mt-3 space-y-2">
                {circle.membros.map((m) => (
                  <li
                    key={m.userId}
                    className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2 text-sm"
                  >
                    <span className="font-medium text-gray-900">{m.nome}</span>
                    <span className="text-xs uppercase text-gray-500">
                      {m.role === 'admin' ? 'Admin' : 'Membro'}
                    </span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
              <h2 className="font-semibold text-gray-900">Preferências da casa</h2>
              <p className="mt-1 text-xs text-gray-600">
                Volume familiar e lista compartilhada valem para todos do raio.
              </p>
              <label className="mt-4 block text-sm font-medium text-gray-700">
                Pessoas na casa (atacado / cesta)
              </label>
              <input
                type="range"
                min={1}
                max={12}
                value={volume}
                onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                className="mt-1 w-full"
              />
              <p className="text-center text-sm font-semibold text-indigo-700">{volume} pessoas</p>
              <label className="mt-4 flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={compartilhar}
                  onChange={(e) => setCompartilhar(e.target.checked)}
                />
                Compartilhar lista de compras em tempo real
              </label>
              <button
                type="button"
                disabled={busy}
                onClick={() =>
                  void post({
                    acao: 'preferencias',
                    volumeFamiliar: volume,
                    compartilharListas: compartilhar,
                  })
                }
                className="mt-4 w-full rounded-lg bg-indigo-600 py-2 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
              >
                Salvar preferências
              </button>
            </div>

            {circle.listaCompartilhada && (
              <div className="rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600 shadow-sm">
                Lista compartilhada: {circle.listaCompartilhada.itens.length} itens · atualizada por{' '}
                {circle.listaCompartilhada.atualizadoPorNome}
              </div>
            )}

            <button
              type="button"
              disabled={busy}
              onClick={() => void post({ acao: 'sair' })}
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              Sair do raio familiar
            </button>
          </>
        )}
      </div>
      </ClientePage>
    </DashboardLayout>
  );
}
