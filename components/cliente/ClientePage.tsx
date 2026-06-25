'use client';

import { PageHeader } from '@/components/ui';
import { cn } from '@/lib/utils';

export interface ClientePageProps {
  title: string;
  description?: string;
  mobileDescription?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
  /** Padding inferior para bottom nav mobile */
  withBottomNav?: boolean;
}

/**
 * Shell padrão para páginas da área do cliente — mobile-first com padding do bottom nav.
 */
export function ClientePage({
  title,
  description,
  mobileDescription,
  actions,
  children,
  className,
  withBottomNav = true,
}: ClientePageProps) {
  return (
    <div
      className={cn(
        'mx-auto max-w-4xl px-4 py-4 md:px-6 md:py-6',
        withBottomNav && 'pb-24 md:pb-6',
        className
      )}
    >
      <PageHeader
        title={title}
        description={description}
        mobileDescription={mobileDescription}
        actions={actions}
      />
      {children}
    </div>
  );
}
