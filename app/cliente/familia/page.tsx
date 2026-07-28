'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import DashboardLayout from '@/components/DashboardLayout';
import { ClientePage } from '@/components/cliente/ClientePage';
import { useRaioFamiliar } from '@/app/hooks/useRaioFamiliar';
import { CasaConviteShare } from '@/components/cliente/casa/CasaConviteShare';
import { CasaTransferirAdmin } from '@/components/cliente/casa/CasaTransferirAdmin';
import { CollapsibleSection } from '@/components/ui/CollapsibleSection';
import { CASA } from '@/lib/ux-copy-casa';
import { clienteHomeHref } from '@/lib/ai-native-shell';
import {
  ArrowLeft,
  CheckCircle2,
  Home,
  Loader2,
  LogOut,
  ShoppingCart,
  Sparkles,
  UserPlus,
  Users,
} from 'lucide-react';

type Passo = 'landing' | 'criar' | 'entrar' | 'sucesso';

export default function FamiliaPage() {
  const { data: session, status } = useSession();
  const userId = session?.user?.id;
  const { data, loading, recarregar } = useRaioFamiliar(status === 'authenticated');
  const [passo, setPasso] = useState<Passo>('landing');
  const [nomeCasa, setNomeCasa] = useState('');
  const [codigo, setCodigo] = useState('');
  const [volume, setVolume] = useState(3);
  const [compartilhar, setCompartilhar] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const [codigoCriado, setCodigoCriado] = useState<string | null>(null);

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
      return json;
    } catch (e) {
      setErro(e instanceof Error ? e.message : 'Erro');
      return null;
    } finally {
      setBusy(false);
    }
  };

  useEffect(() => {
    if (!circle) return;
    setVolume(circle.preferencias.volumeFamiliar);
    setCompartilhar(circle.preferencias.compartilharListas);
  }, [circle?.preferencias.volumeFamiliar, circle?.preferencias.compartilharListas]);

  const criarCasa = async () => {
    const json = await post({ acao: 'criar', nomeCasa: nomeCasa.trim() || 'Minha casa' });
    if (json?.data?.circle?.codigoConvite) {
      setCodigoCriado(json.data.circle.codigoConvite);
      setPasso('sucesso');
    }
  };

  const entrarCasa = async () => {
    const json = await post({ acao: 'entrar', codigo });
    if (json) setPasso('landing');
  };

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
      <ClientePage title={CASA.titulo} description={CASA.subtitulo}>
        <div className="mx-auto max-w-lg space-y-5">
          {msg && (
            <p className="rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>
          )}
          {erro && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">{erro}</p>}

          {/* —— Estado: casa ativa —— */}
          {ativo && circle && passo !== 'sucesso' && (
            <>
              <section className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-600 to-violet-700 p-5 text-white shadow-md">
                <p className="text-xs font-semibold uppercase tracking-wide text-indigo-200">
                  {CASA.ativo.suaCasa}
                </p>
                <h2 className="mt-1 text-2xl font-bold">{circle.nomeCasa}</h2>
                <p className="mt-2 text-sm text-indigo-100">
                  Você é{' '}
                  {data?.meuRole === 'admin' ? CASA.ativo.administrador : CASA.ativo.membro}
                  {' · '}
                  {circle.membros.length}{' '}
                  {circle.membros.length === 1 ? 'pessoa' : 'pessoas'}
                </p>
              </section>

              <CasaConviteShare nomeCasa={circle.nomeCasa} codigo={circle.codigoConvite} />

              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <Users className="h-4 w-4 text-indigo-600" />
                  {CASA.ativo.membros}
                </h2>
                <ul className="mt-3 space-y-2">
                  {circle.membros.map((m) => (
                    <li
                      key={m.userId}
                      className="flex items-center justify-between rounded-lg bg-gray-50 px-3 py-2.5 text-sm"
                    >
                      <span className="font-medium text-gray-900">{m.nome}</span>
                      <span className="text-xs font-medium uppercase text-gray-500">
                        {m.role === 'admin' ? CASA.ativo.administrador : CASA.ativo.membro}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <ShoppingCart className="h-4 w-4 text-emerald-600" />
                  {CASA.ativo.compras}
                </h2>
                {circle.listaCompartilhada && circle.listaCompartilhada.itens.length > 0 ? (
                  <div className="mt-3 rounded-lg bg-emerald-50 px-3 py-3 text-sm">
                    <p className="font-semibold text-emerald-900">
                      {CASA.ativo.itensPendentes(circle.listaCompartilhada.itens.length)}
                    </p>
                    <p className="mt-1 text-xs text-emerald-800">
                      {CASA.ativo.ultimaAtualizacao}:{' '}
                      {new Date(circle.listaCompartilhada.atualizadoEm).toLocaleString('pt-BR')}
                      {' · '}
                      {CASA.ativo.por} {circle.listaCompartilhada.atualizadoPorNome}
                    </p>
                    <Link
                      href="/cliente/busca"
                      className="mt-2 inline-block text-xs font-semibold text-emerald-700 hover:underline"
                    >
                      Ver lista e continuar comprando →
                    </Link>
                  </div>
                ) : (
                  <p className="mt-2 text-sm text-gray-600">{CASA.ativo.listaVazia}</p>
                )}
              </section>

              <section className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <h2 className="flex items-center gap-2 font-semibold text-gray-900">
                  <Sparkles className="h-4 w-4 text-violet-600" />
                  {CASA.ativo.preferencias}
                </h2>
                <p className="mt-1 text-xs text-gray-600">{CASA.ativo.preferenciasDesc}</p>
                <label className="mt-4 block text-sm font-medium text-gray-700">
                  {CASA.ativo.volume}
                </label>
                <p className="text-xs text-gray-500">{CASA.ativo.volumeHint}</p>
                <input
                  type="range"
                  min={1}
                  max={12}
                  value={volume}
                  onChange={(e) => setVolume(parseInt(e.target.value, 10))}
                  className="mt-2 w-full accent-indigo-600"
                />
                <p className="text-center text-sm font-semibold text-indigo-700">
                  {volume} {volume === 1 ? 'pessoa' : 'pessoas'}
                </p>
                <label className="mt-4 flex items-start gap-2 text-sm text-gray-700">
                  <input
                    type="checkbox"
                    checked={compartilhar}
                    onChange={(e) => setCompartilhar(e.target.checked)}
                    className="mt-0.5"
                  />
                  {CASA.ativo.compartilharLista}
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
                  className="mt-4 w-full rounded-xl bg-indigo-600 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                >
                  {CASA.ativo.salvarPrefs}
                </button>
              </section>

              <CollapsibleSection title={CASA.ativo.configuracoes} description={CASA.ativo.sairDesc}>
                {data?.meuRole === 'admin' && circle.membros.length > 1 && (
                  <CasaTransferirAdmin
                    membros={circle.membros}
                    meuUserId={userId}
                    busy={busy}
                    onTransferir={async (novoAdminUserId) => {
                      const json = await post({ acao: 'transferir-admin', novoAdminUserId });
                      if (json) setMsg(CASA.transferirAdmin.sucesso);
                    }}
                  />
                )}
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => void post({ acao: 'sair' })}
                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-red-200 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50 disabled:opacity-60"
                >
                  <LogOut className="h-4 w-4" />
                  {CASA.ativo.sair}
                </button>
              </CollapsibleSection>

              <p className="text-center text-[11px] text-gray-400">
                {CASA.termoTecnico} · recurso interno Precivox
              </p>
            </>
          )}

          {/* —— Sucesso pós-criação —— */}
          {passo === 'sucesso' && codigoCriado && circle && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-center">
                <CheckCircle2 className="mx-auto h-10 w-10 text-emerald-600" />
                <h2 className="mt-3 text-xl font-bold text-emerald-950">{CASA.sucesso.titulo}</h2>
                <p className="mt-1 text-sm text-emerald-800">{CASA.sucesso.subtitulo}</p>
              </div>
              <ul className="space-y-2 rounded-xl border border-gray-100 bg-white p-4 text-sm text-gray-700">
                {CASA.sucesso.proximos.map((item) => (
                  <li key={item} className="flex items-start gap-2">
                    <span className="text-emerald-600">✓</span>
                    {item}
                  </li>
                ))}
              </ul>
              <CasaConviteShare nomeCasa={circle.nomeCasa} codigo={codigoCriado} />
              <button
                type="button"
                onClick={() => setPasso('landing')}
                className="w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700"
              >
                {CASA.sucesso.ctaSecundario}
              </button>
            </div>
          )}

          {/* —— Onboarding: sem casa —— */}
          {!ativo && passo !== 'sucesso' && (
            <>
              {passo === 'landing' && (
                <>
                  <section className="rounded-2xl border border-indigo-100 bg-gradient-to-b from-indigo-50 to-white p-5">
                    <div className="flex items-center gap-2 text-indigo-800">
                      <Home className="h-5 w-5" />
                      <p className="text-sm font-semibold">Para que serve?</p>
                    </div>
                    <ul className="mt-4 space-y-3">
                      {CASA.beneficios.map((b) => (
                        <li key={b.titulo} className="rounded-lg bg-white/80 px-3 py-2.5 shadow-sm">
                          <p className="text-sm font-semibold text-gray-900">{b.titulo}</p>
                          <p className="mt-0.5 text-xs leading-relaxed text-gray-600">{b.descricao}</p>
                        </li>
                      ))}
                    </ul>
                  </section>

                  <section>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                      Quem usa?
                    </p>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {CASA.cenarios.map((c) => (
                        <div
                          key={c.titulo}
                          className="rounded-xl border border-gray-200 bg-white p-3 text-center shadow-sm"
                        >
                          <span className="text-2xl" aria-hidden>
                            {c.emoji}
                          </span>
                          <p className="mt-1 text-xs font-semibold text-gray-900">{c.titulo}</p>
                          <p className="mt-0.5 text-[10px] leading-snug text-gray-500">{c.descricao}</p>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="space-y-3">
                    <button
                      type="button"
                      onClick={() => setPasso('criar')}
                      className="w-full rounded-2xl border-2 border-indigo-600 bg-white p-4 text-left shadow-sm transition hover:bg-indigo-50/50"
                    >
                      <p className="font-semibold text-indigo-950">{CASA.escolha.criar.titulo}</p>
                      <p className="mt-1 text-sm text-gray-600">{CASA.escolha.criar.descricao}</p>
                      <span className="mt-3 inline-block rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white">
                        {CASA.escolha.criar.cta}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPasso('entrar')}
                      className="w-full rounded-2xl border border-gray-200 bg-white p-4 text-left shadow-sm transition hover:border-indigo-200"
                    >
                      <p className="font-semibold text-gray-900">{CASA.escolha.entrar.titulo}</p>
                      <p className="mt-1 text-sm text-gray-600">{CASA.escolha.entrar.descricao}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-indigo-700">
                        <UserPlus className="h-4 w-4" />
                        {CASA.escolha.entrar.cta}
                      </span>
                    </button>
                  </section>

                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/80 px-4 py-3 text-center">
                    <p className="text-sm font-medium text-gray-800">{CASA.moraSozinho.titulo}</p>
                    <p className="mt-1 text-xs text-gray-600">{CASA.moraSozinho.descricao}</p>
                    <Link
                      href={clienteHomeHref()}
                      className="mt-2 inline-block text-sm font-semibold text-indigo-600 hover:underline"
                    >
                      {CASA.moraSozinho.cta}
                    </Link>
                  </div>
                </>
              )}

              {passo === 'criar' && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPasso('landing')}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {CASA.criar.voltar}
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">{CASA.criar.titulo}</h2>
                  <p className="mt-1 text-xs text-gray-500">{CASA.criar.dica}</p>
                  <input
                    type="text"
                    value={nomeCasa}
                    onChange={(e) => setNomeCasa(e.target.value)}
                    placeholder={CASA.criar.placeholder}
                    className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void criarCasa()}
                    className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? 'Criando…' : CASA.criar.cta}
                  </button>
                </div>
              )}

              {passo === 'entrar' && (
                <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <button
                    type="button"
                    onClick={() => setPasso('landing')}
                    className="mb-4 flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800"
                  >
                    <ArrowLeft className="h-4 w-4" />
                    {CASA.entrar.voltar}
                  </button>
                  <h2 className="text-lg font-semibold text-gray-900">{CASA.entrar.titulo}</h2>
                  <p className="mt-1 text-xs text-gray-500">{CASA.entrar.dica}</p>
                  <input
                    type="text"
                    value={codigo}
                    onChange={(e) => setCodigo(e.target.value.toUpperCase())}
                    placeholder={CASA.entrar.placeholder}
                    maxLength={6}
                    className="mt-4 w-full rounded-xl border border-gray-300 px-3 py-3 text-center text-xl font-bold uppercase tracking-[0.25em] focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                  <button
                    type="button"
                    disabled={busy || codigo.length < 4}
                    onClick={() => void entrarCasa()}
                    className="mt-4 w-full rounded-xl bg-indigo-600 py-3 text-sm font-semibold text-white hover:bg-indigo-700 disabled:opacity-60"
                  >
                    {busy ? 'Entrando…' : CASA.entrar.cta}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </ClientePage>
    </DashboardLayout>
  );
}
