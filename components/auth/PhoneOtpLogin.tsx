'use client';

import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

interface PhoneOtpLoginProps {
  callbackUrl?: string;
}

/** Normaliza para E.164 simples assumindo Brasil (+55) quando sem DDI. */
function toE164(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (raw.trim().startsWith('+')) return `+${digits}`;
  if (digits.length <= 11) return `+55${digits}`;
  return `+${digits}`;
}

export default function PhoneOtpLogin({ callbackUrl = '/cliente/casa' }: PhoneOtpLoginProps) {
  const [step, setStep] = useState<'phone' | 'code'>('phone');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [info, setInfo] = useState('');

  const requestCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setInfo('');
    const e164 = toE164(phone);
    if (!/^\+\d{10,15}$/.test(e164)) {
      setError('Informe um telefone válido com DDD (ex: 11 99999-9999).');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164, channel: 'SMS' }),
      });
      const data = await res.json();
      if (data.success) {
        setPhone(e164);
        setStep('code');
        setInfo('Enviamos um código por SMS. Pode levar alguns segundos.');
      } else {
        setError(data.error || 'Não foi possível enviar o código.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  const verifyCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!/^\d{6}$/.test(code)) {
      setError('O código tem 6 dígitos.');
      return;
    }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/otp/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone, code }),
      });
      const data = await res.json();
      if (data.success) {
        if (data.accessToken && data.refreshToken) {
          authClient.persistLoginTokens({
            accessToken: data.accessToken,
            refreshToken: data.refreshToken,
            expiresAt: data.expiresAt,
          });
        }
        window.location.href = callbackUrl;
      } else {
        setError(data.error || 'Código inválido ou expirado.');
      }
    } catch {
      setError('Erro de conexão. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      {error && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm" role="alert">
          {error}
        </div>
      )}
      {info && !error && (
        <div className="p-3 bg-blue-50 border border-blue-200 text-blue-700 rounded-lg text-sm">{info}</div>
      )}

      {step === 'phone' ? (
        <form onSubmit={requestCode} className="space-y-3">
          <label htmlFor="otp-phone" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <input
            id="otp-phone"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="(11) 99999-9999"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? 'Enviando código...' : 'Receber código por SMS'}
          </button>
        </form>
      ) : (
        <form onSubmit={verifyCode} className="space-y-3">
          <label htmlFor="otp-code" className="block text-sm font-medium text-gray-700">
            Código enviado para {phone}
          </label>
          <input
            id="otp-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
            placeholder="000000"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg text-center text-2xl tracking-[0.5em] focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-all font-semibold disabled:opacity-50"
          >
            {loading ? 'Validando...' : 'Entrar'}
          </button>
          <button
            type="button"
            onClick={() => {
              setStep('phone');
              setCode('');
              setError('');
              setInfo('');
            }}
            className="w-full text-sm text-gray-600 hover:text-gray-900"
          >
            Usar outro telefone
          </button>
        </form>
      )}
    </div>
  );
}
