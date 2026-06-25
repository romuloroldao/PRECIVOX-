import type { Metadata } from 'next';
import CasesContent from '@/components/marketing/CasesContent';

export const metadata: Metadata = {
  title: 'Cases — Piloto regional',
  description:
    'Conheça os 5 parceiros âncora do piloto PRECIVOX: Empório Select Premium, Atacadão Econômico, SuperMax Atacado e mais.',
  openGraph: {
    title: 'Cases PRECIVOX',
    url: 'https://precivox.com.br/cases',
  },
};

export default function CasesPage() {
  return <CasesContent />;
}
