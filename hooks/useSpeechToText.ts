'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

type SpeechRecognitionLike = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((ev: { results: ArrayLike<{ 0: { transcript: string }; isFinal: boolean }> }) => void) | null;
  onerror: ((ev: { error: string }) => void) | null;
  onend: (() => void) | null;
};

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike;
    webkitSpeechRecognition?: new () => SpeechRecognitionLike;
  };
  return w.SpeechRecognition || w.webkitSpeechRecognition || null;
}

/**
 * Atalho de voz → texto (Fase 6). Não é chatbot — só preenche a tarefa.
 */
export function useSpeechToText(lang = 'pt-BR') {
  const [supported, setSupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const recRef = useRef<SpeechRecognitionLike | null>(null);

  useEffect(() => {
    setSupported(Boolean(getSpeechRecognitionCtor()));
  }, []);

  const stop = useCallback(() => {
    try {
      recRef.current?.stop();
    } catch {
      /* ignore */
    }
    setListening(false);
  }, []);

  const start = useCallback(
    (onFinal: (transcript: string) => void) => {
      setError(null);
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setError('Seu navegador não suporta ditado por voz.');
        return;
      }
      try {
        recRef.current?.abort();
      } catch {
        /* ignore */
      }
      const rec = new Ctor();
      rec.lang = lang;
      rec.interimResults = false;
      rec.continuous = false;
      rec.onresult = (ev) => {
        const first = ev.results[0];
        const text = first?.[0]?.transcript?.trim();
        if (text) onFinal(text);
      };
      rec.onerror = (ev) => {
        if (ev.error === 'not-allowed' || ev.error === 'service-not-allowed') {
          setError('Permita o microfone para falar o que a casa precisa.');
        } else if (ev.error !== 'aborted' && ev.error !== 'no-speech') {
          setError('Não deu para ouvir. Tente de novo ou digite.');
        }
        setListening(false);
      };
      rec.onend = () => setListening(false);
      recRef.current = rec;
      setListening(true);
      try {
        rec.start();
      } catch {
        setError('Não foi possível iniciar o microfone.');
        setListening(false);
      }
    },
    [lang]
  );

  useEffect(() => () => {
    try {
      recRef.current?.abort();
    } catch {
      /* ignore */
    }
  }, []);

  return { supported, listening, error, start, stop };
}
