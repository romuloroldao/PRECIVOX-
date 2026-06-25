/**
 * Mockup visual do dashboard gestor — baseado nos cards reais do produto.
 * Substitua por screenshot quando disponível em /public/marketing/.
 */
export default function DashboardPreview() {
  return (
    <div
      className="rounded-2xl border border-slate-200 bg-slate-100 p-3 shadow-2xl shadow-slate-300/50"
      role="img"
      aria-label="Prévia do dashboard gestor PRECIVOX com radar de demanda, pricing assistido e heatmap"
    >
      {/* Browser chrome */}
      <div className="flex items-center gap-2 px-3 py-2 bg-slate-200 rounded-t-xl">
        <div className="flex gap-1.5" aria-hidden>
          <span className="w-3 h-3 rounded-full bg-red-400" />
          <span className="w-3 h-3 rounded-full bg-amber-400" />
          <span className="w-3 h-3 rounded-full bg-emerald-400" />
        </div>
        <div className="flex-1 mx-4 bg-white rounded-md px-3 py-1 text-xs text-slate-400 font-mono truncate">
          precivox.com.br/gestor/home
        </div>
      </div>

      <div className="bg-slate-50 rounded-b-xl p-4 space-y-3">
        {/* Header stats */}
        <div className="grid grid-cols-4 gap-2">
          {[
            { label: 'Produtos', val: '1.247' },
            { label: 'Atualizados', val: '89' },
            { label: 'Promoções', val: '34' },
            { label: 'Ruptura', val: '12' },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-lg p-2 border border-slate-200">
              <div className="text-lg font-bold text-slate-900">{s.val}</div>
              <div className="text-[10px] text-slate-500 uppercase tracking-wide">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Radar card */}
        <div className="bg-white rounded-xl border border-slate-200 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700">Radar de Demanda — 14 dias</span>
            <span className="text-[10px] bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              Ao vivo
            </span>
          </div>
          <div className="space-y-2">
            {[
              { termo: 'Leite integral', sinais: 87, pct: 100 },
              { termo: 'Arroz 5kg', sinais: 64, pct: 74 },
              { termo: 'Frango congelado', sinais: 41, pct: 47 },
              { termo: 'Café 500g', sinais: 28, pct: 32 },
            ].map((row) => (
              <div key={row.termo} className="flex items-center gap-2">
                <span className="text-[11px] text-slate-600 w-28 truncate">{row.termo}</span>
                <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-violet-500 rounded-full"
                    style={{ width: `${row.pct}%` }}
                  />
                </div>
                <span className="text-[10px] text-slate-400 w-6 text-right">{row.sinais}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-2 gap-2">
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">
              Pricing Assistido
            </div>
            <div className="text-xs text-slate-700">Arroz Camil 5kg</div>
            <div className="flex items-center gap-2 mt-1">
              <span className="text-sm font-bold text-red-600 line-through">R$ 24,90</span>
              <span className="text-sm font-bold text-emerald-600">R$ 22,50</span>
            </div>
            <div className="mt-2 text-[10px] bg-blue-50 text-blue-700 px-2 py-1 rounded-md">
              Benchmark: 8% acima da média regional
            </div>
          </div>
          <div className="bg-white rounded-xl border border-slate-200 p-3">
            <div className="text-[10px] font-semibold text-slate-500 uppercase mb-2">
              Saúde Catálogo
            </div>
            <div className="flex items-center gap-2">
              <div className="text-2xl font-bold text-amber-600">72%</div>
              <div className="text-[10px] text-slate-500 leading-tight">
                Freshness
                <br />
                <span className="text-amber-600">Reimport sugerido</span>
              </div>
            </div>
          </div>
        </div>

        {/* GROOC snippet */}
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-xl p-3 text-white">
          <div className="text-[10px] font-semibold uppercase opacity-80 mb-1">GROOC — Resumo</div>
          <p className="text-[11px] leading-relaxed opacity-95">
            Demanda de laticínios +23% esta semana. Considere promo em iogurte — 3 concorrentes já
            reduziram preço.
          </p>
        </div>
      </div>
    </div>
  );
}
