'use client';

/**
 * OCR on-device (Tesseract.js) — carregado sob demanda na página de scan.
 */

export type OcrProgresso = {
  status: string;
  progress: number;
};

export async function reconhecerTextoEtiqueta(
  imageSource: File | Blob | string,
  onProgress?: (p: OcrProgresso) => void
): Promise<string> {
  const { createWorker } = await import('tesseract.js');
  const worker = await createWorker('por', 1, {
    logger: (m) => {
      if (m.status === 'recognizing text' && onProgress) {
        onProgress({ status: m.status, progress: m.progress ?? 0 });
      }
    },
  });
  try {
    const { data } = await worker.recognize(imageSource);
    return (data.text ?? '').trim();
  } finally {
    await worker.terminate();
  }
}

/** EAN via BarcodeDetector nativo (Chrome/Android), quando disponível. */
export async function detectarCodigoBarrasImagem(
  source: ImageBitmapSource
): Promise<string[]> {
  if (typeof window === 'undefined') return [];
  const BD = (window as unknown as { BarcodeDetector?: new (o?: { formats: string[] }) => { detect: (s: ImageBitmapSource) => Promise<{ rawValue: string }[]> } }).BarcodeDetector;
  if (!BD) return [];
  try {
    const detector = new BD({
      formats: ['ean_13', 'ean_8', 'upc_a', 'code_128'],
    });
    const codes = await detector.detect(source);
    return codes.map((c) => c.rawValue.replace(/\D/g, '')).filter(Boolean);
  } catch {
    return [];
  }
}
