'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';

/**
 * Redirects canônicos do shell cliente.
 * `/cliente/home` → Casa / Agora (destino pós-login).
 */
export function AiNativeCanonicalRedirects() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (pathname === '/cliente/home' || pathname === '/cliente/home/') {
      router.replace('/cliente/casa');
    }
  }, [pathname, router]);

  return null;
}
