import { NextRequest, NextResponse } from 'next/server';
import { requireRole } from './requireRole';
import type { AuthUser, Role } from './types';

export type RoleHandler = (request: NextRequest, user: AuthUser) => Promise<Response>;

export function withRole(roles: Role[], handler: RoleHandler) {
  return async function (request: NextRequest) {
    const auth = await requireRole(request, roles);

    if (auth.status === 'unauthenticated') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 },
      );
    }

    if (auth.status === 'forbidden') {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 },
      );
    }

    return handler(request, auth.user);
  };
}

