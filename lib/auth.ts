import { NextAuthOptions } from 'next-auth';
import { CustomPrismaAdapter } from './prisma-adapter-custom';
import CredentialsProvider from 'next-auth/providers/credentials';
import GoogleProvider from 'next-auth/providers/google';
import FacebookProvider from 'next-auth/providers/facebook';
import LinkedInProvider from 'next-auth/providers/linkedin';
// import AppleProvider from 'next-auth/providers/apple';
import { prisma } from './prisma';
import bcrypt from 'bcryptjs';
import { getDashboardUrl } from './redirect';

export const authOptions: NextAuthOptions = {
  adapter: CustomPrismaAdapter(prisma),
  providers: [
    // Credentials Provider (Email + Senha)
    CredentialsProvider({
      id: 'credentials',
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        senha: { label: 'Senha', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.senha) {
          throw new Error('Email e senha são obrigatórios');
        }

        // Buscar usuário
        const usuario = await prisma.usuarios.findUnique({
          where: { email: credentials.email },
        });

        if (!usuario || !usuario.senha_hash) {
          throw new Error('Credenciais inválidas');
        }

        // Verificar senha
        const senhaValida = await bcrypt.compare(
          credentials.senha,
          usuario.senha_hash
        );

        if (!senhaValida) {
          throw new Error('Credenciais inválidas');
        }

        // Atualizar último login
        await prisma.usuarios.update({
          where: { id: usuario.id },
          data: { ultimo_login: new Date() },
        });

        return {
          id: usuario.id,
          email: usuario.email,
          name: usuario.nome,
          image: usuario.imagem,
          role: usuario.role,
        } as any;
      },
    }),

    // Google Provider
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || '',
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // Facebook Provider
    FacebookProvider({
      clientId: process.env.FACEBOOK_CLIENT_ID || '',
      clientSecret: process.env.FACEBOOK_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),

    // LinkedIn Provider
    LinkedInProvider({
      clientId: process.env.LINKEDIN_CLIENT_ID || '',
      clientSecret: process.env.LINKEDIN_CLIENT_SECRET || '',
      allowDangerousEmailAccountLinking: true,
    }),
  ],

  pages: {
    signIn: '/login',
    error: '/login',
  },

  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60, // 7 dias
    updateAge: 24 * 60 * 60, // Atualizar sessão a cada 24 horas
  },

  // Configurações para evitar loops
  useSecureCookies: process.env.NODE_ENV === 'production',
  cookies: {
    sessionToken: {
      name: `${process.env.NODE_ENV === 'production' ? '__Secure-' : ''}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: 'lax',
        path: '/',
        secure: process.env.NODE_ENV === 'production',
      },
    },
  },

  callbacks: {
    async signIn({ user, account, profile }) {
      // Permitir login
      if (!user.email) {
        return false;
      }
      
      try {
        // Para login social, criar ou atualizar usuário
        if (account?.provider !== 'credentials') {
          const existingUser = await prisma.usuarios.findUnique({
            where: { email: user.email },
          });

          if (!existingUser) {
            await prisma.usuarios.create({
              data: {
                id: `user-${Date.now()}-${Math.random().toString(36).substring(7)}`,
                email: user.email,
                nome: user.name || 'Usuário',
                imagem: user.image,
                email_verified: new Date(),
                senha_hash: null,
                role: 'CLIENTE',
                data_atualizacao: new Date(),
              },
            });
          }
        }
        
        return true;
      } catch (error) {
        console.error('Erro no signIn callback:', error);
        return false;
      }
    },

    async jwt({ token, user, account, trigger, session }) {
      // Primeira vez (login) ou quando há user
      if (user) {
        try {
          // Buscar dados completos do usuário na nossa tabela usuarios
          const usuario = await prisma.usuarios.findUnique({
            where: { email: user.email! },
          });

          if (usuario) {
            // Usar dados da nossa tabela usuarios
            token.id = usuario.id;
            token.role = usuario.role || 'CLIENTE';
            token.name = usuario.nome;
            token.email = usuario.email;
            token.picture = usuario.imagem;
          } else {
            // Fallback para dados do user
            token.id = user.id;
            token.role = (user as any).role || 'CLIENTE';
            token.name = user.name;
            token.email = user.email;
            token.picture = user.image;
          }
        } catch (error) {
          console.error('Erro ao buscar usuário no JWT callback:', error);
          // Usar dados do user como fallback
          token.id = user.id;
          token.role = (user as any).role || 'CLIENTE';
          token.name = user.name;
          token.email = user.email;
          token.picture = user.image;
        }
      }

      // Atualização de sessão
      if (trigger === 'update' && session) {
        token = { ...token, ...session };
      }

      return token;
    },

    async session({ session, token }) {
      // Sempre garantir que os dados do token estejam na sessão
      if (session.user && token) {
        (session.user as any).id = token.id as string;
        (session.user as any).role = token.role as string;
        session.user.name = token.name as string;
        session.user.email = token.email as string;
        session.user.image = token.picture as string;
      }

      return session;
    },

    async redirect({ url, baseUrl }) {
      // Permitir logout
      if (url === `${baseUrl}/login`) {
        return url;
      }

      // Se já tem uma URL de redirecionamento válida dentro do baseUrl
      if (url.startsWith(baseUrl)) {
        return url;
      }
      
      // Se a URL começa com /, é uma URL relativa válida
      if (url.startsWith('/')) {
        return `${baseUrl}${url}`;
      }
      
      // Fallback: retornar para página de login
      return `${baseUrl}/login`;
    },
  },

  events: {
    async signIn({ user, isNewUser }) {
      // Atualizar último login na nossa tabela usuarios
      if (user.email) {
        try {
          await prisma.usuarios.update({
            where: { email: user.email },
            data: { ultimo_login: new Date() },
          });
        } catch (error) {
          console.log('Usuário não encontrado na tabela usuarios:', user.email);
        }
      }
    },
  },

  secret: process.env.NEXTAUTH_SECRET,
  debug: process.env.NODE_ENV === 'development',
};

