import Link from 'next/link';
import { MARKETING_CASES, PILOTO_STATS } from '@/lib/marketing/cases';
import DashboardPreview from '@/components/marketing/DashboardPreview';

const TIPO_LABELS = {
  rede: 'Rede',
  atacarejo: 'Atacarejo',
  atacado: 'Atacado',
};

export default function CasesContent() {
  return (
    <>
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-emerald-400 mb-4">
            Piloto regional
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {PILOTO_STATS.ancoraCount} parceiros âncora em produção
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Mercados reais usando inteligência de demanda no {PILOTO_STATS.regiao}. Referência:{' '}
            {PILOTO_STATS.gestorReferencia}.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-8">
            <Stat value={String(PILOTO_STATS.ancoraCount)} label="Parceiros âncora" />
            <Stat value={String(PILOTO_STATS.mercadosAtivos)} label="Mercados na rede" />
            <Stat value="3" label="Planos SaaS ativos" />
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">Dashboard gestor em ação</h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Radar de demanda, pricing assistido, heatmap e GROOC — tudo em um painel pensado
                para decisores, não para analistas de dados.
              </p>
              <Link
                href="/demo"
                className="mt-6 inline-flex text-violet-600 font-semibold hover:text-violet-700"
              >
                Ver demonstração ao vivo →
              </Link>
            </div>
            <div className="mt-10 lg:mt-0">
              <DashboardPreview />
            </div>
          </div>
        </div>
      </section>

      {/* Cases */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-slate-900 mb-10">Mercados do piloto</h2>
          <div className="space-y-6">
            {MARKETING_CASES.map((c) => (
              <article
                key={c.id}
                className={`rounded-2xl border p-8 ${
                  c.destaque ? 'border-violet-300 bg-violet-50/30' : 'border-slate-200 bg-white'
                }`}
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div>
                    {c.destaque && (
                      <span className="text-xs font-bold text-violet-600 uppercase tracking-wider">
                        Referência do piloto
                      </span>
                    )}
                    <h3 className="text-xl font-bold text-slate-900 mt-1">{c.mercado}</h3>
                    <p className="text-sm text-slate-500 mt-1">
                      {TIPO_LABELS[c.tipo]} · Plano {c.plano} · {c.regiao}
                    </p>
                  </div>
                  <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-3 py-1 rounded-full">
                    Âncora PRECIVOX
                  </span>
                </div>

                <div className="mt-6 grid md:grid-cols-2 gap-6">
                  <div>
                    <h4 className="text-sm font-semibold text-red-700">Desafio</h4>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.desafio}</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-semibold text-blue-700">Solução PRECIVOX</h4>
                    <p className="mt-1 text-sm text-slate-600 leading-relaxed">{c.solucao}</p>
                  </div>
                </div>

                <div className="mt-6">
                  <h4 className="text-sm font-semibold text-emerald-700">Resultados</h4>
                  <ul className="mt-2 space-y-1">
                    {c.resultados.map((r) => (
                      <li key={r} className="flex items-start gap-2 text-sm text-slate-700">
                        <span className="text-emerald-500 mt-0.5" aria-hidden>✓</span>
                        {r}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {c.modulos.map((m) => (
                    <span
                      key={m}
                      className="text-xs bg-white border border-slate-200 text-slate-600 px-2.5 py-1 rounded-full"
                    >
                      {m}
                    </span>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="py-16 bg-violet-600 text-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-extrabold">Seu mercado pode ser o próximo âncora</h2>
          <p className="mt-3 text-violet-100">
            Vagas limitadas por região. Prioridade para mercados com Tier 2+ e catálogo atualizado.
          </p>
          <Link
            href="/demo"
            className="mt-6 inline-flex px-10 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50"
          >
            Candidatar meu mercado
          </Link>
        </div>
      </section>
    </>
  );
}

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div>
      <div className="text-4xl font-extrabold text-white">{value}</div>
      <div className="text-sm text-slate-400 mt-1">{label}</div>
    </div>
  );
}
