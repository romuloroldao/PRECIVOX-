'use client';

import React from 'react';
import { CodeBlock } from './CodeBlock';

interface SectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  code?: string;
  className?: string;
}

export function Section({ title, description, children, code, className }: SectionProps) {
  return (
    <section className={`mb-12 ${className || ''}`}>
      <div className="mb-6">
        <h2 className="text-2xl md:text-3xl font-bold text-text-primary mb-2">{title}</h2>
        {description && (
          <p className="text-sm md:text-base text-text-secondary">{description}</p>
        )}
      </div>
      <div className="mb-6 p-6 bg-bg-paper rounded-lg border border-gray-200">
        {children}
      </div>
      {code && (
        <div className="mt-4">
          <CodeBlock code={code} />
        </div>
      )}
    </section>
  );
}
