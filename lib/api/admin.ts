/**
 * Funções helper para APIs Admin
 * Todas incluem credentials: 'include' para garantir envio de cookies
 */

export interface AdminStats {
  success: true;
  data: {
    users: number;
    markets: number;
    products: number;
  };
}

export interface AdminUser {
  id: string;
  nome: string | null;
  email: string;
  role: 'CLIENTE' | 'GESTOR' | 'ADMIN';
  dataCriacao: Date;
  ultimoLogin: Date | null;
}

export interface AdminUsersResponse {
  success: true;
  data: AdminUser[];
}

/**
 * Buscar estatísticas do admin
 */
export async function fetchAdminStats(): Promise<AdminStats> {
  const res = await fetch('/api/admin/stats', {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Buscar usuários recentes
 */
export async function fetchRecentUsers(): Promise<AdminUsersResponse> {
  const res = await fetch('/api/admin/recent-users', {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Buscar usuários (com filtro opcional por role)
 */
export async function fetchUsers(role?: 'CLIENTE' | 'GESTOR' | 'ADMIN'): Promise<AdminUsersResponse> {
  const url = role 
    ? `/api/admin/users?role=${role}`
    : '/api/admin/users';

  const res = await fetch(url, {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Criar novo usuário
 */
export async function createUser(data: {
  nome: string;
  email: string;
  senha: string;
  role: 'CLIENTE' | 'GESTOR' | 'ADMIN';
}): Promise<{ success: true; data: AdminUser }> {
  const res = await fetch('/api/admin/users', {
    method: 'POST',
    credentials: 'include', // ✅ ESSENCIAL
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Buscar usuário por ID
 */
export async function fetchUserById(userId: string): Promise<{ success: true; data: AdminUser }> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'GET',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Atualizar usuário
 */
export async function updateUser(
  userId: string,
  data: Partial<Pick<AdminUser, 'nome' | 'email' | 'role'>>
): Promise<{ success: true; data: AdminUser }> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    credentials: 'include', // ✅ ESSENCIAL
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

/**
 * Deletar usuário
 */
export async function deleteUser(userId: string): Promise<void> {
  const res = await fetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    credentials: 'include' // ✅ ESSENCIAL
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }
}

/**
 * Atualizar role do usuário
 */
export async function updateUserRole(
  userId: string,
  role: 'CLIENTE' | 'GESTOR' | 'ADMIN'
): Promise<{ success: true; data: AdminUser }> {
  const res = await fetch(`/api/admin/users/${userId}/role`, {
    method: 'PATCH',
    credentials: 'include', // ✅ ESSENCIAL
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ role }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: 'Erro desconhecido' }));
    throw new Error(error.error || `Erro ${res.status}`);
  }

  return res.json();
}

