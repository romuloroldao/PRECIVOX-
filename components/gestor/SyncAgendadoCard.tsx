'use client';

import { useCallback, useEffect, useState } from 'react';
import { CalendarClock, Loader2, Play, RefreshCw } from 'lucide-react';

type Unidade = { id: string; nome: string };

type SyncConfig = {
  ativo: boolean;
  unidadeId: string;
  tipo: 'url' | 'sftp';
  url?: string;
  intervalo: string;
  ultimaExecucao?: string;
  ultimoStatus?: string;
  ultimaMensagem?: string;
  temSenhaSftp?: boolean;
  sftp?: { host: string; port: number; username: string; remotePath: string };
};

interface Props {
  mercadoId: string;
}

export function SyncAgendadoCard({ mercadoId }: Props) {
  const [unidades, setUnidades] = useState<Unidade[]>([]);
  const [config, setConfig] = useState<SyncConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [executando, setExecutando] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const [ativo, setAtivo] = useState(false);
  const [unidadeId, setUnidadeId] = useState('');
  const [tipo, setTipo] = useState<'url' | 'sftp'>('url');
  const [url, setUrl] = useState('');
  const [intervalo, setIntervalo] = useState('24h');
  const [sftpHost, setSftpHost] = useState('');
  const [sftpPort, setSftpPort] = useState('22');
  const [sftpUser, setSftpUser] = useState('');
  const [sftpPath, setSftpPath] = useState('');
  const [sftpPassword, setSftpPassword] = useState('');

  const carregar = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/gestor/sync-agendado?mercadoId=${mercadoId}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const json = await res.json();
      if (json.success) {
        setUnidades(json.data.unidades ?? []);
        const c = json.data.config as SyncConfig | null;
        setConfig(c);
        if (c) {
          setAtivo(c.ativo);
          setUnidadeId(c.unidadeId);
          setTipo(c.tipo);
          setUrl(c.url ?? '');
          setIntervalo(c.intervalo ?? '24h');
          if (c.sftp) {
            setSftpHost(c.sftp.host);
            setSftpPort(String(c.sftp.port));
            setSftpUser(c.sftp.username);
            setSftpPath(c.sftp.remotePath);
          }
        } else if (json.data.unidades?.[0]) {
          setUnidadeId(json.data.unidades[0].id);
        }
      }
    } finally {
      setLoading(false);
    }
  }, [mercadoId]);

  useEffect(() => {
    void carregar();
  }, [carregar]);

  const salvar = async () => {
    setSalvando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/sync-agendado', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mercadoId,
          ativo,
          unidadeId,
          tipo,
          url: tipo === 'url' ? url : undefined,
          intervalo,
          sftp:
            tipo === 'sftp'
              ? {
                  host: sftpHost,
                  port: sftpPort,
                  username: sftpUser,
                  remotePath: sftpPath,
                }
              : undefined,
          sftpPassword: sftpPassword || undefined,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha ao salvar');
      setMsg('Configuração salva.');
      setSftpPassword('');
      await carregar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro');
    } finally {
      setSalvando(false);
    }
  };

  const executarAgora = async () => {
    setExecutando(true);
    setMsg(null);
    try {
      const res = await fetch('/api/gestor/sync-agendado/executar', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mercadoId }),
      });
      const json = await res.json();
      if (!json.success && !json.data?.ok) {
        throw new Error(json.data?.mensagem || json.error || 'Falha no sync');
      }
      setMsg(json.data?.mensagem ?? 'Sync concluído');
      await carregar();
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro');
    } finally {
      setExecutando(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-500">
        <Loader2 className="h-4 w-4 animate-spin" />
        Carregando sync agendado…
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-2">
          <CalendarClock className="mt-0.5 h-5 w-5 text-blue-700" />
          <div>
            <h2 className="font-semibold text-gray-900">Sync agendado</h2>
            <p className="mt-0.5 text-sm text-gray-600">
              Baixa CSV/XLSX/JSON de uma URL ou SFTP e reutiliza o mesmo processamento do upload.
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => void carregar()}
          className="rounded-lg border border-gray-200 p-2 text-gray-600 hover:bg-gray-50"
          aria-label="Atualizar"
        >
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      {config?.ultimaExecucao && (
        <p className="mt-3 rounded-lg bg-white/80 px-3 py-2 text-xs text-gray-700">
          Última execução: {new Date(config.ultimaExecucao).toLocaleString('pt-BR')}
          {config.ultimaMensagem ? ` — ${config.ultimaMensagem}` : ''}
        </p>
      )}

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <label className="flex items-center gap-2 text-sm font-medium text-gray-800">
          <input type="checkbox" checked={ativo} onChange={(e) => setAtivo(e.target.checked)} />
          Sync ativo
        </label>
        <div>
          <label className="text-xs font-semibold uppercase text-gray-500">Unidade destino</label>
          <select
            value={unidadeId}
            onChange={(e) => setUnidadeId(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            {unidades.map((u) => (
              <option key={u.id} value={u.id}>
                {u.nome}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-gray-500">Intervalo</label>
          <select
            value={intervalo}
            onChange={(e) => setIntervalo(e.target.value)}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="6h">A cada 6 horas</option>
            <option value="12h">A cada 12 horas</option>
            <option value="24h">Diário</option>
            <option value="semanal">Semanal</option>
          </select>
        </div>
        <div>
          <label className="text-xs font-semibold uppercase text-gray-500">Fonte</label>
          <select
            value={tipo}
            onChange={(e) => setTipo(e.target.value as 'url' | 'sftp')}
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="url">URL pública ou autenticada</option>
            <option value="sftp">SFTP</option>
          </select>
        </div>
      </div>

      {tipo === 'url' ? (
        <div className="mt-3">
          <label className="text-xs font-semibold uppercase text-gray-500">URL do arquivo</label>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://parceiro.com.br/export/catalogo.csv"
            className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          <input
            placeholder="Host SFTP"
            value={sftpHost}
            onChange={(e) => setSftpHost(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Porta"
            value={sftpPort}
            onChange={(e) => setSftpPort(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="Usuário"
            value={sftpUser}
            onChange={(e) => setSftpUser(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            placeholder="/caminho/catalogo.csv"
            value={sftpPath}
            onChange={(e) => setSftpPath(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
          <input
            type="password"
            placeholder={
              config?.temSenhaSftp ? 'Nova senha (deixe vazio para manter)' : 'Senha SFTP'
            }
            value={sftpPassword}
            onChange={(e) => setSftpPassword(e.target.value)}
            className="sm:col-span-2 rounded-lg border border-gray-300 px-3 py-2 text-sm"
          />
        </div>
      )}

      {msg && (
        <p className="mt-3 rounded-lg bg-blue-100/80 px-3 py-2 text-sm text-blue-900">{msg}</p>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          disabled={salvando || !unidadeId}
          onClick={() => void salvar()}
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
        >
          {salvando ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
          Salvar
        </button>
        <button
          type="button"
          disabled={executando || !unidadeId}
          onClick={() => void executarAgora()}
          className="inline-flex items-center gap-2 rounded-lg border border-blue-600 bg-white px-4 py-2 text-sm font-semibold text-blue-700 hover:bg-blue-50 disabled:opacity-60"
        >
          {executando ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
          Executar agora
        </button>
      </div>
    </div>
  );
}
