'use client';

import { Filter, X } from 'lucide-react';
import { BottomSheet, SegmentedControl } from '@/components/ui';
import { UX, type OrdenacaoBusca } from '@/lib/ux-copy';
import { MercadoSelector } from '@/components/cliente/MercadoSelector';

export interface BuscaFiltrosState {
  categoria: string;
  marca: string;
  precoMin: string;
  precoMax: string;
  emPromocao: boolean | undefined;
  disponivel: boolean | undefined;
  mercadoFiltro: string;
  ordenacao: OrdenacaoBusca;
  modoComparativo: boolean;
  modoVisual: 'cards' | 'lista';
}

interface BuscaFiltrosSheetProps {
  isOpen: boolean;
  onClose: () => void;
  filtros: BuscaFiltrosState;
  onChange: (patch: Partial<BuscaFiltrosState>) => void;
  onLimpar: () => void;
  temFiltros: boolean;
}

export function BuscaFiltrosSheet({
  isOpen,
  onClose,
  filtros,
  onChange,
  onLimpar,
  temFiltros,
}: BuscaFiltrosSheetProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title={UX.busca.filtros}
      id="busca-filtros-sheet"
      maxHeight="92vh"
    >
      <div className="space-y-5">
        {/* Modo de visualização */}
        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Como ver os resultados</p>
          <SegmentedControl
            aria-label="Modo de visualização"
            value={filtros.modoComparativo ? 'comparar' : 'produtos'}
            onChange={(v) => onChange({ modoComparativo: v === 'comparar' })}
            options={[
              { value: 'comparar', label: UX.busca.compararPrecos },
              { value: 'produtos', label: 'Melhor preço' },
            ]}
          />
        </div>

        <div>
          <p className="mb-2 text-sm font-medium text-text-primary">Formato</p>
          <SegmentedControl
            aria-label="Formato da lista"
            value={filtros.modoVisual}
            onChange={(v) => onChange({ modoVisual: v })}
            options={[
              { value: 'cards', label: 'Cards' },
              { value: 'lista', label: 'Lista' },
            ]}
          />
        </div>

        {/* Ordenação */}
        <div>
          <label htmlFor="ordenacao" className="mb-2 block text-sm font-medium text-text-primary">
            {UX.busca.ordenar}
          </label>
          <select
            id="ordenacao"
            value={filtros.ordenacao}
            onChange={(e) => onChange({ ordenacao: e.target.value as OrdenacaoBusca })}
            className="w-full rounded-lg border border-slate-200 px-3 py-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
          >
            <option value="hibrido">{UX.busca.ordenacao.hibrido}</option>
            <option value="preco_asc">{UX.busca.ordenacao.preco_asc}</option>
            <option value="nome">{UX.busca.ordenacao.nome}</option>
          </select>
        </div>

        {/* Mercado */}
        <MercadoSelector
          value={filtros.mercadoFiltro}
          onChange={(v) => onChange({ mercadoFiltro: v })}
        />

        {/* Marca e preço */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="marca" className="mb-1 block text-sm font-medium text-gray-700">
              Marca
            </label>
            <input
              id="marca"
              type="text"
              value={filtros.marca}
              onChange={(e) => onChange({ marca: e.target.value })}
              placeholder="Ex: Nestlé"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div>
            <label htmlFor="precoMin" className="mb-1 block text-sm font-medium text-gray-700">
              Preço mínimo
            </label>
            <input
              id="precoMin"
              type="number"
              value={filtros.precoMin}
              onChange={(e) => onChange({ precoMin: e.target.value })}
              placeholder="R$ 0,00"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
          <div className="sm:col-span-2">
            <label htmlFor="precoMax" className="mb-1 block text-sm font-medium text-gray-700">
              Preço máximo
            </label>
            <input
              id="precoMax"
              type="number"
              value={filtros.precoMax}
              onChange={(e) => onChange({ precoMax: e.target.value })}
              placeholder="R$ 1000,00"
              step="0.01"
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
            />
          </div>
        </div>

        {/* Checkboxes */}
        <div className="space-y-3">
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={filtros.emPromocao === true}
              onChange={(e) => onChange({ emPromocao: e.target.checked ? true : undefined })}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Apenas em promoção</span>
          </label>
          <label className="flex min-h-[44px] cursor-pointer items-center gap-3">
            <input
              type="checkbox"
              checked={filtros.disponivel === true}
              onChange={(e) => onChange({ disponivel: e.target.checked ? true : undefined })}
              className="h-5 w-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">Apenas disponíveis</span>
          </label>
        </div>

        {/* Ações */}
        <div className="flex gap-2 border-t border-slate-200 pt-4">
          {temFiltros && (
            <button
              type="button"
              onClick={onLimpar}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              <X className="h-4 w-4" />
              {UX.busca.limparFiltros}
            </button>
          )}
          <button
            type="button"
            onClick={onClose}
            className="flex flex-1 items-center justify-center gap-1.5 rounded-xl bg-primary-600 py-3 text-sm font-semibold text-white hover:bg-primary-700"
          >
            <Filter className="h-4 w-4" />
            Aplicar
          </button>
        </div>
      </div>
    </BottomSheet>
  );
}
