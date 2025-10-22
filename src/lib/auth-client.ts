// Cliente de Autenticação para PRECIVOX
'use client';

interface User {
  id: string;
  email: string;
  nome: string;
  role: 'ADMIN' | 'GESTOR' | 'CLIENTE';
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

class AuthClient {
  private static instance: AuthClient;
  private listeners: Array<(state: AuthState) => void> = [];
  private state: AuthState = {
    user: null,
    isAuthenticated: false,
    isLoading: true
  };

  private constructor() {
    this.initializeAuth();
  }

  public static getInstance(): AuthClient {
    if (!AuthClient.instance) {
      AuthClient.instance = new AuthClient();
    }
    return AuthClient.instance;
  }

  private async initializeAuth() {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        const response = await fetch('/api/auth/me', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        if (response.ok) {
          const data = await response.json();
          this.setState({
            user: data.user,
            isAuthenticated: true,
            isLoading: false
          });
        } else {
          this.logout();
        }
      } else {
        this.setState({
          user: null,
          isAuthenticated: false,
          isLoading: false
        });
      }
    } catch (error) {
      console.error('Erro ao inicializar autenticação:', error);
      this.logout();
    }
  }

  private setState(newState: Partial<AuthState>) {
    this.state = { ...this.state, ...newState };
    this.listeners.forEach(listener => listener(this.state));
  }

  public subscribe(listener: (state: AuthState) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  public getState(): AuthState {
    return this.state;
  }

  public async login(email: string, password: string): Promise<{ success: boolean; error?: string }> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      if (response.ok) {
        const data = await response.json();
        localStorage.setItem('token', data.token);
        this.setState({
          user: data.user,
          isAuthenticated: true,
          isLoading: false
        });
        return { success: true };
      } else {
        const error = await response.json();
        return { success: false, error: error.message || 'Erro ao fazer login' };
      }
    } catch (error) {
      console.error('Erro ao fazer login:', error);
      return { success: false, error: 'Erro de conexão' };
    }
  }

  public async logout(): Promise<void> {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
      }
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    } finally {
      localStorage.removeItem('token');
      this.setState({
        user: null,
        isAuthenticated: false,
        isLoading: false
      });
      
      // Redirecionar para a página de login ou home
      window.location.href = '/';
    }
  }

  public getToken(): string | null {
    return localStorage.getItem('token');
  }

  public isAdmin(): boolean {
    return this.state.user?.role === 'ADMIN';
  }

  public isGestor(): boolean {
    return this.state.user?.role === 'GESTOR';
  }

  public isCliente(): boolean {
    return this.state.user?.role === 'CLIENTE';
  }

  public getUser(): User | null {
    return this.state.user;
  }
}

export const authClient = AuthClient.getInstance();
export default authClient;
