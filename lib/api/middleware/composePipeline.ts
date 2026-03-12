import type { RoleHandler } from '@/lib/api/auth/withRole';

export type RouteWrapper = (handler: RoleHandler) => RoleHandler;

export function composeAuthPipeline(...wrappers: RouteWrapper[]): RouteWrapper {
  return (handler) => wrappers.reduceRight((acc, wrapper) => wrapper(acc), handler);
}

