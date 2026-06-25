import Link from 'next/link';
import DashboardPreview from '@/components/marketing/DashboardPreview';

const PROBLEMAS = [
  {
    title: 'Demanda invisível',
    desc: 'Você não sabe o que o bairro vai comprar nos próximos dias — o concorrente também não, até aparecer o PRECIVOX.',
  },
  {
    title: 'Preço sem contexto',
    desc: 'Promoção genérica corrói margem. Preço alto demais afasta quem já pesquisou no celular.',
  },
  {
    title: 'Catálogo desatualizado',
    desc: 'Preço errado na plataforma destrói confiança e manda o cliente para outro mercado.',
  },
  {
    title: 'Decisão lenta',
    desc: 'Relatórios chegam tarde. A janela de oportunidade no bairro já fechou.',
  },
];

const PASSOS = [
  { n: '01', title: 'Conecte seu catálogo', desc: 'Upload CSV, API ou sync automático (URL/SFTP).' },
  { n: '02', title: 'A IA mapeia a demanda', desc: 'Radar, heatmap e benchmark do seu bairro em tempo quase real.' },
  { n: '03', title: 'Execute em 1 toque', desc: 'Pricing assistido, promo segmentada e alerta de ruptura.' },
  { n: '04', title: 'Meça o impacto', desc: 'Conversão lista→visita, saúde do catálogo e resumo GROOC semanal.' },
];

const MODULOS = [
  { title: 'Radar de demanda', desc: 'Termos e produtos mais buscados na sua região (7/14/30 dias).' },
  { title: 'Pricing assistido', desc: 'Sugestões com benchmark regional e aprovação humana.' },
  { title: 'Heatmap de intenção', desc: 'Mapa geográfico de demanda por micro-região.' },
  { title: 'Promo direcionada', desc: 'Ofertas por segmento: intent alta, churn ou cesta da semana.' },
  { title: 'Saúde do catálogo', desc: 'Score de freshness, SLA por tier e selo de preço verificado.' },
  { title: 'GROOC', desc: 'Assistente IA com fontes — explica o porquê de cada recomendação.' },
];

