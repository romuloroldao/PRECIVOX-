/**
 * Custom Prisma Adapter para NextAuth
 * 
 * Este adapter customizado é necessário porque o schema.prisma usa snake_case
 * (user_id, session_token) mas o PrismaAdapter padrão espera camelCase.
 * 
 * Este adapter mapeia corretamente os campos entre NextAuth e Prisma.
 */

import { PrismaClient } from '@prisma/client';
import { Adapter, AdapterUser } from 'next-auth/adapters';

export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // Criar usuário
    async createUser(user) {
      const newUser = await prisma.usuarios.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          nome: user.name,
          email: user.email!,
          email_verified: user.emailVerified,
          imagem: user.image,
          senha_hash: null,
          role: 'CLIENTE',
          data_atualizacao: new Date(),
        },
      });
      
      return {
        id: newUser.id,
        name: newUser.nome || null,
        email: newUser.email,
        emailVerified: newUser.email_verified || null,
        image: newUser.imagem || null,
      } as AdapterUser;
    },

    // Buscar usuário por ID
    async getUser(id) {
      const user = await prisma.usuarios.findUnique({
        where: { id },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.email_verified || null,
        image: user.imagem || null,
      } as AdapterUser;
    },

    // Buscar usuário por email
    async getUserByEmail(email) {
      const user = await prisma.usuarios.findUnique({
        where: { email },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.email_verified || null,
        image: user.imagem || null,
      } as AdapterUser;
    },

    // Buscar usuário por account
    async getUserByAccount({ providerAccountId, provider }) {
      const account = await prisma.accounts.findUnique({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
        include: {
          usuarios: true,
        },
      });
      
      if (!account || !account.usuarios) return null;
      
      return {
        id: account.usuarios.id,
        name: account.usuarios.nome || null,
        email: account.usuarios.email,
        emailVerified: account.usuarios.email_verified || null,
        image: account.usuarios.imagem || null,
      } as AdapterUser;
    },

    // Atualizar usuário
    async updateUser({ id, ...data }) {
      const user = await prisma.usuarios.update({
        where: { id },
        data: {
          nome: data.name,
          email: data.email,
          email_verified: data.emailVerified,
          imagem: data.image,
          data_atualizacao: new Date(),
        },
      });
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.email_verified || null,
        image: user.imagem || null,
      } as AdapterUser;
    },

    // Deletar usuário
    async deleteUser(userId) {
      await prisma.usuarios.delete({
        where: { id: userId },
      });
    },

    // Linkar conta OAuth
    async linkAccount(account) {
      await prisma.accounts.create({
        data: {
          id: `account-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          user_id: account.userId,
          type: account.type,
          provider: account.provider,
          provider_account_id: account.providerAccountId,
          refresh_token: account.refresh_token,
          access_token: account.access_token,
          expires_at: account.expires_at,
          token_type: account.token_type,
          scope: account.scope,
          id_token: account.id_token,
          session_state: account.session_state,
        },
      });
    },

    // Deslinkar conta OAuth
    async unlinkAccount({ providerAccountId, provider }) {
      await prisma.accounts.delete({
        where: {
          provider_provider_account_id: {
            provider,
            provider_account_id: providerAccountId,
          },
        },
      });
    },

    // Criar sessão (apenas para strategy 'database')
    async createSession({ sessionToken, userId, expires }) {
      const session = await prisma.sessions.create({
        data: {
          id: `session-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          session_token: sessionToken,
          user_id: userId,
          expires,
        },
      });
      
      return {
        sessionToken: session.session_token,
        userId: session.user_id,
        expires: session.expires,
      };
    },

    // Buscar sessão e usuário (apenas para strategy 'database')
    async getSessionAndUser(sessionToken) {
      const sessionAndUser = await prisma.sessions.findUnique({
        where: { session_token: sessionToken },
        include: { usuarios: true },
      });
      
      if (!sessionAndUser) return null;
      
      return {
        session: {
          sessionToken: sessionAndUser.session_token,
          userId: sessionAndUser.user_id,
          expires: sessionAndUser.expires,
        },
        user: {
          id: sessionAndUser.usuarios.id,
          name: sessionAndUser.usuarios.nome || null,
          email: sessionAndUser.usuarios.email,
          emailVerified: sessionAndUser.usuarios.email_verified || null,
          image: sessionAndUser.usuarios.imagem || null,
        } as AdapterUser,
      };
    },

    // Atualizar sessão (apenas para strategy 'database')
    async updateSession({ sessionToken, ...data }) {
      const session = await prisma.sessions.update({
        where: { session_token: sessionToken },
        data: {
          expires: data.expires,
          user_id: data.userId,
        },
      });
      
      return {
        sessionToken: session.session_token,
        userId: session.user_id,
        expires: session.expires,
      };
    },

    // Deletar sessão (apenas para strategy 'database')
    async deleteSession(sessionToken) {
      await prisma.sessions.delete({
        where: { session_token: sessionToken },
      });
    },

    // Criar token de verificação
    async createVerificationToken({ identifier, expires, token }) {
      const verificationToken = await prisma.verification_tokens.create({
        data: {
          identifier,
          token,
          expires,
        },
      });
      
      return {
        identifier: verificationToken.identifier,
        token: verificationToken.token,
        expires: verificationToken.expires,
      };
    },

    // Usar token de verificação
    async useVerificationToken({ identifier, token }) {
      try {
        const verificationToken = await prisma.verification_tokens.delete({
          where: {
            identifier_token: {
              identifier,
              token,
            },
          },
        });
        
        return {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
          expires: verificationToken.expires,
        };
      } catch (error) {
        return null;
      }
    },
  };
}

