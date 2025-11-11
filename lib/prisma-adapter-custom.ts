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
      const newUser = await prisma.user.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          nome: user.name,
          email: user.email!,
          emailVerified: user.emailVerified,
          imagem: user.image,
          senhaHash: null,
          role: 'CLIENTE',
          dataAtualizacao: new Date(),
        },
      });
      
      return {
        id: newUser.id,
        name: newUser.nome || null,
        email: newUser.email,
        emailVerified: newUser.emailVerified || null,
        image: newUser.imagem || null,
      } as AdapterUser;
    },

    // Buscar usuário por ID
    async getUser(id) {
      const user = await prisma.user.findUnique({
        where: { id },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.imagem || null,
      } as AdapterUser;
    },

    // Buscar usuário por email
    async getUserByEmail(email) {
      const user = await prisma.user.findUnique({
        where: { email },
      });
      
      if (!user) return null;
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.emailVerified || null,
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
          user: true,
        },
      });
      
      if (!account || !account.user) return null;
      
      return {
        id: account.user.id,
        name: account.user.nome || null,
        email: account.user.email,
        emailVerified: account.user.emailVerified || null,
        image: account.user.imagem || null,
      } as AdapterUser;
    },

    // Atualizar usuário
    async updateUser({ id, ...data }) {
      const user = await prisma.user.update({
        where: { id },
        data: {
          nome: data.name,
          email: data.email,
          emailVerified: data.emailVerified,
          imagem: data.image,
          dataAtualizacao: new Date(),
        },
      });
      
      return {
        id: user.id,
        name: user.nome || null,
        email: user.email,
        emailVerified: user.emailVerified || null,
        image: user.imagem || null,
      } as AdapterUser;
    },

    // Deletar usuário
    async deleteUser(userId) {
      await prisma.user.delete({
        where: { id: userId },
      });
    },

    // Linkar conta OAuth
    async linkAccount(account) {
      await prisma.accounts.create({
        data: {
          id: `account-${Date.now()}-${Math.random().toString(36).substring(7)}`,
          userId: account.userId,
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
          sessionToken,
          userId,
          expires,
        },
      });
      
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    // Buscar sessão e usuário (apenas para strategy 'database')
    async getSessionAndUser(sessionToken) {
      const sessionAndUser = await prisma.sessions.findUnique({
        where: { sessionToken },
        include: { user: true },
      });
      
      if (!sessionAndUser) return null;
      
      return {
        session: {
          sessionToken: sessionAndUser.sessionToken,
          userId: sessionAndUser.userId,
          expires: sessionAndUser.expires,
        },
        user: {
          id: sessionAndUser.user.id,
          name: sessionAndUser.user.nome || null,
          email: sessionAndUser.user.email,
          emailVerified: sessionAndUser.user.emailVerified || null,
          image: sessionAndUser.user.imagem || null,
        } as AdapterUser,
      };
    },

    // Atualizar sessão (apenas para strategy 'database')
    async updateSession({ sessionToken, ...data }) {
      const session = await prisma.sessions.update({
        where: { sessionToken },
        data: {
          expires: data.expires,
          userId: data.userId,
        },
      });
      
      return {
        sessionToken: session.sessionToken,
        userId: session.userId,
        expires: session.expires,
      };
    },

    // Deletar sessão (apenas para strategy 'database')
    async deleteSession(sessionToken) {
      await prisma.sessions.delete({
        where: { sessionToken },
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

