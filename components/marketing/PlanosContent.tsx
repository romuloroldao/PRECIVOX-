import Link from 'next/link';
import {
  MARKETING_PLANOS,
  SAAS_FEATURE_LABELS,
  formatPrecoBRL,
  planoFeatures,
} from '@/lib/marketing/planos';
import { SAAS_TIER_FEATURES } from '@/lib/monetizacao/types';

const ALL_FEATURES = SAAS_TIER_FEATURES.enterprise;

const EXTRA_POR_PLANO: Record<string, string[]> = {
  essencial: ['Upload de catálogo (CSV/XLSX/JSON)', 'Saúde do catálogo', 'Sync agendado', 'Suporte por e-mail'],
  pro: ['Resumo semanal GROOC', 'Ruptura preditiva', 'Selo preço verificado', 'Suporte prioritário'],
  enterprise: ['PRECI Network API', 'Insights CPG agregados', 'SLA dedicado', 'Onboarding personalizado'],
};

export default function PlanosContent() {
  return (
    <>
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            Planos para cada estágio do seu mercado
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Comece com radar e pricing assistido. Escale com heatmap, promo segmentada e ML leve.
            Enterprise desbloqueia insights CPG para redes e parceiros estratégicos.
          </p>
        </div>
      </section>

      <section className="py-16 sm:py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {MARKETING_PLANOS.map((plano) => {
              const features = planoFeatures(plano.tier);
              const extras = EXTRA_POR_PLANO[plano.tier] ?? [];

              return (
                <div
                  key={plano.tier}
                  className={`relative rounded-2xl bg-white border p-8 flex flex-col ${
                    plano.destaque
                      ? 'border-violet-400 shadow-xl ring-2 ring-violet-400/20 scale-[1.02]'
                      : 'border-slate-200 shadow-sm'
                  }`}
                >
                  {plano.destaque && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-bold px-4 py-1 rounded-full">
                      Mais popular
                    </span>
                  )}
                  <h2 className="text-xl font-bold text-slate-900">{plano.nome}</h2>
                  <p className="mt-2 text-sm text-slate-600">{plano.descricao}</p>
                  <div className="mt-6">
                    <span className="text-4xl font-extrabold text-slate-900">
                      {formatPrecoBRL(plano.valorMensal)}
                    </span>
                    <span className="text-slate-500 text-sm">/mês</span>
                  </div>
                  <p className="mt-2 text-xs text-slate-500">
                    Até {plano.limiteUnidades} unidades · upload {plano.limiteUploadMb} MB
                  </p>

                  <ul className="mt-8 space-y-3 flex-1">
                    {features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-slate-700">
                        <CheckIcon />
                        {SAAS_FEATURE_LABELS[f]}
                      </li>
                    ))}
                    {extras.map((e) => (
                      <li key={e} className="flex items-start gap-2 text-sm text-slate-500">
                        <CheckIcon muted />
                        {e}
                      </li>
                    ))}
                  </ul>

                  <Link
                    href={plano.ctaHref}
                    className={`mt-8 block text-center py-3.5 rounded-xl font-semibold transition-colors ${
                      plano.destaque
                        ? 'bg-violet-600 text-white hover:bg-violet-500'
                        : 'bg-slate-900 text-white hover:bg-slate-800'
                    }`}
                  >
                    {plano.cta}
                  </Link>
                </div>
              );
            })}
          </div>

          <p className="text-center mt-10 text-sm text-slate-500">
            Valores de referência do piloto comercial. Cobrança recorrente via contrato —{' '}
            <Link href="/demo" className="text-violet-600 font-medium hover:underline">
              fale com o comercial
            </Link>{' '}
            para proposta personalizada.
          </p>
        </div>
      </section>

      {/* Tabela comparativa */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <h2 className="text-2xl font-bold text-slate-900 mb-8 text-center">Comparativo de módulos</h2>
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 pr-4 font-semibold text-slate-900">Módulo</th>
                {MARKETING_PLANOS.map((p) => (
                  <th key={p.tier} className="py-3 px-4 text-center font-semibold text-slate-900">
                    {p.nome}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {ALL_FEATURES.map((feature) => (
                <tr key={feature} className="border-b border-slate-100">
                  <td className="py-3 pr-4 text-slate-700">{SAAS_FEATURE_LABELS[feature]}</td>
                  {MARKETING_PLANOS.map((p) => (
                    <td key={p.tier} className="py-3 px-4 text-center">
                      {planoFeatures(p.tier).includes(feature) ? (
                        <span className="text-emerald-600 font-bold" aria-label="Incluído">✓</span>
                      ) : (
                        <span className="text-slate-300" aria-label="Não incluído">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="py-16 bg-violet-50 text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900">Não sabe qual plano escolher?</h2>
          <p className="mt-3 text-slate-600">
            Nossa equipe analisa o porte do seu mercado e indica o tier ideal em uma demonstração de 30 minutos.
          </p>
          <Link
            href="/demo"
            className="mt-6 inline-flex px-8 py-3.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors"
          >
            Agendar demonstração gratuita
          </Link>
        </div>
      </section>
    </>
  );
}

function CheckIcon({ muted }: { muted?: boolean }) {
  return (
    <svg
      className={`w-5 h-5 shrink-0 mt-0.5 ${muted ? 'text-slate-300' : 'text-emerald-500'}`}
      fill="currentColor"
      viewBox="0 0 20 20"
      aria-hidden
    >
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
