import Link from 'next/link';
import Logo from '@/components/Logo';

const PERSONAS: Array<{
  href: string;
  title: string;
  subtitle: string;
  description: string;
  bullets: string[];
  cta: string;
  accent: string;
  ring: string;
  featured?: boolean;
}> = [
  {
    href: '/consumidor',
    title: 'Quero economizar',
    subtitle: 'Compare preços no seu bairro e compre melhor',
    description:
      'Monte sua lista, veja onde os mesmos produtos saem mais baratos e acompanhe quanto já economizou — tudo grátis.',
    bullets: ['Preços dos mercados perto de você', 'Alertas quando o preço cai', 'Grátis para sempre'],
    cta: 'Começar grátis',
    accent: 'from-blue-600 to-blue-700',
    ring: 'ring-blue-400',
    featured: true,
  },
  {
    href: '/demo',
    title: 'Tenho um mercado',
    subtitle: 'Mostre seus preços para quem está comprando',
    description:
      'Cadastre seus produtos e apareça nas comparações de preço dos consumidores da sua região.',
    bullets: ['Apareça para quem está comprando', 'Cadastro simples do catálogo', 'Em breve — entre na fila'],
    cta: 'Quero participar',
    accent: 'from-violet-600 to-indigo-700',
    ring: 'ring-violet-400',
  },
];

export default function PersonaHub() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gradient-to-b from-slate-50 to-white">
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-24 text-center">
        <div className="flex justify-center mb-8">
          <Logo height={48} />
        </div>
        <p className="text-sm font-semibold uppercase tracking-widest text-blue-600 mb-4">
          Compare preços · Economize de verdade
        </p>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-slate-900 tracking-tight max-w-3xl mx-auto">
          Pague mais barato no mercado perto de você
        </h1>
        <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
          Monte sua lista, compare preços dos mercados do seu bairro e descubra onde comprar
          mais barato — considerando distância, tempo e promoções reais.
        </p>
      </section>

      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-20">
        <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
          {PERSONAS.map((persona) => (
            <Link
              key={persona.href}
              href={persona.href}
              className={`group relative flex flex-col rounded-2xl border bg-white p-8 shadow-sm hover:shadow-lg transition-all hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ${persona.ring} ${
                persona.featured ? 'border-violet-200 shadow-md' : 'border-slate-200'
              }`}
            >
              {persona.featured && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-violet-600 text-white text-xs font-semibold px-3 py-1 rounded-full">
                  Mais procurado
                </span>
              )}
              <div
                className={`w-12 h-12 rounded-xl bg-gradient-to-br ${persona.accent} flex items-center justify-center mb-6`}
                aria-hidden
              >
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
              </div>
              <h2 className="text-xl font-bold text-slate-900">{persona.title}</h2>
              <p className="text-sm font-medium text-blue-600 mt-1">{persona.subtitle}</p>
              <p className="mt-4 text-sm text-slate-600 leading-relaxed flex-1">{persona.description}</p>
              <ul className="mt-6 space-y-2 text-left">
                {persona.bullets.map((bullet) => (
                  <li key={bullet} className="flex items-start gap-2 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {bullet}
                  </li>
                ))}
              </ul>
              <span className="mt-8 inline-flex items-center justify-center w-full py-3 px-4 rounded-lg bg-slate-900 text-white text-sm font-semibold group-hover:bg-slate-800 transition-colors">
                {persona.cta}
              </span>
            </Link>
          ))}
        </div>

        <p className="text-center mt-12 text-sm text-slate-500">
          Já tem conta?{' '}
          <Link href="/login" className="font-semibold text-blue-600 hover:text-blue-700">
            Entrar no sistema
          </Link>
        </p>
      </section>
    </div>
  );
}
