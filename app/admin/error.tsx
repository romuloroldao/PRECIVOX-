'use client';

import RouteErrorFallback from '@/components/RouteErrorFallback';

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <RouteErrorFallback error={error} reset={reset} area="admin" />;
}
