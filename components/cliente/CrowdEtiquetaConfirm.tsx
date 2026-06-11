'use client';

import { useState } from 'react';
import { Camera, Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { processarFotoScan } from '@/lib/scan-ocr-client';
import { extrairPrecoEtiqueta } from '@/lib/scan-ocr-parse';

interface CrowdEtiquetaConfirmProps {
  estoqueId: string;
  precoCatalogo: number;
  /** Texto OCR mesclado (fallback). */
  textoOcrInicial?: string;
  /** Texto da etiqueta de prateleira (prioridade). */
  textoEtiqueta?: string;
  /** Preço já detectado ou digitado. */
  precoEtiqueta?: number | null;
  className?: string;
  onConfirmado?: (confianca: number) => void;
}

export function CrowdEtiquetaConfirm({
  estoqueId,
  precoCatalogo,
  textoOcrInicial = '',
  textoEtiqueta,
  precoEtiqueta: precoProp,
  className,
  onConfirmado,
}: CrowdEtiquetaConfirmProps) {
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  const textoCrowd = (textoEtiqueta?.trim() || textoOcrInicial.trim());

  const resolverPreco = (texto: string, precoExtra?: number): number | null => {
    if (precoExtra != null && precoExtra > 0) return precoExtra;
    if (precoProp != null && precoProp > 0) return precoProp;
    return extrairPrecoEtiqueta(textoEtiqueta ?? '') ?? extrairPrecoEtiqueta(texto);
  };

  const confirmarComTexto = async (texto: string, precoEtiqueta?: number) => {
    if (!texto.trim() || loading) return;
    const preco = resolverPreco(texto, precoEtiqueta);
    if (preco == null) {
      setMsg('Informe ou fotografe o preço na etiqueta de prateleira.');
      return;
    }
    setLoading(true);
    setMsg(null);
    try {
      const res = await fetch('/api/cliente/crowd/confirmar-etiqueta', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          estoqueId,
          textoOcr: texto.trim(),
          precoEtiqueta: preco,
        }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error || 'Falha');
      setMsg(json.data.mensagem);
      setOk(json.data.match);
      if (json.data.match) onConfirmado?.(json.data.confianca);
    } catch (e) {
      setMsg(e instanceof Error ? e.message : 'Erro');
    } finally {
      setLoading(false);
    }
  };

  const onFotoEtiqueta = async (file: File) => {
    setLoading(true);
    setMsg(null);
    try {
      const { texto, eans } = await processarFotoScan('etiqueta', file);
      const merged = eans.length > 0 ? `${eans.join(' ')}\n${texto}`.trim() : texto;
      const preco = extrairPrecoEtiqueta(merged) ?? precoProp ?? undefined;
      await confirmarComTexto(merged || textoCrowd, preco ?? undefined);
    } catch {
      setMsg('Falha no OCR da etiqueta.');
      setLoading(false);
    }
  };

  if (ok && msg) {
    return (
      <p className={cn('mt-2 text-xs font-medium text-emerald-800', className)}>{msg}</p>
    );
  }

  return (
    <div className={cn('mt-3 rounded-lg border border-violet-200 bg-violet-50/80 p-2.5', className)}>
      <p className="text-[11px] font-semibold uppercase tracking-wide text-violet-800">
        Validar preço com foto da etiqueta
      </p>
      <p className="mt-1 text-[11px] text-violet-900/80">
        Catálogo: R$ {precoCatalogo.toFixed(2)}
        {precoProp != null && precoProp > 0 && (
          <> · Etiqueta: R$ {precoProp.toFixed(2)}</>
        )}
      </p>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {textoCrowd.length >= 2 && (
          <button
            type="button"
            disabled={loading}
            onClick={() => void confirmarComTexto(textoCrowd, precoProp ?? undefined)}
            className="inline-flex items-center gap-1 rounded-md bg-violet-700 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-violet-800 disabled:opacity-60"
          >
            {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            Confirmar leitura
          </button>
        )}
        <label className="inline-flex cursor-pointer items-center gap-1 rounded-md bg-white px-2.5 py-1.5 text-xs font-medium text-violet-900 ring-1 ring-violet-200 hover:bg-violet-50">
          <Camera className="h-3.5 w-3.5" />
          Foto etiqueta
          <input
            type="file"
            accept="image/*"
            capture="environment"
            className="sr-only"
            disabled={loading}
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void onFotoEtiqueta(f);
              e.target.value = '';
            }}
          />
        </label>
      </div>
      {msg && <p className={cn('mt-1.5 text-xs', ok ? 'text-emerald-700' : 'text-amber-800')}>{msg}</p>}
    </div>
  );
}
