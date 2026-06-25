'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Logo from '@/components/Logo';

const NAV_LINKS = [
  { href: '/consumidor', label: 'Como funciona' },
  { href: '/funcionalidades', label: 'Funcionalidades' },
  { href: '/demo', label: 'Contato' },
];

export default function MarketingNav() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center shrink-0" aria-label="PRECIVOX — Início">
            <Logo height={32} />
          </Link>

          <nav className="hidden md:flex items-center gap-1" aria-label="Principal">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === link.href || pathname.startsWith(`${link.href}/`)
                    ? 'text-blue-700 bg-blue-50'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm font-medium text-slate-600 hover:text-slate-900 px-3 py-2"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              className="text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg transition-colors"
            >
              Começar grátis
            </Link>
          </div>

          <button
            type="button"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100"
            aria-expanded={open}
            aria-controls="mobile-nav"
            aria-label={open ? 'Fechar menu' : 'Abrir menu'}
            onClick={() => setOpen(!open)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden>
              {open ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-nav"
          className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-1"
          aria-label="Menu mobile"
        >
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={`block px-3 py-2.5 rounded-lg text-sm font-medium ${
                pathname === link.href ? 'text-blue-700 bg-blue-50' : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              {link.label}
            </Link>
          ))}
          <div className="pt-3 flex flex-col gap-2 border-t border-slate-100 mt-2">
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="text-center text-sm font-medium text-slate-700 py-2.5 rounded-lg border border-slate-200"
            >
              Entrar
            </Link>
            <Link
              href="/signup"
              onClick={() => setOpen(false)}
              className="text-center text-sm font-semibold text-white bg-blue-600 py-2.5 rounded-lg"
            >
              Começar grátis
            </Link>
          </div>
        </nav>
      )}
    </header>
  );
}
