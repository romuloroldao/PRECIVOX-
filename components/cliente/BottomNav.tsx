'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { CLIENTE_NAV_ITEMS, isClienteNavActive } from '@/components/cliente/cliente-nav-items';

/**
 * Navegação inferior persistente, pensada primeiro para o celular.
 * Alvos de toque ≥ 56px, rótulos curtos e respeito à safe-area do iOS.
 * Oculta em telas grandes (md+), onde a navegação lateral assume.
 */
export default function BottomNav() {
  const pathname = usePathname() || '';

  return (
    <nav
      aria-label="Navegação principal"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <ul className="mx-auto flex max-w-lg items-stretch justify-around">
        {CLIENTE_NAV_ITEMS.map((item) => {
          const active = isClienteNavActive(pathname, item);
          const Icon = item.icon;
          return (
            <li key={item.href} className="flex-1">
              <Link
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors',
                  active ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
                )}
              >
                <Icon
                  className={cn('h-6 w-6', active && 'stroke-[2.5]')}
                  aria-hidden
                />
                <span className="leading-none">{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
