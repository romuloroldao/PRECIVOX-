'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useSession } from 'next-auth/react';
import { X, MessageCircleHeart } from 'lucide-react';

const STORAGE_SNOOZE = 'precivox_nps_snooze_until';
const SNOOZE_MS = 7 * 24 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 14_000;

export function NpsSurveyWidget() {
  const { data: session, status } = useSession();
  const role = (session?.user as { role?: string })?.role;

  const [mercadoId, setMercadoId] = useState<string | null>(null);
  const [mercadoNome, setMercadoNome] = useState<string | null>(null);
  const [eligible, setEligible] = useState(false);
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [score, setScore] = useState<number | null>(null);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [gatilhoAtual, setGatilhoAtual] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const behaviorTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const snoozed = useCallback(() => {
    if (typeof window === 'undefined') return true;
    const raw = localStorage.getItem(STORAGE_SNOOZE);
    if (!raw) return false;
    const until = parseInt(raw, 10);
    return Number.isFinite(until) && Date.now() < until;
  }, []);

  useEffect(() => {
    if (status !== 'authenticated' || role !== 'CLIENTE') return;
    if (snoozed()) return;

    let cancelled = false;

    (async () => {
      const sugRes = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
      const sugData = await sugRes.json();
      const mid = sugData.mercadoId as string | null;
      if (!mid || cancelled) return;

      const eligRes = await fetch(`/api/nps/eligibility?mercadoId=${encodeURIComponent(mid)}`, {
        cache: 'no-store',
      });
      const eligData = await eligRes.json();
      if (!eligData.eligible || cancelled) return;

      setMercadoId(mid);
      setMercadoNome(sugData.mercadoNome ?? null);
      setEligible(true);

      timerRef.current = setTimeout(() => {
        if (!cancelled && !snoozed()) setVisible(true);
      }, SHOW_DELAY_MS);
    })();

    return () => {
      cancelled = true;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [status, role, snoozed]);

  /** Disparo por comportamento (substituição, 3+ itens, busca sem resultado, etc.). */
  useEffect(() => {
    if (status !== 'authenticated' || role !== 'CLIENTE') return;

    const handler = (ev: Event) => {
      const ce = ev as CustomEvent<{
        gatilho?: string;
        delayMs?: number;
        mercadoId?: string | null;
      }>;
      if (snoozed()) return;
      const d = ce.detail || {};
      const g = typeof d.gatilho === 'string' ? d.gatilho : null;
      if (!g) return;

      void (async () => {
        let mid = d.mercadoId ?? null;
        if (!mid) {
          const sugRes = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
          const sugData = await sugRes.json();
          mid = (sugData.mercadoId as string | null) ?? null;
        }
        if (!mid) return;

        const eligRes = await fetch(`/api/nps/eligibility?mercadoId=${encodeURIComponent(mid)}`, {
          cache: 'no-store',
        });
        const eligData = await eligRes.json();
        if (!eligData.eligible) return;

        if (timerRef.current) clearTimeout(timerRef.current);
        if (behaviorTimerRef.current) clearTimeout(behaviorTimerRef.current);

        setMercadoId(mid);
        const nomeRes = await fetch('/api/nps/suggest-mercado', { cache: 'no-store' });
        const nomeData = await nomeRes.json();
        if (nomeData.mercadoId === mid) setMercadoNome(nomeData.mercadoNome ?? null);

        setGatilhoAtual(g);
        setEligible(true);
        const delay = typeof d.delayMs === 'number' ? d.delayMs : 2000;
        behaviorTimerRef.current = setTimeout(() => {
          if (!snoozed()) setVisible(true);
        }, Math.max(0, delay));
      })();
    };

    window.addEventListener('precivox-nps-prompt', handler as EventListener);
    return () => {
      window.removeEventListener('precivox-nps-prompt', handler as EventListener);
      if (behaviorTimerRef.current) clearTimeout(behaviorTimerRef.current);
    };
  }, [status, role, snoozed]);

  const handleSnooze = () => {
    localStorage.setItem(STORAGE_SNOOZE, String(Date.now() + SNOOZE_MS));
    setVisible(false);
    setOpen(false);
  };

  const handleSubmit = async () => {
    if (mercadoId == null || score == null) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/nps', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          mercadoId,
          score,
          comment: comment.trim() || undefined,
          ...(gatilhoAtual ? { gatilho: gatilhoAtual } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || 'Não foi possível enviar');
      }
      setDone(true);
      setOpen(false);
      setVisible(false);
      setGatilhoAtual(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Erro ao enviar');
    } finally {
      setSubmitting(false);
    }
  };

  if (status !== 'authenticated' || role !== 'CLIENTE') return null;
  if (!eligible || !mercadoId || done) return null;
  if (!visible && !open) return null;

  return (
    <>
      {visible && !open && (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="fixed bottom-6 right-4 z-[60] flex items-center gap-2 rounded-full bg-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-400 focus:ring-offset-2 md:bottom-8 md:right-8"
          aria-haspopup="dialog"
        >
          <MessageCircleHeart className="h-5 w-5 shrink-0" aria-hidden />
          Sua opinião
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 p-4 sm:items-center"
          role="dialog"
          aria-modal="true"
          aria-labelledby="nps-title"
        >
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                handleSnooze();
              }}
              className="absolute right-3 top-3 rounded-full p-2 text-gray-500 hover:bg-gray-100"
              aria-label="Fechar"
            >
              <X className="h-5 w-5" />
            </button>

            <h2 id="nps-title" className="pr-10 text-lg font-bold text-gray-900">
              Recomendaria o mercado?
            </h2>
            {mercadoNome && (
              <p className="mt-1 text-sm text-gray-600">
                Sobre: <span className="font-medium">{mercadoNome}</span>
              </p>
            )}
            {gatilhoAtual && (
              <p className="mt-2 text-xs text-gray-500">Momento: {gatilhoAtual.replace(/_/g, ' ')}</p>
            )}
            <p className="mt-3 text-sm text-gray-600">
              De 0 (não recomendaria) a 10 (recomendaria muito). Leva menos de 10 segundos.
            </p>

            <div className="mt-4 flex flex-wrap gap-2">
              {Array.from({ length: 11 }, (_, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setScore(i)}
                  className={`h-10 min-w-[2.25rem] rounded-lg text-sm font-semibold transition ${
                    score === i
                      ? 'bg-emerald-600 text-white ring-2 ring-emerald-300'
                      : 'bg-gray-100 text-gray-800 hover:bg-gray-200'
                  }`}
                >
                  {i}
                </button>
              ))}
            </div>

            <label className="mt-4 block text-sm font-medium text-gray-700">
              Comentário (opcional)
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={3}
                maxLength={2000}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                placeholder="O que podemos melhorar?"
              />
            </label>

            {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                type="button"
                disabled={score == null || submitting}
                onClick={handleSubmit}
                className="flex-1 rounded-lg bg-emerald-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
              >
                {submitting ? 'Enviando…' : 'Enviar'}
              </button>
              <button
                type="button"
                onClick={() => {
                  setOpen(false);
                  handleSnooze();
                }}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50"
              >
                Agora não
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
