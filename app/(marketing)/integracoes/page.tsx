import type { Metadata } from 'next';
import IntegracoesContent from '@/components/marketing/IntegracoesContent';

export const metadata: Metadata = {
  title: 'Integrações — API, SFTP e Webhooks',
  description:
    'Integre seu catálogo ao PRECIVOX via upload CSV, sync URL/SFTP, API batch ou webhook de preço. Tiers 1 a 3.',
  openGraph: {
    title: 'Integrações PRECIVOX',
    url: 'https://precivox.com.br/integracoes',
  },
};

export default function IntegracoesPage() {
  return <IntegracoesContent />;
}
