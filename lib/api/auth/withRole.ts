import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from './requireRole';
import type { AuthUser, Role } from './types';

export type RoleHandler = (request: NextRequest, user: AuthUser) => Promise<Response>;

export function withRole(roles: Role[], handler: RoleHandler) {
  return async function (request: NextRequest) {
    try {
      const auth = await requireRole(request, roles);

      if (auth.status === 'unauthenticated') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized' },
          { status: 401 },
        );
      }

      if (auth.status === 'forbidden') {
        return NextResponse.json(
          { success: false, error: 'Forbidden' },
          { status: 403 },
        );
      }

      return await handler(request, auth.user);
    } catch (error) {
      console.error('[withRole]', error);
      return NextResponse.json(
        { success: false, error: 'Erro interno' },
        { status: 500 },
      );
    }
  };
}

