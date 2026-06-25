import type { Metadata } from 'next';
import FuncionalidadesContent from '@/components/marketing/FuncionalidadesContent';

export const metadata: Metadata = {
  title: 'Funcionalidades — Catálogo completo',
  description:
    'Todas as funcionalidades do PRECIVOX: Economia Líquida™, radar de demanda, pricing assistido, GROOC, truth layer e mais.',
  openGraph: {
    title: 'Funcionalidades PRECIVOX',
    url: 'https://precivox.com.br/funcionalidades',
  },
};

export default function FuncionalidadesPage() {
  return <FuncionalidadesContent />;
}
