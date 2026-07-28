'use client';

import { useMemo, useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import {
  getClienteNavBarItems,
  isClienteNavActive,
} from '@/components/cliente/cliente-nav-items';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';
import { ScannerFab } from '@/components/cliente/ScannerFab';

/**
 * Navegação inferior persistente (mobile).
 * Dual-shell: legada (5 abas) ou AI-Native (4 abas + FAB Scanner).
 */
export default function BottomNav() {
  const pathname = usePathname() || '';
  const [aiNative, setAiNative] = useState(false);

  useEffect(() => {
    setAiNative(isAiNativeShellEnabled());
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (aiNative) {
      root.style.setProperty(
        '--cliente-content-pad-bottom',
        'calc(var(--cliente-bottom-nav-height) + 4.5rem)'
      );
    } else {
      root.style.setProperty(
        '--cliente-content-pad-bottom',
        'calc(var(--cliente-bottom-nav-height) + 1rem)'
      );
    }
    return () => {
      root.style.removeProperty('--cliente-content-pad-bottom');
    };
  }, [aiNative]);

  const items = useMemo(() => getClienteNavBarItems(aiNative), [aiNative]);
  const onScanPage = pathname.startsWith('/cliente/scan');

  return (
    <>
      {aiNative && <ScannerFab />}

      <nav
        aria-label="Navegação principal"
        className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 backdrop-blur md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
      >
        <ul
          className={cn(
            'mx-auto flex max-w-lg items-stretch',
            aiNative ? 'justify-between px-1' : 'justify-around'
          )}
        >
          {aiNative ? (
            <>
              {items.slice(0, 2).map((item) => (
                <NavSlot key={item.href} item={item} pathname={pathname} />
              ))}
              {/* Espaço central para o FAB (mantém alinhamento mesmo na página scan) */}
              <li className={cn('w-14 shrink-0', onScanPage && 'invisible')} aria-hidden />
              {items.slice(2).map((item) => (
                <NavSlot key={item.href} item={item} pathname={pathname} />
              ))}
            </>
          ) : (
            items.map((item) => <NavSlot key={item.href} item={item} pathname={pathname} />)
          )}
        </ul>
      </nav>
    </>
  );
}

function NavSlot({
  item,
  pathname,
}: {
  item: ReturnType<typeof getClienteNavBarItems>[number];
  pathname: string;
}) {
  const active = isClienteNavActive(pathname, item);
  const Icon = item.icon;
  return (
    <li className="flex-1">
      <Link
        href={item.href}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex min-h-[56px] flex-col items-center justify-center gap-1 px-1 py-2 text-[11px] font-medium transition-colors',
          active ? 'text-primary-600' : 'text-slate-500 hover:text-slate-800'
        )}
      >
        <Icon className={cn('h-6 w-6', active && 'stroke-[2.5]')} aria-hidden />
        <span className="leading-none">{item.label}</span>
      </Link>
    </li>
  );
}
