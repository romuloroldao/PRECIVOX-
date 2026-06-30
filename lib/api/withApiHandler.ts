import { NextRequest, NextResponse } from 'next/server';

type ApiHandler = (request: NextRequest, context?: unknown) => Promise<Response>;

/**
 * Wrapper padrão para route handlers — try/catch + formato de erro consistente.
 */
export function withApiHandler(handler: ApiHandler, label = 'api'): ApiHandler {
  return async (request: NextRequest, context?: unknown) => {
    try {
      return await handler(request, context);
    } catch (error) {
      console.error(`[${label}]`, error);
      return NextResponse.json(
        { success: false, error: 'Erro interno' },
        { status: 500 },
      );
    }
  };
}
