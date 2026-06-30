'use client';

import { useEffect } from 'react';
import { ListaProvider } from './context/ListaContext';
import { ToastProvider } from '@/components/ToastContainer';
import { RaioFamiliarListaSync } from '@/components/cliente/RaioFamiliarListaSync';

/** Sinaliza hidratação OK — libera contador de chunk recovery no layout raiz. */
function ChunkRecoveryReady() {
  useEffect(() => {
    window.dispatchEvent(new Event('precivox:app-ready'));
  }, []);
  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ToastProvider>
      <ListaProvider>
        <ChunkRecoveryReady />
        <RaioFamiliarListaSync />
        {children}
      </ListaProvider>
    </ToastProvider>
  );
}
