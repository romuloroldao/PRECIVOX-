import type { Metadata } from 'next';
import PlanosContent from '@/components/marketing/PlanosContent';

export const metadata: Metadata = {
  title: 'Planos — SaaS para gestores de mercado',
  description:
    'Planos Essencial, Pro e Enterprise do PRECIVOX. Radar de demanda, pricing assistido, heatmap, ML leve e insights CPG.',
  openGraph: {
    title: 'Planos PRECIVOX',
    url: 'https://precivox.com.br/planos',
  },
};

export default function PlanosPage() {
  return <PlanosContent />;
}
