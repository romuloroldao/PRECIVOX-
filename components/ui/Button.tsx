'use client';

import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends Omit<React.ButtonHTMLAttributes<HTMLButtonElement>, 'className'> {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'outline' | 'gradient' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  icon?: LucideIcon;
  iconPosition?: 'left' | 'right';
  isLoading?: boolean;
  children: React.ReactNode;
  className?: string;
  onClick?: (event: React.MouseEvent<HTMLButtonElement>) => void;
  type?: 'button' | 'submit' | 'reset';
}

export function Button({
  variant = 'primary',
  size = 'md',
  icon: Icon,
  iconPosition = 'left',
  isLoading = false,
  disabled,
  className,
  children,
  ...props
}: ButtonProps) {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    secondary: 'bg-secondary-600 text-white hover:bg-secondary-700 focus:ring-secondary-500 shadow-sm hover:shadow-md',
    success: 'bg-success-600 text-white hover:bg-success-700 focus:ring-success-500 shadow-sm hover:shadow-md',
    warning: 'bg-warning-600 text-white hover:bg-warning-700 focus:ring-warning-500 shadow-sm hover:shadow-md',
    error: 'bg-error-600 text-white hover:bg-error-700 focus:ring-error-500 shadow-sm hover:shadow-md',
    outline: 'border-2 border-gray-300 text-text-primary hover:bg-bg-hover focus:ring-primary-500',
    gradient: 'bg-gradient-to-r from-primary-600 to-secondary-600 text-white hover:from-primary-700 hover:to-secondary-700 focus:ring-primary-500 shadow-sm hover:shadow-md',
    ghost: 'text-text-primary hover:bg-bg-hover focus:ring-primary-500',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-sm gap-2',
    md: 'px-4 py-2 text-sm md:text-base gap-2',
    lg: 'px-6 py-3 text-base md:text-lg gap-3',
  };

  return (
    <button
      className={cn(baseStyles, variants[variant], sizes[size], className)}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <>
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <span>Carregando...</span>
        </>
      ) : (
        <>
          {Icon && iconPosition === 'left' && <Icon className="w-4 h-4 md:w-5 md:h-5" />}
          {children}
          {Icon && iconPosition === 'right' && <Icon className="w-4 h-4 md:w-5 md:h-5" />}
        </>
      )}
    </button>
  );
}
