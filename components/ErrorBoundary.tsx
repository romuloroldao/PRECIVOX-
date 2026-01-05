/**
 * Error Boundary e componentes de erro graceful
 * Evita crashes de tela por erros de API
 */

'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';
import { ApiError } from '@/lib/api-client';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

/**
 * Error Boundary para capturar erros React
 */
export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary capturou um erro:', error, errorInfo);
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }
  }

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorDisplay
          title="Algo deu errado"
          message={this.state.error?.message || 'Ocorreu um erro inesperado'}
          onRetry={() => {
            this.setState({ hasError: false, error: null });
            window.location.reload();
          }}
        />
      );
    }

    return this.props.children;
  }
}

/**
 * Componente de exibição de erro graceful
 */
interface ErrorDisplayProps {
  title?: string;
  message: string;
  error?: ApiError | Error;
  onRetry?: () => void;
  showRetry?: boolean;
  className?: string;
}

export function ErrorDisplay({
  title = 'Erro',
  message,
  error,
  onRetry,
  showRetry = true,
  className = '',
}: ErrorDisplayProps) {
  const isApiError = error && 'status' in error;
  const status = isApiError ? (error as ApiError).status : null;
  const code = isApiError ? (error as ApiError).code : null;

  return (
    <div className={`bg-red-50 border border-red-200 rounded-lg p-6 ${className}`}>
      <div className="flex items-start">
        <div className="flex-shrink-0">
          <svg
            className="h-6 w-6 text-red-600"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <div className="ml-3 flex-1">
          <h3 className="text-sm font-medium text-red-800 mb-1">{title}</h3>
          <p className="text-sm text-red-700 mb-2">{message}</p>
          {(status || code) && (
            <p className="text-xs text-red-600">
              {code && <span className="font-mono">{code}</span>}
              {status && code && ' • '}
              {status && <span>Status: {status}</span>}
            </p>
          )}
          {showRetry && onRetry && (
            <button
              onClick={onRetry}
              className="mt-3 text-sm font-medium text-red-800 hover:text-red-900 underline"
            >
              Tentar novamente
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/**
 * Hook para tratamento de erros em componentes
 */
export function useErrorHandler() {
  const [error, setError] = React.useState<ApiError | Error | null>(null);

  const handleError = React.useCallback((err: ApiError | Error) => {
    console.error('Erro capturado:', err);
    setError(err);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return {
    error,
    handleError,
    clearError,
    ErrorDisplay: error ? (
      <ErrorDisplay
        message={error instanceof Error ? error.message : error.message}
        error={error}
        onRetry={clearError}
      />
    ) : null,
  };
}

