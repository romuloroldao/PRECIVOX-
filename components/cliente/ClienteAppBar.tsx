'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useSession } from '@/lib/hooks/useUnifiedSession';
import { LogOut, ScanLine } from 'lucide-react';
import Logo from '@/components/Logo';
import { fullLogout, LOGOUT_REDIRECT } from '@/lib/logout-client';
import { cn } from '@/lib/utils';
import {
  getClienteNavBarItems,
  getClienteScanHref,
  isClienteNavActive,
} from '@/components/cliente/cliente-nav-items';
import { clienteHomeHref, isAiNativeShellEnabled } from '@/lib/ai-native-shell';
import { UX } from '@/lib/ux-copy';

export function ClienteAppBar() {
  const pathname = usePathname() || '';
  const { data: session } = useSession();
  const user = session?.user;
  const displayName = (user as { nome?: string } | undefined)?.nome || user?.name;
  const [aiNative, setAiNative] = useState(false);

  useEffect(() => {
    setAiNative(isAiNativeShellEnabled());
  }, []);

  const navItems = useMemo(() => getClienteNavBarItems(aiNative), [aiNative]);
  const logoHref = clienteHomeHref(aiNative);

  const handleLogout = async () => {
    try {
      await fullLogout(LOGOUT_REDIRECT);
    } catch {
      window.location.replace(LOGOUT_REDIRECT);
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 sm:gap-4 sm:px-6">
        <Logo height={30} href={logoHref} className="shrink-0" />

        <nav
          aria-label="Navegação principal"
          className="hidden min-w-0 flex-1 items-center justify-center gap-0.5 md:flex"
        >
          {navItems.map((item) => {
            const active = isClienteNavActive(pathname, item);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                  active
                    ? 'bg-primary-50 text-primary-700'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                )}
              >
                <Icon className={cn('h-4 w-4', active && 'stroke-[2.5]')} aria-hidden />
                {item.label}
              </Link>
            );
          })}
          {aiNative && (
            <Link
              href={getClienteScanHref()}
              className={cn(
                'inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                pathname.startsWith('/cliente/scan')
                  ? 'bg-primary-50 text-primary-700'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              )}
            >
              <ScanLine className="h-4 w-4" aria-hidden />
              {UX.nav.scanner}
            </Link>
          )}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          {displayName && (
            <span
              className="hidden max-w-[140px] truncate text-xs text-slate-500 sm:block lg:max-w-[180px] lg:text-sm"
              title={displayName}
            >
              {displayName}
            </span>
          )}
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center gap-1.5 rounded-lg px-2.5 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 sm:px-3"
            aria-label="Sair da conta"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
}
