export type Role = 'ADMIN' | 'GESTOR' | 'CLIENTE';

export type AuthUser = {
  id: string;
  email: string;
  role: Role;
  nome?: string | null;
};

export type AuthResult =
  | { status: 'authorized'; user: AuthUser }
  | { status: 'unauthenticated' }
  | { status: 'forbidden' };

