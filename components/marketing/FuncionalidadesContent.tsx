'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  CATEGORIA_LABELS,
  DESTAQUES,
  type FuncionalidadeAudiencia,
  type FuncionalidadeCategoria,
  type MarketingFuncionalidade,
  funcionalidadesPorCategoria,
} from '@/lib/marketing/funcionalidades';

const FILTROS: { id: FuncionalidadeAudiencia | 'todos'; label: string }[] = [
  { id: 'todos', label: 'Todos' },
  { id: 'b2b', label: 'Para Mercados' },
  { id: 'b2c', label: 'Para Consumidor' },
];

export default function FuncionalidadesContent() {
  const [filtro, setFiltro] = useState<FuncionalidadeAudiencia | 'todos'>('todos');
  const [categoriaAberta, setCategoriaAberta] = useState<FuncionalidadeCategoria | null>(null);

  const agrupado = funcionalidadesPorCategoria(filtro === 'todos' ? undefined : filtro);
  const total = Object.values(agrupado).reduce((acc, arr) => acc + arr.length, 0);

  return (
    <>
      <section className="bg-slate-900 text-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
            {total} funcionalidades para decisão inteligente
          </h1>
          <p className="mt-4 text-lg text-slate-300 max-w-2xl mx-auto">
            Do consumidor ao gestor — cada módulo entrega valor de negócio mensurável, não apenas
            relatório.
          </p>
        </div>
      </section>

      {/* Destaques */}
      <section className="py-12 bg-violet-50 border-b border-violet-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-violet-600 mb-6">
            Diferenciais proprietários
          </h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DESTAQUES.map((f) => (
              <div key={f.id} className="bg-white rounded-xl border border-violet-200 p-5">
                <span className="text-xs font-medium text-violet-600 uppercase">
                  {CATEGORIA_LABELS[f.categoria]}
                </span>
                <h3 className="mt-1 font-bold text-slate-900">{f.nome}</h3>
                <p className="mt-2 text-sm text-slate-600">{f.beneficio}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Filtros */}
      <section className="py-8 bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap gap-2 justify-center">
          {FILTROS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => setFiltro(f.id)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                filtro === f.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </section>

      {/* Catálogo por categoria */}
      <section className="py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
          {(Object.entries(agrupado) as [FuncionalidadeCategoria, MarketingFuncionalidade[]][]).map(
            ([cat, items]) => (
              <div key={cat}>
                <button
                  type="button"
                  onClick={() => setCategoriaAberta(categoriaAberta === cat ? null : cat)}
                  className="w-full flex items-center justify-between text-left mb-6 group"
                  aria-expanded={categoriaAberta === cat}
                >
                  <h2 className="text-2xl font-bold text-slate-900 group-hover:text-blue-700 transition-colors">
                    {CATEGORIA_LABELS[cat]}
                    <span className="ml-3 text-sm font-normal text-slate-500">({items.length})</span>
                  </h2>
                  <svg
                    className={`w-5 h-5 text-slate-400 transition-transform ${
                      categoriaAberta === cat ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>

                <div
                  className={`grid sm:grid-cols-2 lg:grid-cols-3 gap-5 ${
                    categoriaAberta !== null && categoriaAberta !== cat ? 'hidden' : ''
                  }`}
                >
                  {items.map((f) => (
                    <article
                      key={f.id}
                      className="bg-white rounded-xl border border-slate-200 p-6 hover:border-blue-200 hover:shadow-md transition-all"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-slate-900">{f.nome}</h3>
                        <AudienciaBadge audiencia={f.audiencia} />
                      </div>
                      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{f.descricao}</p>
                      <dl className="mt-4 space-y-2 text-sm">
                        <div>
                          <dt className="font-medium text-emerald-700">Benefício</dt>
                          <dd className="text-slate-600">{f.beneficio}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-blue-700">Valor</dt>
                          <dd className="text-slate-600">{f.valorCliente}</dd>
                        </div>
                        <div>
                          <dt className="font-medium text-violet-700">Diferencial</dt>
                          <dd className="text-slate-600">{f.diferencial}</dd>
                        </div>
                      </dl>
                    </article>
                  ))}
                </div>
              </div>
            )
          )}
        </div>
      </section>

      <section className="py-16 bg-white text-center">
        <div className="max-w-xl mx-auto px-4">
          <h2 className="text-2xl font-bold text-slate-900">Quer ver na prática?</h2>
          <p className="mt-3 text-slate-600">
            Agende uma demonstração com dados reais do piloto regional.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/demo"
              className="inline-flex justify-center px-8 py-3.5 rounded-xl bg-violet-600 text-white font-semibold hover:bg-violet-500"
            >
              Agendar demonstração
            </Link>
            <Link
              href="/integracoes"
              className="inline-flex justify-center px-8 py-3.5 rounded-xl border border-slate-200 font-semibold text-slate-800 hover:border-slate-300"
            >
              Ver integrações
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

function AudienciaBadge({ audiencia }: { audiencia: FuncionalidadeAudiencia }) {
  const styles = {
    b2c: 'bg-blue-100 text-blue-700',
    b2b: 'bg-violet-100 text-violet-700',
    ambos: 'bg-slate-100 text-slate-600',
  };
  const labels = { b2c: 'B2C', b2b: 'B2B', ambos: 'Ambos' };
  return (
    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full ${styles[audiencia]}`}>
      {labels[audiencia]}
    </span>
  );
}
