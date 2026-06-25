'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Logo from '@/components/Logo';
import { loginUrlWithCallback, signupUrlWithCallback } from '@/lib/safe-callback-url';

interface GlobalStats {
  totalUsers: number;
  totalSavings: number;
  activeMarkets: number;
}

const PILOT_THRESHOLD_USERS = 500;

export default function ConsumidorLanding() {
  const [stats, setStats] = useState<GlobalStats>({ totalUsers: 0, totalSavings: 0, activeMarkets: 0 });
  const [loading, setLoading] = useState(true);
  const isPilot = !loading && stats.totalUsers < PILOT_THRESHOLD_USERS;

  const hrefLogin = loginUrlWithCallback();
  const hrefSignup = signupUrlWithCallback();

  useEffect(() => {
    async function fetchStats() {
      try {
        const res = await fetch('/api/stats/global');
        if (res.ok) {
          const json = await res.json();
          if (json.success) setStats(json.data);
        }
      } catch {
        /* stats opcionais */
      } finally {
        setLoading(false);
      }
    }
    fetchStats();
  }, []);

  const totalSavingsReais = (stats.totalSavings / 100).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    maximumFractionDigits: 0,
  });

  return (
    <>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 sm:py-20 text-center">
          <div className="flex justify-center mb-6">
            <Logo height={56} variant="white" href="" />
          </div>
          <p className="text-sm font-semibold uppercase tracking-widest text-blue-200 mb-4">
            Economia Inteligente
          </p>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight max-w-3xl mx-auto">
            Economia real —{' '}
            <span className="text-violet-200">não só preço de vitrine</span>
          </h1>
          <p className="mt-6 text-lg text-blue-100 max-w-xl mx-auto leading-relaxed">
            O PRECIVOX calcula quanto você realmente economiza considerando deslocamento, tempo e
            ofertas do seu bairro. Compare, planeje e compre com inteligência.
          </p>
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
            <Link
              href={hrefSignup}
              className="w-full sm:w-auto inline-flex justify-center px-8 py-3.5 rounded-xl bg-white text-blue-700 font-bold hover:bg-blue-50 transition-colors"
            >
              Começar grátis
            </Link>
            <Link
              href={hrefLogin}
              className="w-full sm:w-auto inline-flex justify-center px-8 py-3.5 rounded-xl border-2 border-white/40 text-white font-semibold hover:bg-white/10 transition-colors"
            >
              Já tenho conta
            </Link>
          </div>
          <p className="mt-4 text-sm text-blue-200">Sem cartão de crédito · Grátis para começar</p>

          {!loading && stats.totalUsers > 0 && (
            <div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
              <StatCard value={stats.totalUsers.toLocaleString('pt-BR')} label="pessoas no piloto" />
              <StatCard value={totalSavingsReais} label="economia registrada" />
              <StatCard value={String(stats.activeMarkets)} label="mercados na rede" />
            </div>
          )}
          {isPilot && (
            <p className="mt-6 inline-block text-xs font-medium bg-white/10 px-4 py-2 rounded-full text-blue-100">
              Piloto regional ativo — números crescem a cada semana
            </p>
          )}
        </div>
      </section>

      {/* Como funciona */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-14">Como funciona</h2>
          <div className="grid md:grid-cols-3 gap-10">
            <Step n={1} title="Monte sua lista" desc="Adicione os produtos que você compra toda semana." />
            <Step n={2} title="Compare preços" desc="Veja onde os mesmos produtos saem mais baratos, já contando a distância." />
            <Step n={3} title="Economize de verdade" desc="Compre no lugar certo e acompanhe quanto já economizou." />
          </div>
          <div className="text-center mt-12">
            <Link href={hrefSignup} className="inline-flex px-8 py-3.5 rounded-xl bg-blue-600 text-white font-semibold hover:bg-blue-700 transition-colors">
              Criar minha primeira lista
            </Link>
          </div>
        </div>
      </section>

      {/* Benefícios */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-14">Por que usar o PRECIVOX?</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <Benefit title="Economia real" desc="Calcula o que você economiza de verdade, contando distância e tempo — não só o preço na prateleira." />
            <Benefit title="Preços atualizados" desc="Dados com data de atualização e confirmação de outros consumidores." />
            <Benefit title="Feito pra você" desc="Sugestões, lista da semana e alertas quando o preço cai nos seus produtos." />
            <Benefit title="Do seu bairro" desc="Mercados e ofertas perto de você, não de outra cidade." />
          </div>
        </div>
      </section>

      {/* Confiança (substitui depoimentos fictícios) */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center text-slate-900 mb-4">Construído com transparência</h2>
          <p className="text-center text-slate-600 max-w-xl mx-auto mb-14">
            Dados no Brasil, LGPD e IA que explica suas recomendações — sem venda de dados pessoais.
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <TrustCard title="LGPD" desc="Conformidade total. Acesso, correção e exclusão a qualquer momento." />
            <TrustCard title="Dados no Brasil" desc="Armazenamento e processamento em servidores nacionais." />
            <TrustCard title="Sem rastreamento ads" desc="Não vendemos seus dados nem usamos cookies de publicidade." />
            <TrustCard title="Login seguro" desc="E-mail, Google ou Facebook — sem acesso à sua senha social." />
          </div>
          <p className="text-center mt-10">
            <Link href="/privacidade" className="text-blue-600 font-semibold hover:text-blue-700">
              Ler política de privacidade →
            </Link>
          </p>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-20 bg-gradient-to-br from-violet-600 to-indigo-700 text-white text-center">
        <div className="max-w-2xl mx-auto px-4">
          <h2 className="text-3xl font-extrabold">Pronto para economizar de verdade?</h2>
          <p className="mt-4 text-violet-100 text-lg">
            Junte-se ao piloto regional e descubra quanto sua cesta pode render a mais.
          </p>
          <Link
            href={hrefSignup}
            className="mt-8 inline-flex px-10 py-4 rounded-xl bg-white text-violet-700 font-bold hover:bg-violet-50 transition-colors"
          >
            Começar agora — é grátis
          </Link>
        </div>
      </section>
    </>
  );
}

function StatCard({ value, label }: { value: string; label: string }) {
  return (
    <div className="bg-white/10 backdrop-blur rounded-xl p-5">
      <div className="text-2xl sm:text-3xl font-extrabold">{value}</div>
      <div className="text-sm text-blue-200 mt-1">{label}</div>
    </div>
  );
}

function Step({ n, title, desc }: { n: number; title: string; desc: string }) {
  return (
    <div className="text-center">
      <div className="w-10 h-10 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center mx-auto mb-4">
        {n}
      </div>
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-slate-600 text-sm leading-relaxed">{desc}</p>
    </div>
  );
}

function Benefit({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="bg-white rounded-xl p-6 border border-slate-200">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}

function TrustCard({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="rounded-xl border border-slate-200 p-6 bg-slate-50">
      <h3 className="font-semibold text-slate-900">{title}</h3>
      <p className="mt-2 text-sm text-slate-600 leading-relaxed">{desc}</p>
    </div>
  );
}
