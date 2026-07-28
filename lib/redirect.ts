// Utilitários de redirecionamento
type Role = "ADMIN" | "GESTOR" | "CLIENTE";

/**
 * Retorna a URL do dashboard apropriada baseada no role do usuário
 */
export function getDashboardUrl(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return '/admin/dashboard';
    case 'GESTOR':
      return '/gestor/home';
    case 'CLIENTE':
      return '/cliente/casa';
    default:
      return '/cliente/casa';
  }
}

/**
 * Mapeia o role para uma descrição legível
 */
export function getRoleLabel(role: Role): string {
  switch (role) {
    case 'ADMIN':
      return 'Administrador';
    case 'GESTOR':
      return 'Gestor';
    case 'CLIENTE':
      return 'Cliente';
    default:
      return 'Usuário';
  }
}

