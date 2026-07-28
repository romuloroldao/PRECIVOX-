'use client';

import Link from 'next/link';
import {
  ChevronRight,
  User,
  Users,
  Store,
  Search,
  ListChecks,
  ScanLine,
} from 'lucide-react';
import { ClientePage } from '@/components/cliente/ClientePage';
import { UX } from '@/lib/ux-copy';

const PREFS = [
  { href: '/cliente/perfil', label: UX.mais.perfilPrefs, icon: User },
  { href: '/cliente/familia', label: UX.mais.familia, icon: Users },
] as const;

const ATALHOS = [
  { href: '/cliente/mercado-vivo', label: UX.mais.mercadoVivo, icon: Store },
  { href: '/cliente/busca', label: UX.mais.busca, icon: Search },
  { href: '/cliente/listas', label: UX.mais.listas, icon: ListChecks },
  { href: '/cliente/scan', label: UX.mais.scan, icon: ScanLine },
] as const;

/** Aba Mais — PRECI fora da nav primária (Fase 7). */
export default function ClienteMaisPage() {
  return (
    <ClientePage title={UX.mais.titulo} description={UX.mais.subtitulo}>
      <div className="mx-auto max-w-lg space-y-6">
        <NavGroup title={UX.mais.secaoPrefs} items={PREFS} />
        <NavGroup title={UX.mais.secaoAtalhos} items={ATALHOS} />
      </div>
    </ClientePage>
  );
}

function NavGroup({
  title,
  items,
}: {
  title: string;
  items: ReadonlyArray<{ href: string; label: string; icon: typeof User }>;
}) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-xs font-semibold uppercase tracking-wide text-slate-500">
        {title}
      </h2>
      <ul className="divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              className="flex min-h-[56px] items-center gap-3 px-4 py-3 text-sm font-medium text-slate-800 transition-colors hover:bg-slate-50"
            >
              <Icon className="h-5 w-5 shrink-0 text-slate-500" aria-hidden />
              <span className="flex-1">{label}</span>
              <ChevronRight className="h-4 w-4 text-slate-300" aria-hidden />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
