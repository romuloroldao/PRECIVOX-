'use client';

import { useEffect, useState } from 'react';
import { useSession } from 'next-auth/react';
import { Bell, Loader2 } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = window.atob(base64);
  const arr = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
  return arr;
}

export function NotificacaoPermissaoBanner() {
  const { data: session } = useSession();
  const userId = (session?.user as { id?: string })?.id;
  const [hidden, setHidden] = useState(false);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'granted') setHidden(true);
    }
  }, []);

  const ativar = async () => {
    if (!userId) return;
    setLoading(true);
    try {
      if (!('Notification' in window) || !('serviceWorker' in navigator)) return;

      const perm = await Notification.requestPermission();
      if (perm !== 'granted') return;

      const vapidRes = await fetch('/api/notifications/vapid-public-key');
      if (!vapidRes.ok) {
        console.warn('[push] VAPID indisponível — configure VAPID_PUBLIC_KEY');
        setHidden(true);
        return;
      }
      const { publicKey } = await vapidRes.json();

      const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
      await navigator.serviceWorker.ready;

      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey) as BufferSource,
      });

      const json = sub.toJSON();
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          userId,
          platform: 'web',
          subscription: {
            endpoint: json.endpoint,
            keys: json.keys,
          },
        }),
      });

      setHidden(true);
    } catch (e) {
      console.error('[push] registro falhou', e);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted || hidden || !userId) return null;
  if (!('Notification' in window)) return null;
  if (Notification.permission === 'granted' || Notification.permission === 'denied') {
    return null;
  }

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
      <div className="flex items-center gap-2 text-sm text-blue-900">
        <Bell className="h-4 w-4 shrink-0" />
        <span>Ative avisos da cesta provável e do seu dia de mercado.</span>
      </div>
      <button
        type="button"
        disabled={loading}
        onClick={() => void ativar()}
        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60"
      >
        {loading && <Loader2 className="h-3 w-3 animate-spin" />}
        Ativar
      </button>
    </div>
  );
}
