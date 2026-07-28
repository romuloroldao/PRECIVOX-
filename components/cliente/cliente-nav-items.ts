import {
  Home,
  Search,
  ListChecks,
  Package,
  User,
  ShoppingCart,
  MoreHorizontal,
  ScanLine,
  type LucideIcon,
} from 'lucide-react';
import { UX } from '@/lib/ux-copy';
import { isAiNativeShellEnabled } from '@/lib/ai-native-shell';

export type ClienteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Match exato no pathname (sem prefixo). */
  exact?: boolean;
  /** Slot reservado ao FAB Scanner (não renderiza como Link na barra). */
  fab?: boolean;
};

/** Nav legada (páginas). */
export const CLIENTE_NAV_ITEMS_LEGACY: ClienteNavItem[] = [
  { href: '/cliente/home', label: UX.nav.inicio, icon: Home, exact: true },
  { href: '/cliente/busca', label: UX.nav.buscar, icon: Search },
  { href: '/cliente/listas', label: UX.nav.listas, icon: ListChecks },
  { href: '/cliente/despensa', label: UX.nav.despensa, icon: Package },
  { href: '/cliente/perfil', label: UX.nav.perfil, icon: User },
];

/**
 * Nav AI-Native: Casa · Compra · (FAB Scanner) · Despensa · Mais
 * Scanner é FAB — não entra como 5º link linear.
 */
export const CLIENTE_NAV_ITEMS_AI_NATIVE: ClienteNavItem[] = [
  { href: '/cliente/casa', label: UX.nav.casa, icon: Home, exact: true },
  { href: '/cliente/compra', label: UX.nav.compra, icon: ShoppingCart },
  { href: '/cliente/scan', label: UX.nav.scanner, icon: ScanLine, fab: true },
  { href: '/cliente/despensa', label: UX.nav.despensa, icon: Package },
  { href: '/cliente/mais', label: UX.nav.mais, icon: MoreHorizontal },
];

/** @deprecated Prefer getClienteNavItems() — mantido para imports existentes. */
export const CLIENTE_NAV_ITEMS = CLIENTE_NAV_ITEMS_LEGACY;

export function getClienteNavItems(aiNative = isAiNativeShellEnabled()): ClienteNavItem[] {
  return aiNative ? CLIENTE_NAV_ITEMS_AI_NATIVE : CLIENTE_NAV_ITEMS_LEGACY;
}

/** Itens da barra (sem FAB). */
export function getClienteNavBarItems(aiNative = isAiNativeShellEnabled()): ClienteNavItem[] {
  return getClienteNavItems(aiNative).filter((i) => !i.fab);
}

export function getClienteScanHref(): string {
  return '/cliente/scan';
}

export function isClienteNavActive(pathname: string, item: ClienteNavItem): boolean {
  if (item.exact) {
    if (item.href === '/cliente/casa') {
      return pathname === '/cliente/casa' || pathname === '/cliente/home';
    }
    return pathname === item.href;
  }
  if (item.href === '/cliente/compra') {
    return (
      pathname === '/cliente/compra' ||
      pathname === '/cliente/listas' ||
      pathname.startsWith('/cliente/listas/')
    );
  }
  if (item.href === '/cliente/mais') {
    return (
      pathname === '/cliente/mais' ||
      pathname === '/cliente/perfil' ||
      pathname.startsWith('/cliente/familia') ||
      pathname.startsWith('/cliente/mercado-vivo') ||
      pathname.startsWith('/cliente/referral') ||
      pathname.startsWith('/cliente/alertas') ||
      pathname.startsWith('/cliente/relatorios')
    );
  }
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
