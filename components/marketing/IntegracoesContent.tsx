import Link from 'next/link';
import {
  API_EXAMPLES,
  COLUNAS_CATALOGO,
  INTEGRACOES,
  type IntegracaoTier,
} from '@/lib/marketing/integracoes';

const TIER_LABELS: Record<IntegracaoTier, string> = {
  1: 'Tier 1 — Manual',
  2: 'Tier 2 — Automático',
  3: 'Tier 3 — Tempo real',
};

const TIER_COLORS: Record<IntegracaoTier, string> = {
  1: 'bg-slate-100 text-slate-700',
  2: 'bg-blue-100 text-blue-700',
  3: 'bg-violet-100 text-violet-700',
};

export default function IntegracoesContent() {
  return (
    <>
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-300 mb-4">
            Integrações
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight max-w-3xl">
            Conecte seu catálogo em horas — escale para tempo real
          </h1>
          <p className="mt-6 text-lg text-slate-300 max-w-2xl leading-relaxed">
            Do upload manual ao webhook de preço. Escolha o tier de integração conforme a maturidade
            do seu negócio.
          </p>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Níveis de integração</h2>
          <div className="grid md:grid-cols-3 gap-6">
            {INTEGRACOES.filter(
              (i, idx, arr) => arr.findIndex((x) => x.tier === i.tier) === idx
            ).map((i) => (
              <div key={i.tier} className="rounded-xl border border-slate-200 p-6">
                <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_COLORS[i.tier]}`}>
                  {TIER_LABELS[i.tier]}
                </span>
                <p className="mt-4 text-sm text-slate-600">
                  {i.tier === 1 && 'Upload manual e sync semanal. Ideal para começar.'}
                  {i.tier === 2 && 'URL, SFTP e API batch. Atualização até 24h.'}
                  {i.tier === 3 && 'Webhook e PRECI Network. Tempo quase real.'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Métodos */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Métodos disponíveis</h2>
          <div className="space-y-4">
            {INTEGRACOES.map((integ) => (
              <div
                key={integ.id}
                className="bg-white rounded-xl border border-slate-200 p-6 sm:flex sm:items-start sm:gap-8"
              >
                <div className="sm:w-48 shrink-0">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${TIER_COLORS[integ.tier]}`}>
                    Tier {integ.tier}
                  </span>
                  <h3 className="mt-2 font-bold text-slate-900">{integ.nome}</h3>
                  <p className="text-sm font-mono text-blue-600 mt-1">{integ.metodo}</p>
                </div>
                <div className="mt-4 sm:mt-0 flex-1">
                  <p className="text-slate-600">{integ.descricao}</p>
                  <p className="mt-2 text-sm text-slate-500">
                    <strong>Cadência:</strong> {integ.cadencia}
                  </p>
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {integ.requisitos.map((r) => (
                      <li
                        key={r}
                        className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full"
                      >
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Schema catálogo */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-2">Schema do catálogo</h2>
          <p className="text-slate-600 mb-8">Colunas aceitas no upload CSV, XLSX ou JSON (até 50 MB).</p>
          <div className="overflow-x-auto rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Coluna</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Obrigatório</th>
                  <th className="text-left py-3 px-4 font-semibold text-slate-900">Exemplo</th>
                </tr>
              </thead>
              <tbody>
                {COLUNAS_CATALOGO.map((col) => (
                  <tr key={col.coluna} className="border-t border-slate-100">
                    <td className="py-3 px-4 font-mono text-blue-700">{col.coluna}</td>
                    <td className="py-3 px-4">{col.obrigatorio ? 'Sim' : 'Não'}</td>
                    <td className="py-3 px-4 text-slate-600">{col.exemplo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* API examples */}
      <section className="py-16 bg-slate-900 text-slate-300">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-white mb-10">Referência de API</h2>
          <div className="space-y-8">
            <CodeBlock title="Batch de estoques (Tier 2+)" code={API_EXAMPLES.batchEstoques} />
            <CodeBlock title="Webhook de preço (Tier 3)" code={API_EXAMPLES.webhookPreco} />
            <CodeBlock title="PRECI Network — Intent (Enterprise)" code={API_EXAMPLES.preciNetwork} />
          </div>
          <p className="mt-8 text-sm text-slate-500">
            Documentação completa interna:{' '}
            <code className="text-slate-400">docs/PARCEIRO_EXPORT_CATALOGO.md</code>
            {' · '}
            Chaves API configuradas pelo time PRECIVOX após contrato.
          </p>
        </div>
      </section>

      <section className="py-16 bg-violet-50 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900">Pronto para integrar?</h2>
          <p className="mt-3 text-slate-600">
            Nossa equipe configura a primeira carga em menos de 24 horas.
          </p>
          <Link
            href="/demo"
            className="mt-6 inline-flex px-8 py-3.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500"
          >
            Solicitar onboarding técnico
          </Link>
        </div>
      </section>
    </>
  );
}

function CodeBlock({ title, code }: { title: string; code: string }) {
  return (
    <div>
      <h3 className="text-sm font-semibold text-violet-300 mb-3">{title}</h3>
      <pre className="bg-slate-950 rounded-xl p-5 overflow-x-auto text-xs leading-relaxed font-mono text-emerald-400 border border-slate-800">
        <code>{code}</code>
      </pre>
    </div>
  );
}
