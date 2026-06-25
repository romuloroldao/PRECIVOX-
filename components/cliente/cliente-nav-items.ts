import { Home, Search, ListChecks, Package, User, type LucideIcon } from 'lucide-react';

export type ClienteNavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Casa marca como ativo apenas no match exato; demais usam prefixo. */
  exact?: boolean;
};

export const CLIENTE_NAV_ITEMS: ClienteNavItem[] = [
  { href: '/cliente/home', label: 'Início', icon: Home, exact: true },
  { href: '/cliente/busca', label: 'Buscar', icon: Search },
  { href: '/cliente/listas', label: 'Listas', icon: ListChecks },
  { href: '/cliente/despensa', label: 'Despensa', icon: Package },
  { href: '/cliente/perfil', label: 'Perfil', icon: User },
];

export function isClienteNavActive(pathname: string, item: ClienteNavItem): boolean {
  if (item.exact) return pathname === item.href;
  return pathname === item.href || pathname.startsWith(`${item.href}/`);
}
