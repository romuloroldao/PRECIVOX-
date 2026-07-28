'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';

/** Alias: edição = mesmo fluxo de detalhe (ativa lista → Compra). */
export default function ListaEditarRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const id = typeof params?.id === 'string' ? params.id : '';

  useEffect(() => {
    if (id) router.replace(`/cliente/listas/${id}`);
    else router.replace('/cliente/listas');
  }, [id, router]);

  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm text-slate-500">
      Abrindo edição…
    </div>
  );
}
