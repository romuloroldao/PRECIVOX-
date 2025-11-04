'use client';

import { SessionProvider } from 'next-auth/react';
import { ListaProvider } from './context/ListaContext';
import { ToastProvider } from '@/components/ToastContainer';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ListaProvider>
          {children}
        </ListaProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
