// Tipos estendidos para NextAuth
import { DefaultSession, DefaultUser } from 'next-auth';
import { Role } from '@prisma/client';

declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: Role;
      nome: string;
      imagem?: string | null;
    } & DefaultSession['user'];
  }

  interface User extends DefaultUser {
    role: Role;
    nome: string;
    imagem?: string | null;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    role: Role;
    nome: string;
    imagem?: string | null;
  }
}

