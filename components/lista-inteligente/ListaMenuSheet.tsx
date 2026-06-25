'use client';

import { Plus, Trash2, ListOrdered, Pencil } from 'lucide-react';
import { BottomSheet } from '@/components/ui';
import { UX } from '@/lib/ux-copy';
import type { ListaSalva } from '@/app/context/ListaContext';

interface ListaMenuSheetProps {
  isOpen: boolean;
  onClose: () => void;
  listasSalvas: ListaSalva[];
  listaAtivaId: string | null;
  onSelecionarLista: (id: string) => void;
  onCriarNova: () => void;
  onRenomear: () => void;
  onEsvaziar: () => void;
  onDeletarLista: (id: string) => void;
}

export function ListaMenuSheet({
  isOpen,
  onClose,
  listasSalvas,
  listaAtivaId,
  onSelecionarLista,
  onCriarNova,
  onRenomear,
  onEsvaziar,
  onDeletarLista,
}: ListaMenuSheetProps) {
  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Opções da lista" id="lista-menu-sheet">
      <div className="space-y-2">
        <button
          type="button"
          onClick={() => {
            onRenomear();
            onClose();
          }}
          className="flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Pencil className="h-5 w-5 text-slate-500" />
          {UX.lista.renomear}
        </button>

        {listasSalvas.length > 1 && (
          <div className="rounded-xl border border-slate-200 p-2">
            <p className="mb-2 px-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              {UX.lista.trocarLista}
            </p>
            {listasSalvas.map((lista) => (
              <button
                key={lista.id}
                type="button"
                onClick={() => {
                  onSelecionarLista(lista.id);
                  onClose();
                }}
                className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm ${
                  lista.id === listaAtivaId
                    ? 'bg-primary-600 text-white'
                    : 'hover:bg-slate-50'
                }`}
              >
                <span className="flex items-center gap-2 truncate">
                  <ListOrdered className="h-4 w-4 shrink-0" />
                  {lista.nome}
                </span>
                <span className={`text-xs ${lista.id === listaAtivaId ? 'text-white/80' : 'text-slate-500'}`}>
                  {lista.itens.length} itens
                </span>
              </button>
            ))}
          </div>
        )}

        <button
          type="button"
          onClick={() => {
            onCriarNova();
            onClose();
          }}
          className="flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-slate-800 hover:bg-slate-50"
        >
          <Plus className="h-5 w-5 text-slate-500" />
          Nova lista
        </button>

        <button
          type="button"
          onClick={() => {
            onEsvaziar();
            onClose();
          }}
          className="flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-left text-sm font-medium text-red-600 hover:bg-red-50"
        >
          <Trash2 className="h-5 w-5" />
          {UX.lista.esvaziar}
        </button>

        <a
          href="/cliente/listas"
          className="flex w-full min-h-[48px] items-center gap-3 rounded-xl px-3 py-3 text-sm font-medium text-primary-600 hover:bg-primary-50"
        >
          <ListOrdered className="h-5 w-5" />
          {UX.lista.verTodas}
        </a>
      </div>
    </BottomSheet>
  );
}
