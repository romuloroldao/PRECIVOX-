'use client';

import { SessionProvider } from 'next-auth/react';
import { ListaProvider } from './context/ListaContext';
import { ToastProvider } from '@/components/ToastContainer';
import { RaioFamiliarListaSync } from '@/components/cliente/RaioFamiliarListaSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <ToastProvider>
        <ListaProvider>
          <RaioFamiliarListaSync />
          {children}
        </ListaProvider>
      </ToastProvider>
    </SessionProvider>
  );
}
