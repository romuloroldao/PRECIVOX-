---
name: nextjs-api-auth-pattern
description: Use when creating or modifying Next.js API routes that require authorization. Enforces the project's auth wrapper pattern (withAdmin, withRole), TokenManager → NextAuth → Prisma flow, and optional pipeline (rate limit, audit).
---

# Next.js API Auth Pattern

## When to use

- Adding or editing API routes under `app/api/` that need authentication or role checks.
- Reviewing or refactoring admin or role-protected endpoints.

## Instructions

1. **Admin routes** must use `withAdmin`:

   ```ts
   import { withAdmin } from '@/lib/api/auth/withAdmin';
   import { NextResponse } from 'next/server';

   export const GET = withAdmin(async (req, admin) => {
     // admin is AuthUser; no manual auth checks
     return NextResponse.json(data);
   });
   ```

2. **Concrete example** — keep routes in this shape:

   ```ts
   export const GET = withAdmin(async (req, admin) => {
     const stats = await getAdminStats();
     return NextResponse.json(stats);
   });
   ```

3. **Role-based routes** (e.g. ADMIN + GESTOR) must use `withRole`:

   ```ts
   import { withRole } from '@/lib/api/auth/withRole';

   export const GET = withRole(['ADMIN', 'GESTOR'], async (req, user) => {
     return NextResponse.json(data);
   });
   ```

4. **Do not** put `requireAdmin`/`requireRole` or manual 401/403 logic inside the handler. The wrapper handles that.

5. **Auth flow** (from AUTH_AUTHORITY_MODEL.md):  
   TokenManager → NextAuth (email only) → Prisma role → handler.

6. **Pipeline** when you need rate limit, validation, or audit:

   ```ts
   import { composeAuthPipeline } from '@/lib/api/middleware/composePipeline';
   import { withAdmin } from '@/lib/api/auth/withAdmin';
   import { withRateLimit } from '@/lib/api/middleware/withRateLimit';
   import { withAudit } from '@/lib/api/middleware/withAudit';

   const withAdminPipeline = composeAuthPipeline(
     withAdmin,
     withRateLimit('ADMIN_STATS', { max: 60, windowMs: 60_000 }),
     withAudit('ADMIN_STATS')
   );

   export const GET = withAdminPipeline(async (req, admin) => {
     const stats = await getStats();
     return NextResponse.json(stats);
   });
   ```

7. **Validation (Zod)** — use `withValidation` in the pipeline and read inputs via helpers:

   ```ts
   import { z } from 'zod';
   import { withValidation, getValidatedQuery } from '@/lib/api/middleware/withValidation';

   const statsQuerySchema = z.object({ range: z.enum(['7d', '30d', '90d']).optional() });

   const pipeline = composeAuthPipeline(
     withAdmin,
     withValidation({ query: statsQuerySchema }),
     withAudit('ADMIN_STATS')
   );

   export const GET = pipeline(async (req, admin) => {
     const { range } = getValidatedQuery<{ range?: '7d' | '30d' | '90d' }>(req);
     const stats = await getStats(range ?? '30d');
     return NextResponse.json(stats);
   });
   ```

## References

- `.cursor/rules/admin-api-auth.mdc` — admin route conventions.
- `.cursor/rules/auth-architecture.mdc` — Auth V2 and authority order.
- `docs/AUTH_AUTHORITY_MODEL.md` — full contract.
