import { NextRequest, NextResponse } from 'next/server';
import { z, type ZodSchema } from 'zod';

import type { RoleHandler } from '@/lib/api/auth/withRole';
import type { RouteWrapper } from './composePipeline';

const BODY_METHODS = new Set(['POST', 'PUT', 'PATCH']);

export type ValidationSchemas = {
  body?: ZodSchema;
  query?: ZodSchema;
};

/** Extended request with validated payloads (set by withValidation). */
export interface ValidatedRequest extends NextRequest {
  validatedBody?: unknown;
  validatedQuery?: unknown;
}

/**
 * Route wrapper that validates body (POST/PUT/PATCH) and/or query with Zod.
 * On success, sets req.validatedBody and/or req.validatedQuery for the handler.
 * On failure, returns 400 with { error, issues }.
 */
export function withValidation(schemas: ValidationSchemas): RouteWrapper {
  return (handler: RoleHandler): RoleHandler => {
    return async (req, user) => {
      const extendedReq = req as ValidatedRequest;

      try {
        if (schemas.body && BODY_METHODS.has(req.method ?? '')) {
          const body = await req.json().catch(() => ({}));
          const parsed = schemas.body.parse(body);
          extendedReq.validatedBody = parsed;
        }

        if (schemas.query) {
          const query = Object.fromEntries(req.nextUrl.searchParams);
          const parsed = schemas.query.parse(query);
          extendedReq.validatedQuery = parsed;
        }

        return handler(extendedReq, user);
      } catch (err) {
        if (err instanceof z.ZodError) {
          return NextResponse.json(
            {
              error: 'Invalid request',
              issues: err.issues,
            },
            { status: 400 },
          );
        }
        throw err;
      }
    };
  };
}

/** Typed access to validated body (use after withValidation with body schema). */
export function getValidatedBody<T>(req: NextRequest): T {
  return (req as ValidatedRequest).validatedBody as T;
}

/** Typed access to validated query (use after withValidation with query schema). */
export function getValidatedQuery<T>(req: NextRequest): T {
  return (req as ValidatedRequest).validatedQuery as T;
}
