'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Package,
  Sparkles,
  BarChart3,
  ShoppingCart,
  Tag,
  LineChart,
} from 'lucide-react';

const NAV_ITEMS: {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: (pathname: string) => boolean;
}[] = [
  {
    href: '/gestor/home',
    label: 'Início',
    icon: LayoutDashboard,
    isActive: (p) => p === '/gestor/home',
  },
  {
    href: '/gestor/produtos',
    label: 'Produtos',
    icon: Package,
    isActive: (p) => p.startsWith('/gestor/produtos'),
  },
  {
    href: '/gestor/ia',
    label: 'Painel IA',
    icon: Sparkles,
    isActive: (p) => p === '/gestor/ia',
  },
  {
    href: '/gestor/ia/dashboard',
    label: 'Métricas IA',
    icon: BarChart3,
    isActive: (p) => p.startsWith('/gestor/ia/dashboard'),
  },
  {
    href: '/gestor/ia/compras',
    label: 'Compras',
    icon: ShoppingCart,
    isActive: (p) => p.startsWith('/gestor/ia/compras'),
  },
  {
    href: '/gestor/ia/promocoes',
    label: 'Promoções',
    icon: Tag,
    isActive: (p) => p.startsWith('/gestor/ia/promocoes'),
  },
  {
    href: '/gestor/ia/conversao',
    label: 'Conversão',
    icon: LineChart,
    isActive: (p) => p.startsWith('/gestor/ia/conversao'),
  },
];

export function GestorNav() {
  const pathname = usePathname() || '';

  return (
    <nav
      className="border-b border-emerald-200/80 bg-gradient-to-r from-emerald-50/90 to-slate-50/80"
      aria-label="Navegação do gestor"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex gap-1 overflow-x-auto pb-0 pt-1 [-webkit-overflow-scrolling:touch]">
          {NAV_ITEMS.map(({ href, label, icon: Icon, isActive }) => {
            const active = isActive(pathname);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  'flex shrink-0 items-center gap-1.5 whitespace-nowrap rounded-t-lg px-3 py-2.5 text-sm font-medium transition-colors',
                  active
                    ? 'bg-white text-emerald-800 shadow-sm ring-1 ring-emerald-200/80'
                    : 'text-gray-600 hover:bg-white/70 hover:text-gray-900'
                )}
              >
                <Icon className={cn('h-4 w-4 shrink-0', active ? 'text-emerald-600' : 'text-gray-400')} />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
