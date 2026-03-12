import { NextResponse } from 'next/server';
import type { RoleHandler } from '@/lib/api/auth/withRole';
import type { RouteWrapper } from './composePipeline';

type RateLimitStoreKey = string;

type RateLimitEntry = {
  count: number;
  resetTime: number;
};

const rateLimitStore = new Map<RateLimitStoreKey, RateLimitEntry>();

export function withRateLimit(
  key: string,
  options?: { max?: number; windowMs?: number },
): RouteWrapper {
  const max = options?.max ?? 60;
  const windowMs = options?.windowMs ?? 60_000;

  return (handler: RoleHandler): RoleHandler => {
    return async (req, user) => {
      const identifier = `${key}:${user.id}`;
      const now = Date.now();
      const current = rateLimitStore.get(identifier);

      if (!current || now > current.resetTime) {
        rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
      } else if (current.count >= max) {
        return NextResponse.json(
          { error: 'Too many requests', code: 'RATE_LIMITED' },
          { status: 429 },
        );
      } else {
        current.count += 1;
      }

      return handler(req, user);
    };
  };
}

