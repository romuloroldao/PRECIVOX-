import { NextRequest } from 'next/server';
import { requireRole } from './requireRole';

export function requireAdmin(request: NextRequest) {
  return requireRole(request, ['ADMIN']);
}

