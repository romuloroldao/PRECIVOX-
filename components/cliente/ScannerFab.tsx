'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ScanLine } from 'lucide-react';
import { cn } from '@/lib/utils';
import { UX } from '@/lib/ux-copy';
import { buildScanHref } from '@/lib/cliente-mercado-ref';
import { useEffect, useState } from 'react';

/**
 * FAB Scanner global — sempre a 1 toque (Zero Friction Regra 6).
 * Oculto na própria página de scan e no desktop (AppBar cobre).
 */
export function ScannerFab({
  className,
  mercadoId,
}: {
  className?: string;
  mercadoId?: string | null;
}) {
  const pathname = usePathname() || '';
  const [href, setHref] = useState('/cliente/scan');

  useEffect(() => {
    setHref(buildScanHref(mercadoId));
  }, [mercadoId, pathname]);

  if (pathname.startsWith('/cliente/scan')) {
    return null;
  }

  return (
    <Link
      href={href}
      aria-label={UX.nav.scanner}
      className={cn(
        'fixed z-50 flex h-14 w-14 items-center justify-center rounded-full',
        'bg-primary-600 text-white shadow-lg shadow-primary-600/30',
        'transition-transform hover:scale-105 active:scale-95',
        'focus:outline-none focus-visible:ring-2 focus-visible:ring-primary-500 focus-visible:ring-offset-2',
        'left-1/2 -translate-x-1/2 md:hidden',
        className
      )}
      style={{ bottom: 'var(--cliente-fab-bottom)' }}
    >
      <ScanLine className="h-7 w-7" aria-hidden />
    </Link>
  );
}
