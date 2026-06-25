'use client';

import { useState, FormEvent } from 'react';

export default function NewsletterForm() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = email.trim();
    if (!trimmed) return;

    setStatus('loading');
    setMessage('');

    try {
      const res = await fetch('/api/newsletter/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmed, origem: 'footer' }),
      });
      const data = await res.json();

      if (res.ok && data.success) {
        setStatus('success');
        setMessage(data.message || 'Inscrição confirmada! Verifique seu e-mail.');
        setEmail('');
      } else {
        setStatus('error');
        setMessage(data.error || 'Não foi possível inscrever. Tente novamente.');
      }
    } catch {
      setStatus('error');
      setMessage('Erro de conexão. Tente novamente.');
    }
  }

  return (
    <div>
      <h2 className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-4">
        Newsletter
      </h2>
      <p className="text-sm text-slate-400 mb-4 leading-relaxed">
        Receba dicas de economia e novidades do Precivox no seu e-mail.
      </p>
      <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (status !== 'idle') setStatus('idle');
          }}
          placeholder="seu@email.com"
          required
          disabled={status === 'loading'}
          className="flex-1 min-w-0 px-3 py-2.5 rounded-lg bg-slate-800 border border-slate-700 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-60"
        />
        <button
          type="submit"
          disabled={status === 'loading'}
          className="px-4 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-sm font-semibold transition-colors disabled:opacity-60 whitespace-nowrap"
        >
          {status === 'loading' ? 'Enviando...' : 'Inscrever'}
        </button>
      </form>
      {message && (
        <p
          className={`mt-3 text-sm ${
            status === 'success' ? 'text-emerald-400' : status === 'error' ? 'text-red-400' : 'text-slate-400'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
