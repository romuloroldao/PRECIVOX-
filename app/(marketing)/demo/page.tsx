import type { Metadata } from 'next';
import DemoContent from '@/components/marketing/DemoContent';

export const metadata: Metadata = {
  title: 'Fale conosco — PRECIVOX',
  description:
    'Entre em contato com a equipe PRECIVOX. Tire dúvidas, cadastre seu mercado ou proponha uma parceria.',
  openGraph: {
    title: 'Fale conosco — PRECIVOX',
    url: 'https://precivox.com.br/demo',
  },
};

export default function DemoPage() {
  return <DemoContent />;
}
