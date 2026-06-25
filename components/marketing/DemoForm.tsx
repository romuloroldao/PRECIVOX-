'use client';

import { useState } from 'react';
import Link from 'next/link';

type FormState = 'idle' | 'loading' | 'success' | 'error';

const INTERESSES = [
  { value: 'mercado', label: 'Sou gestor de mercado' },
  { value: 'industria', label: 'Sou da indústria / CPG' },
  { value: 'consumidor', label: 'Sou consumidor' },
  { value: 'outro', label: 'Outro' },
] as const;

const PORTES = [
  { value: '1', label: '1 unidade' },
  { value: '2-5', label: '2 a 5 unidades' },
  { value: '5+', label: 'Mais de 5 unidades' },
  { value: 'na', label: 'Não se aplica' },
] as const;

export default function DemoForm() {
  const [state, setState] = useState<FormState>('idle');
  const [ticketId, setTicketId] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setState('loading');
    setErrorMsg('');

    const form = e.currentTarget;
    const data = new FormData(form);

    try {
      const res = await fetch('/api/marketing/demo', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nome: data.get('nome'),
          email: data.get('email'),
          empresa: data.get('empresa'),
          cidade: data.get('cidade'),
          telefone: data.get('telefone'),
          interesse: data.get('interesse'),
          porte: data.get('porte'),
          mensagem: data.get('mensagem'),
        }),
      });

      const json = await res.json();

      if (!res.ok || !json.success) {
        throw new Error(json.error || 'Erro ao enviar solicitação');
      }

      setTicketId(json.ticketId);
      setState('success');
      form.reset();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro inesperado');
      setState('error');
    }
  }

  if (state === 'success') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-6 h-6 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h2 className="text-xl font-bold text-slate-900">Solicitação enviada!</h2>
        <p className="mt-2 text-slate-600">
          Nossa equipe comercial entrará em contato em até 1 dia útil.
        </p>
        {ticketId && (
          <p className="mt-4 text-sm text-slate-500">
            Protocolo: <span className="font-mono font-semibold text-slate-700">{ticketId}</span>
          </p>
        )}
        <button
          type="button"
          onClick={() => setState('idle')}
          className="mt-6 text-sm font-semibold text-violet-600 hover:text-violet-700"
        >
          Enviar outra solicitação
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Nome completo" name="nome" required placeholder="Seu nome" />
        <Field label="E-mail" name="email" type="email" required placeholder="voce@empresa.com.br" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Empresa / Mercado" name="empresa" required placeholder="Nome do estabelecimento" />
        <Field label="Cidade" name="cidade" required placeholder="São Paulo, SP" />
      </div>

      <div className="grid sm:grid-cols-2 gap-5">
        <Field label="Telefone" name="telefone" type="tel" placeholder="(11) 99999-9999" />
        <div>
          <label htmlFor="interesse" className="block text-sm font-medium text-slate-700 mb-1.5">
            Interesse <span className="text-red-500">*</span>
          </label>
          <select
            id="interesse"
            name="interesse"
            required
            className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
          >
            <option value="">Selecione...</option>
            {INTERESSES.map((i) => (
              <option key={i.value} value={i.value}>
                {i.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label htmlFor="porte" className="block text-sm font-medium text-slate-700 mb-1.5">
          Porte do negócio
        </label>
        <select
          id="porte"
          name="porte"
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
        >
          {PORTES.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label htmlFor="mensagem" className="block text-sm font-medium text-slate-700 mb-1.5">
          Mensagem (opcional)
        </label>
        <textarea
          id="mensagem"
          name="mensagem"
          rows={3}
          placeholder="Conte um pouco sobre seu desafio ou o que gostaria de ver na demo..."
          className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent resize-none"
        />
      </div>

      {state === 'error' && errorMsg && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-4 py-3" role="alert">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={state === 'loading'}
        className="w-full py-3.5 rounded-xl bg-violet-600 text-white font-bold hover:bg-violet-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
      >
        {state === 'loading' ? 'Enviando...' : 'Solicitar demonstração gratuita'}
      </button>

      <p className="text-xs text-slate-500 text-center">
        Ao enviar, você concorda com nossa{' '}
        <Link href="/privacidade" className="text-blue-600 hover:underline">
          Política de Privacidade
        </Link>
        . Resposta em até 1 dia útil.
      </p>
    </form>
  );
}

function Field({
  label,
  name,
  type = 'text',
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
        {required && <span className="text-red-500"> *</span>}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="w-full px-4 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent"
      />
    </div>
  );
}
