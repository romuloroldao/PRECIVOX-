'use client';

import { useEffect } from 'react';
import { fullLogout, LOGOUT_REDIRECT } from '@/lib/logout-client';

/**
 * Página de logout — invalida sessão e redireciona para a Home.
 * Usada por links diretos (ex.: /logout) e pelo PersonaSelector.
 */
export default function LogoutPage() {
  useEffect(() => {
    void fullLogout(LOGOUT_REDIRECT);
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="inline-block animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-600 mb-4" />
        <p className="text-gray-600">Saindo da sua conta...</p>
      </div>
    </div>
  );
}
