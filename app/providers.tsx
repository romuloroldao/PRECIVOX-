'use client';

import { ListaProvider } from './context/ListaContext';
import { ToastProvider } from '@/components/ToastContainer';
import { RaioFamiliarListaSync } from '@/components/cliente/RaioFamiliarListaSync';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ListaProvider>
        <RaioFamiliarListaSync />
        {children}
      </ListaProvider>
    </ToastProvider>
  );
}
