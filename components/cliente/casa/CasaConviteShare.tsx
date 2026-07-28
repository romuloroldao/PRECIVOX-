'use client';

import { useState } from 'react';
import { Copy, MessageCircle, QrCode } from 'lucide-react';
import { CASA } from '@/lib/ux-copy-casa';
import { RAIO_FAMILIAR_MAX_MEMBROS } from '@/lib/raio-familiar-constants';

export function CasaConviteShare({
  nomeCasa,
  codigo,
  compact = false,
}: {
  nomeCasa: string;
  codigo: string;
  compact?: boolean;
}) {
  const [copiado, setCopiado] = useState(false);

  const copiar = () => {
    void navigator.clipboard.writeText(codigo);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2500);
  };

  const whatsapp = () => {
    const text = encodeURIComponent(CASA.convite.whatsappMsg(nomeCasa, codigo));
    window.open(`https://wa.me/?text=${text}`, '_blank', 'noopener,noreferrer');
  };

  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(codigo)}`;

  return (
    <div className={`rounded-xl border border-indigo-200 bg-indigo-50/80 ${compact ? 'p-3' : 'p-4'}`}>
      {!compact && (
        <p className="text-sm font-semibold text-indigo-950">{CASA.convite.titulo}</p>
      )}
      <div className="mt-3 flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <div className="flex shrink-0 flex-col items-center gap-1">
          <img
            src={qrUrl}
            alt={CASA.convite.qrAlt}
            width={120}
            height={120}
            className="rounded-lg border border-white bg-white p-1 shadow-sm"
          />
          <span className="flex items-center gap-1 text-[10px] text-indigo-600">
            <QrCode className="h-3 w-3" aria-hidden />
            Escaneie ou digite
          </span>
        </div>
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <code className="inline-block rounded-lg bg-white px-4 py-2 text-2xl font-bold tracking-[0.2em] text-indigo-900 shadow-sm">
            {codigo}
          </code>
          <p className="mt-2 text-xs text-indigo-700">{CASA.convite.limite(RAIO_FAMILIAR_MAX_MEMBROS)}</p>
          <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
            <button
              type="button"
              onClick={copiar}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
            >
              <Copy className="h-3.5 w-3.5" aria-hidden />
              {copiado ? CASA.convite.copiado : CASA.convite.copiar}
            </button>
            <button
              type="button"
              onClick={whatsapp}
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-600 bg-white px-3 py-2 text-xs font-semibold text-emerald-700 hover:bg-emerald-50"
            >
              <MessageCircle className="h-3.5 w-3.5" aria-hidden />
              {CASA.convite.whatsapp}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
