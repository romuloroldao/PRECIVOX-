import type { Metadata } from 'next';
import ParaMercadosLanding from '@/components/marketing/ParaMercadosLanding';

export const metadata: Metadata = {
  title: 'Para Mercados — Transforme demanda em receita',
  description:
    'Radar de demanda, pricing assistido, heatmap de intenção e promo segmentada para varejo alimentar. IA explicável e dados hiperlocais.',
  openGraph: {
    title: 'PRECIVOX para Mercados',
    description: 'O sistema operacional da demanda alimentar do seu bairro.',
    url: 'https://precivox.com.br/para-mercados',
  },
};

export default function ParaMercadosPage() {
  return <ParaMercadosLanding />;
}
