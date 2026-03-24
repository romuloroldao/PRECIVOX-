'use client';

import { useEffect, useState } from 'react';

/**
 * Hook para breakpoints (mobile-first). SSR: false até hidratar.
 */
export function useMediaQuery(query: string): boolean {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const m = window.matchMedia(query);
    const onChange = () => setMatches(m.matches);
    onChange();
    m.addEventListener('change', onChange);
    return () => m.removeEventListener('change', onChange);
  }, [query]);

  return matches;
}

/** lg breakpoint Tailwind (1024px) */
export function useIsDesktopLg() {
  return useMediaQuery('(min-width: 1024px)');
}
