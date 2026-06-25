import type { Metadata } from 'next';
import PersonaHub from '@/components/marketing/PersonaHub';

export const metadata: Metadata = {
  title: 'PRECIVOX — Pague mais barato no mercado perto de você',
  description:
    'Compare preços de mercados do seu bairro, monte sua lista e veja onde economizar de verdade. Grátis para começar.',
  openGraph: {
    title: 'PRECIVOX — Pague mais barato no mercado perto de você',
    description: 'Compare preços, monte sua lista e economize no mercado do seu bairro.',
    url: 'https://precivox.com.br',
    siteName: 'PRECIVOX',
    locale: 'pt_BR',
    type: 'website',
  },
};

export default function HomePage() {
  return <PersonaHub />;
}
