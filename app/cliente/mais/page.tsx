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

const LINKS = [
  { href: '/cliente/perfil', label: UX.mais.perfilPrefs, icon: User },
  { href: '/cliente/familia', label: UX.mais.familia, icon: Users },
  { href: '/cliente/mercado-vivo', label: UX.mais.mercadoVivo, icon: Store },
  { href: '/cliente/busca', label: UX.mais.busca, icon: Search },
  { href: '/cliente/listas', label: UX.mais.listas, icon: ListChecks },
  { href: '/cliente/scan', label: UX.mais.scan, icon: ScanLine },
] as const;

/** Aba Mais — conta, prefs e atalhos (Perfil PRECI fora da nav primária). */
export default function ClienteMaisPage() {
  return (
    <ClientePage title={UX.mais.titulo} description={UX.mais.subtitulo}>
      <ul className="mx-auto max-w-lg divide-y divide-slate-100 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        {LINKS.map(({ href, label, icon: Icon }) => (
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
    </ClientePage>
  );
}
