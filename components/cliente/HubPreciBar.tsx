'use client';

import { useRef, useState, FormEvent, ChangeEvent } from 'react';
import { Camera, Mic, ScanLine, Search, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { UX } from '@/lib/ux-copy';
import { cn } from '@/lib/utils';
import { useHubIntent } from '@/hooks/useHubIntent';
import { useSpeechToText } from '@/hooks/useSpeechToText';
import { buildScanHref } from '@/lib/cliente-mercado-ref';
import { processarFotoScan } from '@/lib/scan-ocr-client';
import { useToast } from '@/components/ToastContainer';
import type { HubIntentId } from '@/lib/hub/types';

const CHIPS: { label: string; hint: HubIntentId; seed: string }[] = [
  { label: UX.hub.chips.semana, hint: 'build_weekly', seed: 'Monte a compra da semana' },
  { label: UX.hub.chips.adicionar, hint: 'add_items', seed: '' },
  { label: UX.hub.chips.mercado, hint: 'start_instore', seed: 'Estou no mercado' },
  { label: UX.hub.chips.escanear, hint: 'scan', seed: 'Escanear' },
];

const EAN_RE = /\b(\d{8}|\d{13})\b/;

/**
 * Hub PRECI — entrada de intenção (Fases 4–8).
 * Texto / voz / foto / chips → StructuredResponse → UI visual (não chatbot).
 */
export function HubPreciBar({
  className,
  mercadoId,
}: {
  className?: string;
  mercadoId?: string | null;
}) {
  const [text, setText] = useState('');
  const [clarify, setClarify] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { submit, busy } = useHubIntent(mercadoId);
  const { error: toastError } = useToast();
  const { supported: voiceOk, listening, error: voiceError, start: startVoice, stop: stopVoice } =
    useSpeechToText('pt-BR');

  const locked = busy || listening || photoBusy;

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const value = text.trim();
    if (!value || locked) return;
    const data = await submit(value);
    if (data?.ui.type === 'hub_clarify') {
      setClarify(true);
    } else {
      setText('');
      setClarify(false);
    }
  };

  const onChip = async (hint: HubIntentId, seed: string) => {
    if (hint === 'add_items' && !seed) {
      setClarify(false);
      document.getElementById('hub-preci-input')?.focus();
      return;
    }
    await submit(seed || hint, hint);
    setText('');
    setClarify(false);
  };

  const onMic = () => {
    if (listening) {
      stopVoice();
      return;
    }
    if (!voiceOk) {
      document.getElementById('hub-preci-input')?.focus();
      return;
    }
    startVoice((transcript) => {
      setText(transcript);
      void (async () => {
        const data = await submit(transcript, undefined, 'voice');
        if (data?.ui.type === 'hub_clarify') setClarify(true);
        else {
          setText('');
          setClarify(false);
        }
      })();
    });
  };

  const onPhotoClick = () => {
    if (locked) return;
    fileRef.current?.click();
  };

  const onPhotoChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || locked) return;

    setPhotoBusy(true);
    setClarify(false);
    try {
      const { texto, eans } = await processarFotoScan('etiqueta', file);
      const ean = eans.find((c) => /^\d{8}$|^\d{13}$/.test(c)) || texto.match(EAN_RE)?.[1];
      const input = ean
        ? ean
        : texto
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 200);

      if (!input) {
        toastError(UX.hub.fotoErro);
        return;
      }

      setText(input);
      const hint: HubIntentId | undefined = ean ? 'scan' : undefined;
      const data = await submit(input, hint, 'photo');
      if (data?.ui.type === 'hub_clarify') setClarify(true);
      else {
        setText('');
        setClarify(false);
      }
    } catch {
      toastError(UX.hub.fotoErro);
    } finally {
      setPhotoBusy(false);
    }
  };

  return (
    <div className={cn('rounded-2xl border border-slate-200 bg-white p-3 shadow-sm', className)}>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="sr-only"
        aria-hidden
        tabIndex={-1}
        onChange={(ev) => void onPhotoChange(ev)}
      />
      <form onSubmit={(e) => void onSubmit(e)} className="flex min-h-[48px] items-center gap-2">
        <div className="flex min-h-[48px] flex-1 items-center gap-2 rounded-xl bg-slate-50 px-3">
          <Search className="h-5 w-5 shrink-0 text-slate-400" aria-hidden />
          <input
            id="hub-preci-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder={UX.hub.placeholder}
            disabled={locked}
            autoComplete="off"
            className="min-w-0 flex-1 bg-transparent py-2.5 text-sm text-slate-800 placeholder:text-slate-500 focus:outline-none disabled:opacity-60"
            aria-label={UX.hub.placeholder}
          />
          <span className="flex shrink-0 items-center gap-0.5 text-slate-400">
            <button
              type="button"
              onClick={onPhotoClick}
              disabled={locked}
              className={cn(
                'rounded-lg p-2 transition-colors',
                photoBusy ? 'bg-primary-50 text-primary-700' : 'hover:bg-slate-200/80 text-slate-600'
              )}
              aria-label={UX.hub.foto}
            >
              {photoBusy ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            <button
              type="button"
              onClick={onMic}
              disabled={busy || photoBusy}
              className={cn(
                'rounded-lg p-2 transition-colors',
                listening
                  ? 'bg-red-100 text-red-600'
                  : voiceOk
                    ? 'hover:bg-slate-200/80 text-slate-600'
                    : 'opacity-40'
              )}
              aria-label={listening ? 'Parar ditado' : 'Falar o que a casa precisa'}
              aria-pressed={listening}
            >
              <Mic className={cn('h-4 w-4', listening && 'animate-pulse')} />
            </button>
            <Link
              href={buildScanHref(mercadoId)}
              className="rounded-lg p-2 hover:bg-slate-200/80"
              aria-label={UX.nav.scanner}
              onClick={(e) => e.stopPropagation()}
            >
              <ScanLine className="h-4 w-4" />
            </Link>
          </span>
        </div>
        <button
          type="submit"
          disabled={locked || !text.trim()}
          className="inline-flex min-h-[48px] min-w-[48px] items-center justify-center rounded-xl bg-primary-600 px-3 text-sm font-semibold text-white hover:bg-primary-700 disabled:opacity-50"
          aria-label="Enviar"
        >
          {busy && !photoBusy ? <Loader2 className="h-5 w-5 animate-spin" /> : 'Ir'}
        </button>
      </form>

      {photoBusy && (
        <p className="mt-2 px-1 text-xs text-primary-700" role="status">
          {UX.hub.fotoLendo}
        </p>
      )}
      {listening && (
        <p className="mt-2 px-1 text-xs text-primary-700" role="status">
          Ouvindo… diga, por exemplo: “Adiciona leite”.
        </p>
      )}
      {voiceError && (
        <p className="mt-2 px-1 text-xs text-amber-800" role="status">
          {voiceError}
        </p>
      )}
      {clarify && !listening && !photoBusy && (
        <p className="mt-2 px-1 text-xs text-amber-800" role="status">
          Não entendi bem — escolha uma tarefa ou diga, por exemplo: “Adiciona leite”.
        </p>
      )}

      <div className="mt-2 flex gap-2 overflow-x-auto pb-0.5 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {CHIPS.map((c) => (
          <button
            key={c.hint}
            type="button"
            disabled={locked}
            onClick={() => void onChip(c.hint, c.seed)}
            className="shrink-0 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition-colors hover:bg-slate-50 disabled:opacity-50"
          >
            {c.label}
          </button>
        ))}
      </div>
    </div>
  );
}
