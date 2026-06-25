import type { Metadata } from 'next';
import ConsumidorLanding from '@/components/marketing/ConsumidorLanding';

export const metadata: Metadata = {
  title: 'Para Consumidor — Economia real no seu bairro',
  description:
    'Compare preços, monte listas inteligentes e calcule sua Economia Líquida™ com o PRECIVOX. Grátis para começar.',
  openGraph: {
    title: 'PRECIVOX para Consumidor',
    description: 'Economia real — não só preço de vitrine.',
    url: 'https://precivox.com.br/consumidor',
  },
};

export default function ConsumidorPage() {
  return <ConsumidorLanding />;
}