export default function ParaMercadosLanding() {
  return (
    <>
      {/* Hero */}
      <section className="relative overflow-hidden bg-slate-900 text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-violet-900/40 via-slate-900 to-blue-900/30" aria-hidden />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 sm:py-28">
          <div className="max-w-3xl">
            <p className="text-sm font-semibold uppercase tracking-widest text-violet-300 mb-4">
              Plataforma B2B para varejo alimentar
            </p>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight leading-tight">
              Transforme a demanda do seu bairro em{' '}
              <span className="text-violet-300">receita previsível</span>
            </h1>
            <p className="mt-6 text-lg text-slate-300 leading-relaxed max-w-2xl">
              O PRECIVOX conecta a intenção de compra dos consumidores da sua região às decisões do
              seu mercado — preço, promoção e estoque — com IA explicável e dados hiperlocais.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link
                href="/demo"
                className="inline-flex justify-center px-8 py-3.5 rounded-xl bg-violet-600 hover:bg-violet-500 font-bold transition-colors"
              >
                Agendar demonstração gratuita
              </Link>
              <Link
                href="/planos"
                className="inline-flex justify-center px-8 py-3.5 rounded-xl border border-slate-600 hover:border-slate-500 font-semibold transition-colors"
              >
                Ver planos
              </Link>
            </div>
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-400">
              <li className="flex items-center gap-2">
                <CheckIcon /> LGPD · dados no Brasil
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> Integração em 24h
              </li>
              <li className="flex items-center gap-2">
                <CheckIcon /> 5 parceiros âncora no piloto
              </li>
            </ul>
          </div>
        </div>
      </section>

      {/* Problema */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mb-14">
            <h2 className="text-3xl font-bold text-slate-900">Seu mercado decide no escuro</h2>
            <p className="mt-4 text-slate-600 leading-relaxed">
              Enquanto o consumidor pesquisa no celular, muitos gestores ainda dependem de planilha e
              promoção genérica. O resultado: margem corroída e clientes indo para o concorrente do bairro.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PROBLEMAS.map((p) => (
              <div key={p.title} className="rounded-xl border border-red-100 bg-red-50/50 p-6">
                <h3 className="font-semibold text-slate-900">{p.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Solução */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div>
              <h2 className="text-3xl font-bold text-slate-900">
                O sistema operacional da demanda alimentar do seu bairro
              </h2>
              <p className="mt-6 text-slate-600 leading-relaxed">
                Não somos um comparador de preços. Somos a infraestrutura que captura intenção de compra
                real, cruza com seu catálogo e entrega ações que seu time executa em 1 toque — com
                explicação clara de por quê.
              </p>
              <Link href="/planos" className="mt-8 inline-flex text-violet-600 font-semibold hover:text-violet-700">
                Comparar planos →
              </Link>
            </div>
            <div className="mt-12 lg:mt-0 rounded-2xl bg-slate-900 text-white p-8 shadow-xl">
              <p className="text-xs font-semibold uppercase tracking-wider text-violet-300 mb-6">
                Diferenciais proprietários
              </p>
              <ul className="space-y-4">
                {['Economia Líquida™', 'PRECI Graph hiperlocal', 'Truth Layer verificável', 'IA explicável (GROOC)'].map(
                  (item) => (
                    <li key={item} className="flex items-center gap-3 text-sm">
                      <span className="w-2 h-2 rounded-full bg-violet-400 shrink-0" aria-hidden />
                      {item}
                    </li>
                  )
                )}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Dashboard preview */}
      <section className="py-20 bg-slate-50 border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="lg:grid lg:grid-cols-2 lg:gap-16 items-center">
            <div className="order-2 lg:order-1 mt-10 lg:mt-0">
              <DashboardPreview />
            </div>
            <div className="order-1 lg:order-2">
              <h2 className="text-3xl font-bold text-slate-900">
                Painel que fala a língua do gestor
              </h2>
              <p className="mt-4 text-slate-600 leading-relaxed">
                Radar de demanda, pricing assistido, saúde do catálogo e resumo GROOC — tudo em um
                dashboard pensado para quem decide, não para quem analisa planilha.
              </p>
              <div className="mt-6 flex flex-wrap gap-4">
                <Link
                  href="/demo"
                  className="inline-flex px-6 py-3 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500 transition-colors"
                >
                  Ver ao vivo na demo
                </Link>
                <Link
                  href="/cases"
                  className="inline-flex px-6 py-3 rounded-xl border border-slate-300 font-semibold text-slate-800 hover:border-slate-400 transition-colors"
                >
                  Cases do piloto
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-14">Como funciona</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {PASSOS.map((step) => (
              <div key={step.n}>
                <span className="text-4xl font-extrabold text-violet-200">{step.n}</span>
                <h3 className="mt-2 text-lg font-semibold text-slate-900">{step.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Módulos */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Módulos para gestores</h2>
          <p className="text-center text-slate-600 max-w-xl mx-auto mb-14">
            Cada módulo entrega uma ação de negócio — não apenas um relatório.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {MODULOS.map((m) => (
              <div key={m.title} className="bg-white rounded-xl border border-slate-200 p-6 hover:border-violet-200 transition-colors">
                <h3 className="font-semibold text-slate-900">{m.title}</h3>
                <p className="mt-2 text-sm text-slate-600 leading-relaxed">{m.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 bg-violet-600 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold">Pronto para liderar a demanda do seu bairro?</h2>
          <p className="mt-4 text-violet-100 text-lg">
            Agende 30 minutos. Mostramos o dashboard com dados reais do piloto regional.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex justify-center px-10 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors"
            >
              Agendar demonstração
            </Link>
            <a
              href="mailto:comercial@precivox.com.br"
              className="inline-flex justify-center px-10 py-4 rounded-xl border-2 border-white/40 font-semibold hover:bg-white/10 transition-colors"
            >
              comercial@precivox.com.br
            </a>
          </div>
        </div>
      </section>
    </>
  );
}

function CheckIcon() {
  return (
    <svg className="w-4 h-4 text-emerald-400 shrink-0" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
    </svg>
  );
}
