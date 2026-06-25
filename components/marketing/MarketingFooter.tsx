import Link from 'next/link';
import Logo from '@/components/Logo';
import NewsletterForm from '@/components/marketing/NewsletterForm';

export default function MarketingFooter() {
  return (
    <footer className="bg-slate-900 text-slate-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-10">
          <div className="sm:col-span-2 lg:col-span-1">
            <Logo height={36} variant="white" href="/" />
            <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
              Compare preços dos mercados do seu bairro e economize de verdade nas compras do dia a dia.
            </p>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Produto
            </h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/consumidor" className="hover:text-white transition-colors">Como funciona</Link></li>
              <li><Link href="/funcionalidades" className="hover:text-white transition-colors">Funcionalidades</Link></li>
              <li><Link href="/signup" className="hover:text-white transition-colors">Criar conta grátis</Link></li>
              <li><Link href="/demo" className="hover:text-white transition-colors">Fale conosco</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Legal
            </h2>
            <ul className="space-y-2 text-sm">
              <li><Link href="/privacidade" className="hover:text-white transition-colors">Privacidade</Link></li>
              <li><Link href="/termos" className="hover:text-white transition-colors">Termos</Link></li>
              <li><Link href="/contato" className="hover:text-white transition-colors">Contato</Link></li>
            </ul>
          </div>

          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
              Contato
            </h2>
            <ul className="space-y-2 text-sm">
              <li>
                <a href="mailto:comercial@precivox.com.br" className="hover:text-white transition-colors">
                  comercial@precivox.com.br
                </a>
              </li>
              <li>
                <a href="mailto:suporte@precivox.com.br" className="hover:text-white transition-colors">
                  suporte@precivox.com.br
                </a>
              </li>
            </ul>
          </div>

          <NewsletterForm />
        </div>

        <div className="mt-10 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
          © {new Date().getFullYear()} PRECIVOX Tecnologia Ltda. — Todos os direitos reservados.
        </div>
      </div>
    </footer>
  );
}
