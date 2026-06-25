'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { X, Check, Search, ListChecks, MapPin, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step {
  id: string;
  label: string;
  description: string;
  icon: typeof Search;
  href: string;
}

const STEPS: Step[] = [
  {
    id: 'busca',
    label: 'Busque um produto',
    description: 'Procure algo que você compra sempre',
    icon: Search,
    href: '/cliente/busca',
  },
  {
    id: 'lista',
    label: 'Crie sua primeira lista',
    description: 'Adicione produtos e compare preços',
    icon: ListChecks,
    href: '/cliente/listas',
  },
  {
    id: 'localizacao',
    label: 'Ative sua localização',
    description: 'Para ver mercados perto de você',
    icon: MapPin,
    href: '/cliente/perfil',
  },
  {
    id: 'notificacoes',
    label: 'Ative alertas de preço',
    description: 'Saiba quando o preço cair',
    icon: Bell,
    href: '/cliente/perfil',
  },
];

const STORAGE_KEY = 'precivox_onboarding';

interface OnboardingState {
  dismissed: boolean;
  completed: string[];
}

function getState(): OnboardingState {
  if (typeof window === 'undefined') return { dismissed: false, completed: [] };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return { dismissed: false, completed: [] };
}

function saveState(state: OnboardingState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

/**
 * Checklist de primeiro acesso. Aparece até o usuário completar todas as etapas
 * ou fechar manualmente. Persiste progresso no localStorage.
 */
export function OnboardingChecklist() {
  const [state, setState] = useState<OnboardingState>({ dismissed: false, completed: [] });
  const [mounted, setMounted] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setState(getState());
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) saveState(state);
  }, [state, mounted]);

  if (!mounted || state.dismissed) return null;

  const allDone = STEPS.every((s) => state.completed.includes(s.id));
  if (allDone) return null;

  const completedCount = state.completed.length;
  const progress = (completedCount / STEPS.length) * 100;

  const dismiss = () => setState((prev) => ({ ...prev, dismissed: true }));

  const toggle = (id: string) => {
    setState((prev) => ({
      ...prev,
      completed: prev.completed.includes(id)
        ? prev.completed.filter((c) => c !== id)
        : [...prev.completed, id],
    }));
  };

  return (
    <section className="rounded-2xl border border-primary-100 bg-primary-50/50 p-4 sm:p-5">
      <div className="mb-3 flex items-start justify-between gap-2">
        <div>
          <h2 className="text-base font-bold text-slate-900">Primeiros passos</h2>
          <p className="mt-0.5 text-sm text-slate-600">
            Complete para aproveitar ao máximo o Precivox
          </p>
        </div>
        <button
          onClick={dismiss}
          aria-label="Fechar checklist"
          className="shrink-0 rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-white hover:text-slate-600"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Barra de progresso */}
      <div className="mb-4 h-2 overflow-hidden rounded-full bg-primary-100">
        <div
          className="h-full rounded-full bg-primary-600 transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>
      <p className="mb-3 text-xs font-medium text-slate-500">
        {completedCount} de {STEPS.length} concluídos
      </p>

      <ul className="flex flex-col gap-2">
        {STEPS.map((step) => {
          const done = state.completed.includes(step.id);
          const Icon = step.icon;
          return (
            <li key={step.id}>
              <button
                type="button"
                onClick={() => {
                  if (!done) {
                    toggle(step.id);
                    router.push(step.href);
                  } else {
                    toggle(step.id);
                  }
                }}
                className={cn(
                  'flex w-full items-center gap-3 rounded-xl px-3 py-3 text-left transition-colors',
                  done
                    ? 'bg-white/60 text-slate-400 line-through'
                    : 'bg-white shadow-sm hover:shadow-md'
                )}
              >
                <span
                  className={cn(
                    'flex h-8 w-8 shrink-0 items-center justify-center rounded-full',
                    done ? 'bg-success-100 text-success-600' : 'bg-primary-100 text-primary-600'
                  )}
                >
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-medium text-slate-800">{step.label}</span>
                  <span className="block text-xs text-slate-500">{step.description}</span>
                </span>
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
