import Link from 'next/link';
import DemoForm from '@/components/marketing/DemoForm';
import DashboardPreview from '@/components/marketing/DashboardPreview';

export default function DemoContent() {
  return (
    <div className="min-h-[calc(100vh-4rem)] bg-slate-50">
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
        <div className="text-center mb-12">
          <p className="text-sm font-semibold uppercase tracking-widest text-violet-600 mb-4">
            Fale conosco
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
            Quer saber mais ou tem um mercado?
          </h1>
          <p className="mt-6 text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            Preencha o formulário e nossa equipe entra em contato. Se você tem um mercado e quer
            aparecer nas comparações de preço, esse é o caminho.
          </p>
        </div>

        <div className="lg:grid lg:grid-cols-2 lg:gap-12 items-start">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 sm:p-10">
            <h2 className="text-lg font-semibold text-slate-900 mb-6">Enviar mensagem</h2>
            <DemoForm />
          </div>

          <div className="mt-12 lg:mt-0 space-y-8">
            <DashboardPreview />

            <div className="bg-white rounded-2xl border border-slate-200 p-6">
              <h2 className="text-sm font-semibold text-slate-900 mb-4">Como podemos ajudar</h2>
              <ul className="space-y-3">
                {[
                  'Tirar dúvidas sobre o funcionamento da plataforma',
                  'Cadastrar seu mercado para aparecer nas comparações',
                  'Entender como a comunidade pode te ajudar a vender mais',
                  'Parceria ou integração com sistemas existentes',
                ].map((item) => (
                  <li key={item} className="flex items-start gap-3 text-sm text-slate-700">
                    <svg className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden>
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                    </svg>
                    {item}
                  </li>
                ))}
              </ul>
            </div>

          </div>
        </div>
      </section>
    </div>
  );
}
