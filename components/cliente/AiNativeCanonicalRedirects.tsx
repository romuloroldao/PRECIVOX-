'use client';

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';

/**
 * Redirects canônicos com shell AI-Native (Fase 9 — soft deprecate).
 * Nav legada permanece no código até piloto estável; só redireciona bookmarks.
 */
export function AiNativeCanonicalRedirects() {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (!isAiNativeShellEnabled()) return;
    if (pathname === '/cliente/home' || pathname === '/cliente/home/') {
      router.replace('/cliente/casa');
    }
  }, [pathname, router]);

  return null;
}
