// Funções de autenticação do lado do cliente
'use client';

import axios from 'axios';
import { LoginInput, RegisterInput } from './validations';

// Configurar timeout padrão para todas as requisições
axios.defaults.timeout = 10000; // 10 segundos

export interface AuthResponse {
  success: boolean;
  data?: {
    token: string;
    usuario: {
      id: string;
      nome: string;
      email: string;
      role: string;
      imagem?: string | null;
    };
    redirectUrl: string;
  };
  error?: string;
}

/**
 * Realiza login com e-mail e senha
 */
export async function login(credentials: LoginInput): Promise<AuthResponse> {
  try {
    const response = await axios.post('/api/auth/login', credentials, {
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.data.success && response.data.data.token) {
      // Salvar token no localStorage e cookie
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
      document.cookie = `token=${response.data.data.token}; path=/; max-age=604800`; // 7 dias
    }
    
    return response.data;
  } catch (error: any) {
    console.error('Erro no login:', error);
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao fazer login',
    };
  }
}

/**
 * Realiza cadastro de novo usuário
 */
export async function register(data: RegisterInput): Promise<AuthResponse> {
  try {
    const response = await axios.post('/api/auth/register', data);
    
    if (response.data.success && response.data.data.token) {
      // Salvar token no localStorage e cookie
      localStorage.setItem('token', response.data.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.data.usuario));
      document.cookie = `token=${response.data.data.token}; path=/; max-age=604800`; // 7 dias
    }
    
    return response.data;
  } catch (error: any) {
    return {
      success: false,
      error: error.response?.data?.error || 'Erro ao fazer cadastro',
    };
  }
}

/**
 * Realiza logout
 */
export async function logout(): Promise<void> {
  try {
    const token = localStorage.getItem('token');
    
    if (token) {
      await axios.post('/api/auth/logout', null, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    }
  } catch (error) {
    console.error('Erro ao fazer logout:', error);
  } finally {
    // Limpar dados locais
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    document.cookie = 'token=; path=/; max-age=0';
    window.location.href = '/login';
  }
}

/**
 * Obtém o usuário autenticado
 */
export async function getAuthenticatedUser() {
  try {
    const token = localStorage.getItem('token');
    
    if (!token) {
      return null;
    }
    
    const response = await axios.get('/api/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      timeout: 8000, // 8 segundos específico para esta requisição
    });
    
    if (response.data.success) {
      return response.data.data;
    }
    
    return null;
  } catch (error: any) {
    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      console.error('Timeout ao buscar usuário');
    } else if (error.response?.status === 401) {
      // Token inválido, fazer logout
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      document.cookie = 'token=; path=/; max-age=0';
    } else {
      console.error('Erro ao buscar usuário:', error);
    }
    return null;
  }
}

/**
 * Verifica se o usuário está autenticado
 */
export function isAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  // Verificar tanto localStorage quanto cookie
  return !!(localStorage.getItem('token') || document.cookie.includes('token='));
}

/**
 * Obtém o token armazenado
 */
export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('token');
}

/**
 * Obtém os dados do usuário do localStorage
 */
export function getStoredUser() {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
}

